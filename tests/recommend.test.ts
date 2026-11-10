import assert from 'node:assert/strict';
import { test } from 'node:test';
import { documentation, questions, type Answers } from '../src/data/guidance';
import { getFlow } from '../src/lib/flow';
import { recommend } from '../src/lib/recommend';
import { deploymentConfig } from '../scripts/deployment-config.mjs';

const employee = (job: string[]): Answers => ({
  audience: ['employees-m365'], direction: ['employee'], job,
});
const process = (complexity: string, audience = 'employees-m365'): Answers => ({
  audience: [audience],
  ...(audience === 'employees-m365' ? { direction: ['organization'] } : {}),
  complexity: [complexity],
});

test('all seven employee-job combinations preserve cumulative requirements and their rationale', () => {
  for (let mask = 1; mask < 8; mask++) {
    const jobs = ['knowledge', 'actions', 'complex'].filter((_, bit) => mask & (1 << bit));
    const input = employee(jobs);
    const flow = getFlow(input);
    const result = recommend(input);
    assert.equal(flow.questions.length, 3);
    assert.equal(flow.missing.length, 0);
    assert.deepEqual(flow.answers.job, jobs);
    assert.equal(result.id, mask === 1 ? 'builder' : 'cowork');
    for (const [value, prefix] of [
      ['knowledge', 'Questions and guidance:'],
      ['actions', 'Business-system actions:'],
      ['complex', 'Cross-app and document work:'],
    ]) assert.equal(result.reasons.some(reason => reason.startsWith(prefix)), jobs.includes(value));
    assert.equal(Boolean(result.coverageFallback), jobs.includes('actions'));
    if (jobs.includes('actions')) {
      assert.match(result.guidance!, /existing or custom plugins/);
      assert.match(result.coverageFallback!, /custom.*(?:plugins|integrations)/);
    }
    if (jobs.includes('complex')) {
      assert.equal(result.options.length, 0);
      if (jobs.includes('actions')) assert.match(result.coverageFallback!, /does not automatically provide Cowork's cross-app/);
    } else if (jobs.includes('actions')) {
      assert.equal(result.options.length, 1);
      assert.match(result.options[0].title, /declarative agent: pro-code/);
      assert.equal(result.options[0].extendedBy[0].implementation, 'developer');
    }
  }
});

test('all enabled audiences and use-case types retain Microsoft Copilot harness as the preferred managed approach', () => {
  for (const audience of ['employees-m365', 'employees-web', 'customers-web']) {
    for (const complexity of ['routine', 'complex']) {
      const input = process(complexity, audience);
      const flow = getFlow(input);
      const result = recommend(input);
      assert.equal(flow.questions.length, audience === 'employees-m365' ? 3 : 2);
      assert.equal(result.id, 'microsoft');
      assert.match(result.title, /Microsoft Copilot harness/);
      assert.equal(result.options.length, complexity === 'routine' ? 1 : 0);
      if (complexity === 'routine') {
        const standard = result.options[0];
        assert.equal(standard.consideration, 'existing-standard');
        assert.match(standard.description, /only for extending an existing agent/);
        assert.match(standard.note!, /This guidance prefers upgrading/);
        assert.equal(standard.authoringExperience, 'Copilot Studio');
        assert.equal(standard.extendedBy[0].implementation, 'configuration');
        assert.notDeepEqual(standard.documentation, result.documentation);
      }
      assert.equal(result.extendedBy[0].name, 'Knowledge sources, skills, MCP servers, tools and workflows');
      assert.equal(result.extendedBy[0].implementation, 'configuration');
      assert.ok(result.considerations.some(note => note.includes('does not support voice')));
      assert.ok(result.extensibilityOptions?.some(option => option.documentationNote === 'Custom handover pattern coming soon.'));
      if (audience === 'customers-web') assert.match(result.authentication!, /anonymous access or Microsoft Entra ID/);
      else if (audience === 'employees-web') {
        assert.match(result.authentication!, /Microsoft Entra ID/);
        assert.doesNotMatch(result.authentication!, /anonymous/);
      } else assert.equal(result.authentication, undefined);
    }
  }
});

test('normalization rejects unknown and disabled values without mutating input', () => {
  const input: Answers = {
    audience: ['employees-m365', 'customers-voice'],
    direction: ['employee', 'organization'],
    job: ['actions', 'unknown', 'knowledge'],
    complexity: ['complex'],
  };
  const before = structuredClone(input);
  const flow = getFlow(input);
  assert.deepEqual(input, before);
  assert.deepEqual(flow.answers, employee(['knowledge', 'actions']));
  assert.deepEqual(getFlow({ audience: ['customers-voice'] }).answers, {});
  assert.equal(getFlow({}).questions.length, 1);
  assert.throws(() => recommend({}), /all relevant questions/);
});

test('changing audience or direction clears hidden answers and does not restore discarded values', () => {
  const start = getFlow(employee(['knowledge', 'actions']));
  const changed = getFlow({ ...start.answers, direction: ['organization'] });
  assert.equal(changed.answers.job, undefined);
  assert.equal(changed.missing[0].id, 'complexity');
  const restored = getFlow({ ...changed.answers, direction: ['employee'] });
  assert.equal(restored.answers.job, undefined);
  assert.equal(restored.missing[0].id, 'job');
  const web = getFlow({ ...start.answers, audience: ['employees-web'] });
  assert.deepEqual(web.answers, { audience: ['employees-web'] });
  assert.deepEqual(web.questions.map(question => question.id), ['audience', 'complexity']);
});

test('configuration, required pro-code implementation and optional deeper extensibility remain distinct', () => {
  assert.deepEqual(questions.map(question => question.id), ['audience', 'direction', 'job', 'complexity']);
  const builder = recommend(employee(['knowledge']));
  assert.equal(builder.authoringExperience, 'Agent Builder');
  assert.match(builder.guidance!, /Create and configure this agent in Agent Builder/);
  assert.match(builder.terminology!, /replacing the Agents page with Plugins/);
  assert.match(builder.terminology!, /Declarative agents remain the conversational component/);
  assert.ok(builder.considerations.some(note => note.includes('does not author custom external-service actions')));
  const cowork = recommend(employee(['actions']));
  assert.equal(cowork.extendedBy[0].developerCondition, 'unsupported-operation');
  assert.equal(cowork.options[0].extendedBy[0].implementation, 'developer');
  for (const result of [builder, cowork, recommend(process('routine'))]) {
    for (const approach of [result, ...result.options]) {
      assert.ok(approach.considerations.length >= 2);
      assert.equal(approach.documentation.filter(link => /licensing/i.test(link.label)).length, 1);
    }
  }
});

test('SDK guidance does not select a runtime, imply native voice, or apply a handover roadmap to Standard', () => {
  const result = recommend(process('routine', 'customers-web'));
  const sdk = result.extensibilityOptions!.find(option => option.id === 'sdk')!;
  const standardSdk = result.options[0].extensibilityOptions!.find(option => option.id === 'sdk')!;
  assert.match(sdk.description, /custom orchestration using your own model/);
  assert.match(sdk.considerations![0], /built-in publishing options/);
  assert.equal(standardSdk.documentationNote, undefined);
  assert.ok(result.extensibilityOptions!.some(option => option.id === 'agents'));
  assert.ok(result.documentation.some(link => link.url === documentation.microsoftLicensing.url));
  assert.ok(result.options[0].documentation.some(link => link.url === documentation.standardLicensing.url));
});

test('deployment supports root and project paths and rejects malformed settings', () => {
  assert.deepEqual(deploymentConfig({}), { site: undefined, base: '/' });
  assert.deepEqual(deploymentConfig({ SITE_URL: 'https://microsoft.github.io', BASE_PATH: '/example' }),
    { site: 'https://microsoft.github.io', base: '/example/' });
  assert.equal(deploymentConfig({ BASE_PATH: '//example//path/' }).base, '/example/path/');
  for (const base of ['relative', '/example?query', '/example#fragment', '/example\\path']) {
    assert.throws(() => deploymentConfig({ BASE_PATH: base }), /BASE_PATH/);
  }
  for (const site of ['file:///tmp/site', 'https://example.com/project/']) {
    assert.throws(() => deploymentConfig({ SITE_URL: site }), /SITE_URL/);
  }
});
