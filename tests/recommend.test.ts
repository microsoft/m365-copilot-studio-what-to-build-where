import assert from 'node:assert/strict';
import { test } from 'node:test';
import { approaches, hasMultipleChannels, prerequisites, products, questions, type Answers } from '../src/data/guidance';
import { getFlow } from '../src/lib/flow';
import { assessCandidates } from '../src/lib/candidates';
import { recommend } from '../src/lib/recommend';
import { feedbackUrl } from '../src/lib/feedback';
import { deploymentConfig } from '../scripts/deployment-config.mjs';

const employee: Answers = { approach: ['employee'], job: ['knowledge'], autonomy: ['prompted'] };
const automation: Answers = { approach: ['automation'], audience: ['employees'], channels: ['m365'] };
const custom: Answers = { approach: ['custom'], architecture: ['managed'] };
const ids = (answers: Answers) => getFlow(answers).shortlist.active.map(candidate => candidate.product.id);
const steps = (answers: Answers) => getFlow(answers).questions.map(question => question.id);
const combinations = (choices: string[]) => Array.from({ length: (1 << choices.length) - 1 },
  (_, mask) => choices.filter((_, index) => (mask + 1) & (1 << index)));

test('approaches narrow to their current pair without treating outside platforms as unsupported', () => {
  assert.deepEqual(approaches.map(approach => approach.products), [
    ['builder', 'cowork'], ['studio', 'standard'], ['toolkit', 'sdk'],
  ]);
  for (const approach of approaches) {
    const flow = getFlow({ approach: [approach.id] });
    assert.deepEqual(ids(flow.answers), approach.products);
    assert.equal(flow.shortlist.excluded.length, 0);
    assert.equal(flow.shortlist.outside.length, 4);
    assert.ok(flow.shortlist.outside.every(candidate => candidate.outsideApproach && !candidate.blockers.length));
    assert.equal(recommend(flow.answers).status, 'incomplete');
  }
  assert.deepEqual(steps({}), ['approach']);
  assert.equal(getFlow({}).shortlist.active.length, 6);
  assert.deepEqual(getFlow({}).shortlist.candidates.flatMap(candidate =>
    [...candidate.blockers, ...candidate.confirmations, ...candidate.reasons]), []);
  assert.equal(recommend({}).primary, undefined);
  assert.equal(recommend({}).status, 'incomplete');
});

test('all six outcomes are reachable in two or three questions with scoped alternatives', () => {
  const scenarios: [Answers, string, string, number][] = [
    [employee, 'builder', 'recommended', 3],
    [{ ...employee, job: ['reasoning'] }, 'cowork', 'recommended', 2],
    [{ ...employee, job: ['actions'] }, 'cowork', 'review', 2],
    [{ ...employee, autonomy: ['personal'] }, 'cowork', 'review', 3],
    [automation, 'studio', 'recommended', 3],
    [{ ...automation, channels: ['web', 'handover'] }, 'standard', 'recommended', 3],
    [custom, 'toolkit', 'review', 2],
    [{ ...custom, architecture: ['own'] }, 'sdk', 'recommended', 2],
  ];
  for (const [answers, product, status, count] of scenarios) {
    const result = recommend(answers);
    assert.equal(result.primary?.product.id, product);
    assert.equal(result.status, status);
    assert.equal(steps(answers).length, count);
    assert.ok(result.alternatives.length <= 1);
    assert.equal(result.alternatives.length + result.excluded.length + result.outside.length, 5);
    const scope = getFlow(answers).approach!.products;
    assert.ok(result.alternatives.every(candidate => scope.includes(candidate.product.id) && !candidate.blockers.length));
    assert.ok(result.primary?.reasons.length);
    assert.ok(prerequisites[result.primary!.product.id].length);
  }
});

test('employee jobs are cumulative and explaining a process is distinct from actions', () => {
  const jobQuestion = questions.find(question => question.id === 'job')!;
  assert.equal(jobQuestion.multiple, true);
  for (const job of combinations(['knowledge', 'actions', 'reasoning'])) {
    const answers = { ...employee, job };
    const result = recommend(answers);
    assert.deepEqual(result, recommend({ ...answers, job: [...job].reverse() }));
    assert.equal(result.primary?.product.id, job.includes('actions') || job.includes('reasoning') ? 'cowork' : 'builder');
    const flow = getFlow(answers);
    assert.equal(flow.summary.find(answer => answer.id === 'job')?.value,
      jobQuestion.choices.filter(choice => job.includes(choice.id)).map(choice => choice.label).join('; '));
    assert.equal(steps(answers).includes('autonomy'), job.length === 1 && job[0] === 'knowledge');
    if (job.includes('actions')) {
      assert.ok(result.primary?.confirmations.some(note => note.includes('plugins')));
      assert.ok(result.excluded.find(candidate => candidate.product.id === 'builder')?.blockers.some(note => note.includes('writes')));
    }
  }
  assert.equal(recommend({ approach: ['employee'] }).primary, undefined);
  assert.equal(recommend({ approach: ['employee'], job: ['knowledge'] }).status, 'incomplete');
});

test('hidden checks are prerequisites rather than fabricated recorded answers', () => {
  const scoped = getFlow({ ...employee, job: ['actions'], audience: ['customers'], channels: ['voice'],
    architecture: ['own'], ownership: ['organization'], integration: ['apis'] });
  assert.deepEqual(scoped.answers, { approach: ['employee'], job: ['actions'] });
  assert.deepEqual(scoped.summary.map(answer => answer.id), ['approach', 'job']);
  assert.deepEqual(steps(automation), ['approach', 'audience', 'channels']);
  assert.deepEqual(steps(custom), ['approach', 'architecture']);
  assert.ok(prerequisites.cowork.some(note => /scheduling/i.test(note)));
  assert.ok(prerequisites.standard.some(note => /complex reasoning.*autonomous triggers/.test(note)));
  assert.ok(prerequisites.sdk.some(note => /Voice, human handover.*not supplied/.test(note)));
  assert.ok(prerequisites.toolkit.some(note => /unprompted execution/.test(note)));
});

test('switching routes and hiding follow-ups never restores discarded answers', () => {
  const original = getFlow({ ...employee, autonomy: ['personal'] });
  const actions = getFlow({ ...original.answers, job: ['actions'] });
  assert.equal(actions.answers.autonomy, undefined);
  const knowledge = getFlow({ ...actions.answers, job: ['knowledge'] });
  assert.equal(knowledge.answers.autonomy, undefined);
  assert.equal(recommend(knowledge.answers).status, 'incomplete');
  const switched = getFlow({ ...original.answers, approach: ['automation'] });
  assert.deepEqual(switched.answers, { approach: ['automation'] });
  const returned = getFlow({ ...switched.answers, approach: ['employee'] });
  assert.deepEqual(returned.answers, { approach: ['employee'] });
  assert.deepEqual(getFlow({ ...automation, approach: [] }).answers, {});
  assert.equal(getFlow({ ...automation, approach: [] }).shortlist.active.length, 6);
});

test('normalization rejects invalid, hidden, disabled, and multiple single-choice selections', () => {
  assert.deepEqual(getFlow({ approach: ['nope'], job: ['actions'], architecture: ['own'] }).answers, {});
  assert.deepEqual(getFlow({ approach: ['employee', 'custom'], job: ['actions'] }).answers, {});
  assert.deepEqual(getFlow({ ...employee, job: ['reasoning', 'knowledge', 'reasoning', 'nope'] }).answers.job,
    ['knowledge', 'reasoning']);
  assert.equal(getFlow({ ...custom, architecture: ['own', 'managed'] }).answers.architecture, undefined);
  assert.equal(getFlow({ ...employee, autonomy: ['organization'] }).answers.autonomy, undefined);
  assert.equal(recommend({ ...employee, autonomy: ['organization'] }).status, 'incomplete');
  assert.deepEqual(getFlow({ job: ['knowledge'], ownership: ['user'], channels: ['m365'] }).answers, {});
});

test('customer audiences disable Microsoft 365 workspace and preserve other channels', () => {
  for (const audience of ['customers', 'both']) {
    const original = getFlow({ ...automation, channels: ['m365', 'web'] });
    const changed = getFlow({ ...original.answers, audience: [audience] });
    const choices = changed.questions.find(question => question.id === 'channels')!.choices;
    assert.deepEqual(choices.map(choice => choice.id), ['m365', 'web', 'voice', 'handover']);
    assert.match(choices[0].disabledReason!, /Choose "Employees"/);
    assert.ok(choices.slice(1).every(choice => !choice.disabledReason));
    assert.deepEqual(changed.answers.channels, ['web']);
    assert.equal(hasMultipleChannels(changed.answers), false);
    const restored = getFlow({ ...changed.answers, audience: ['employees'] });
    assert.equal(restored.questions.find(question => question.id === 'channels')!.choices[0].disabledReason, undefined);
    assert.deepEqual(restored.answers.channels, ['web']);
    assert.equal(recommend({ ...automation, audience: [audience] }).status, 'incomplete');
  }
  assert.equal(getFlow({ approach: ['automation'] }).questions.find(question => question.id === 'channels')!.choices[0].disabledReason, undefined);
});

test('voice and handover exclude GitHub Copilot Harness while non-voice multi-channel checks remain explicit', () => {
  const voice = getFlow({ ...automation, channels: ['voice'] });
  assert.deepEqual(ids(voice.answers), ['standard']);
  assert.ok(voice.shortlist.excluded.find(candidate => candidate.product.id === 'studio')?.blockers.some(note => note.includes('Voice is required')));
  assert.equal(recommend(voice.answers).primary?.product.id, 'standard');
  const handover = getFlow({ ...voice.answers, channels: ['voice', 'handover'] });
  assert.deepEqual(ids(handover.answers), ['standard']);
  assert.ok(handover.shortlist.excluded[0].blockers.some(note => note.includes('handover')));
  assert.deepEqual(ids({ ...handover.answers, channels: ['voice'] }), ['standard']);
  assert.deepEqual(ids({ ...handover.answers, channels: ['handover'] }), ['standard']);
  assert.deepEqual(ids({ ...handover.answers, channels: ['web'] }), ['studio', 'standard']);
  assert.equal(hasMultipleChannels({ channels: ['web', 'handover'] }), false);
  assert.equal(hasMultipleChannels({ channels: ['m365', 'web'] }), true);
  const multiple = recommend({ ...automation, channels: ['m365', 'web'] });
  assert.equal(multiple.primary?.product.id, 'studio');
  assert.equal(multiple.status, 'review');
  assert.ok(multiple.primary?.confirmations.some(note => note.includes('every channel')));
  assert.equal(recommend({ ...automation, channels: ['web'] }).status, 'recommended');
});

test('automation always prefers GitHub Copilot Harness except for voice or handover across all audiences and channel combinations', () => {
  for (const audience of ['employees', 'customers', 'both']) {
    for (const channels of combinations(['m365', 'web', 'voice', 'handover'])) {
      const answers = { ...automation, audience: [audience], channels };
      const result = recommend(answers);
      const flow = getFlow(answers);
      if (flow.missing.length) {
        assert.equal(result.status, 'incomplete');
        continue;
      }
      const needsStandard = channels.includes('voice') || channels.includes('handover');
      assert.equal(result.primary?.product.id, needsStandard ? 'standard' : 'studio');
      if (needsStandard) {
        assert.ok(result.excluded.some(candidate => candidate.product.id === 'studio'));
        assert.equal(result.alternatives.length, 0);
      }
    }
  }
});

test('website embedding and fixed-rule steps do not force SDK or Standard', () => {
  const result = recommend({ ...automation, channels: ['web'] });
  assert.equal(result.primary?.product.id, 'studio');
  assert.ok(result.outside.some(candidate => candidate.product.id === 'sdk'));
  const standard = products.find(product => product.id === 'standard')!;
  assert.ok(standard.watch.some(note => note.includes('Fixed-rule business steps alone')));
  assert.ok(standard.watch.some(note => note.includes('not the default choice for new agents')));
  assert.ok(result.primary?.product.watch.some(note => note.includes('existing Copilot Studio agent')));
  assert.ok(questions.every(question => !['ownership', 'integration', 'existing'].includes(question.id)));
});

test('managed runtime excludes SDK and editing or clearing it restores candidates', () => {
  const managed = getFlow(custom);
  assert.deepEqual(ids(custom), ['toolkit']);
  assert.ok(managed.shortlist.excluded.find(candidate => candidate.product.id === 'sdk')?.blockers.some(note => note.includes('platform-managed runtime')));
  assert.ok(recommend(custom).primary?.reasons.some(note => note.includes('developer-owned integrations')));
  const own = getFlow({ ...managed.answers, architecture: ['own'] });
  assert.deepEqual(ids(own.answers), ['sdk']);
  assert.deepEqual(getFlow({ ...own.answers, architecture: ['managed'] }), managed);
  assert.deepEqual(ids({ ...managed.answers, architecture: [] }), ['toolkit', 'sdk']);
  assert.equal(recommend({ ...managed.answers, architecture: [] }).status, 'incomplete');
});

test('raw capability conflict checks still block incompatible must-haves without switching routes', () => {
  for (const answers of [
    { approach: ['employee'], architecture: ['own'] },
    { approach: ['employee'], autonomy: ['organization'] },
    { approach: ['automation'], autonomy: ['personal'] },
    { ownership: ['user'], autonomy: ['organization'] },
    { ownership: ['organization'], autonomy: ['personal'] },
  ]) {
    assert.equal(assessCandidates(answers).active.length, 0);
  }
  const sdk = assessCandidates({ approach: ['custom'], architecture: ['own'], channels: ['voice', 'handover'], autonomy: ['organization'] });
  assert.deepEqual(sdk.active.map(candidate => candidate.product.id), ['sdk']);
  assert.ok(sdk.active[0].confirmations.some(note => note.includes('SDK alone')));
  assert.ok(sdk.active[0].confirmations.some(note => note.includes('autonomous orchestration')));
});

test('all route combinations meet question budgets and preserve candidate and review invariants', () => {
  const cases: Answers[] = [];
  for (const job of combinations(['knowledge', 'actions', 'reasoning']))
    for (const autonomy of ['prompted', 'personal']) cases.push({ ...employee, job, autonomy: [autonomy] });
  for (const audience of ['employees', 'customers', 'both'])
    for (const channels of combinations(['m365', 'web', 'voice', 'handover']))
      cases.push({ ...automation, audience: [audience], channels });
  for (const architecture of ['managed', 'own']) cases.push({ ...custom, architecture: [architecture] });
  for (const answers of cases) {
    const flow = getFlow(answers);
    const result = recommend(answers);
    assert.ok(flow.questions.length >= 2 && flow.questions.length <= 3);
    assert.deepEqual(getFlow(flow.answers), flow);
    assert.equal(result.candidates.length, 6);
    assert.equal(result.alternatives.length + result.excluded.length + result.outside.length + Number(!!result.primary), 6);
    assert.ok(result.alternatives.every(candidate => !candidate.blockers.length && !candidate.outsideApproach));
    if (result.status === 'incomplete') {
      assert.equal(result.primary, undefined);
      assert.ok(flow.missing.length);
    } else {
      assert.ok(feedbackUrl({ kind: 'result', answers }).length < 6000);
      assert.ok(result.primary && !result.primary.blockers.length && !result.primary.outsideApproach);
      assert.equal(result.status === 'review', result.primary.confirmations.length > 0);
    }
  }
  assert.equal(cases.length, 61);
});

test('deployment supports root and repository paths, rejects malformed settings', () => {
  assert.deepEqual(deploymentConfig({}), { site: undefined, base: '/' });
  assert.deepEqual(deploymentConfig({ SITE_URL: 'https://example.github.io', BASE_PATH: '/finder' }), { site: 'https://example.github.io', base: '/finder/' });
  assert.equal(deploymentConfig({ BASE_PATH: '/' }).base, '/');
  assert.throws(() => deploymentConfig({ BASE_PATH: 'finder' }));
  assert.throws(() => deploymentConfig({ BASE_PATH: '/finder?oops' }));
  assert.throws(() => deploymentConfig({ SITE_URL: 'https://example.github.io/finder/' }));
});
