import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasMultipleChannels, products, questions, type Answers } from '../src/data/guidance';
import { getFlow } from '../src/lib/flow';
import { assessCandidates } from '../src/lib/candidates';
import { recommend } from '../src/lib/recommend';
import { deploymentConfig } from '../scripts/deployment-config.mjs';

const base: Answers = {
  job: ['knowledge'], audience: ['employees'], ownership: ['user'],
  architecture: ['managed'], channels: ['m365'], autonomy: ['prompted'],
  integration: ['connectors'], existing: ['new'],
};

const jobChoices = ['knowledge', 'actions', 'reasoning'];
const jobCombinations = Array.from({ length: 7 }, (_, mask) =>
  jobChoices.filter((_, index) => (mask + 1) & (1 << index)));

test('covers each of the six outcome candidates with explicit review where needed', () => {
  const scenarios = [
    { answers: {}, product: 'builder', status: 'recommended' },
    { answers: { job: ['actions'] }, product: 'studio', status: 'recommended' },
    { answers: { job: ['actions'], existing: ['standard'] }, product: 'standard', status: 'recommended' },
    { answers: { job: ['reasoning'] }, product: 'studio', status: 'recommended' },
    { answers: { autonomy: ['personal'] }, product: 'cowork', status: 'review' },
    { answers: { job: ['actions'], integration: ['apis'] }, product: 'toolkit', status: 'review' },
    { answers: { architecture: ['own'] }, product: 'sdk', status: 'recommended' },
  ];
  for (const scenario of scenarios) {
    const result = recommend({ ...base, ...scenario.answers });
    assert.equal(result.primary?.product.id, scenario.product);
    assert.equal(result.status, scenario.status);
    assert.equal(result.alternatives.length + result.excluded.length, 5);
    assert.ok(result.alternatives.every(candidate => candidate.blockers.length === 0));
    assert.equal(new Set(result.candidates.map(candidate => candidate.product.id)).size, 6);
  }
});

test('a custom website does not force SDK, and fixed-rule actions do not force Standard', () => {
  assert.equal(recommend({ ...base, channels: ['web'] }).primary?.product.id, 'studio');
  assert.equal(recommend({ ...base, job: ['actions'] }).primary?.product.id, 'studio');
});

test('handles organization direction, customer audience, and both audiences explicitly', () => {
  for (const override of [{ ownership: ['organization'] }, { job: ['actions'], audience: ['customers'], channels: ['web'] }, { job: ['actions'], audience: ['both'], channels: ['web'] }]) {
    const result = recommend({ ...base, ...override });
    assert.equal(result.primary?.product.id, 'studio');
    assert.equal(result.status, 'recommended');
    assert.ok(result.candidates.find(c => c.product.id === 'builder')?.blockers.length);
  }
});

test('autonomy does not get routed to prompted-only products', () => {
  const personal = recommend({ ...base, autonomy: ['personal'] });
  assert.equal(personal.primary?.product.id, 'cowork');
  assert.equal(personal.status, 'review');
  for (const id of ['builder', 'toolkit']) assert.ok(personal.candidates.find(c => c.product.id === id)?.blockers.length);
  const organization = recommend({ ...base, ownership: ['organization'], autonomy: ['organization'] });
  assert.equal(organization.primary?.product.id, 'studio');
  assert.equal(organization.status, 'recommended');
});

test('contradictory ownership and autonomy choices are never forced into a winner', () => {
  for (const override of [
    { ownership: ['user'], autonomy: ['organization'] },
    { ownership: ['organization'], autonomy: ['personal'] },
  ]) {
    const result = recommend({ ...base, ...override });
    assert.equal(result.status, 'review');
    assert.ok(result.issues.length > 0);
    assert.equal(result.primary, undefined);
    assert.equal(result.alternatives.length, 0);
    assert.equal(result.excluded.length, 6);
  }
});

test('voice and handover distinguish known, unknown, and unsupported paths', () => {
  const voice = recommend({ ...base, channels: ['voice'] });
  assert.equal(voice.primary?.product.id, 'standard');
  assert.equal(voice.status, 'recommended');
  assert.ok(voice.candidates.find(c => c.product.id === 'studio')?.confirmations.some(c => c.includes('Voice')));
  const handover = recommend({ ...base, channels: ['web', 'handover'] });
  assert.equal(handover.primary?.product.id, 'standard');
  assert.ok(handover.candidates.find(c => c.product.id === 'studio')?.blockers.length);
  const ownVoice = recommend({ ...base, architecture: ['own'], channels: ['voice', 'handover'] });
  assert.equal(ownVoice.primary?.product.id, 'sdk');
  assert.equal(ownVoice.status, 'review');
});

test('review state preserves unresolved multi-channel, Toolkit, and Standard reasoning claims', () => {
  for (const override of [
    { channels: ['m365', 'web'] },
    { job: ['actions'], integration: ['apis'] },
    { job: ['reasoning'], existing: ['standard'] },
    { existing: ['standard'], ownership: ['organization'], autonomy: ['organization'] },
  ]) {
    const result = recommend({ ...base, ...override });
    assert.equal(result.status, 'review');
    assert.ok(result.primary?.confirmations.length);
  }
});

test('normalization removes stale branches and invalid or duplicate values', () => {
  const clean = getFlow(base).answers;
  assert.equal(clean.integration, undefined);
  assert.equal(clean.existing, undefined);
  const own = getFlow({ ...base, job: ['actions'], architecture: ['own'] }).answers;
  assert.equal(own.integration, undefined);
  assert.equal(own.existing, undefined);
  assert.deepEqual(getFlow({ ...base, channels: ['m365', 'm365', 'nope'] }).answers.channels, ['m365']);
  assert.deepEqual(getFlow({ ...base, job: ['knowledge', 'actions', 'actions', 'nope'] }).answers.job, ['knowledge', 'actions']);
  assert.equal(getFlow({ ...base, job: ['actions'], audience: ['employees', 'customers'] }).answers.audience, undefined);
  assert.equal(getFlow({ ...base, ownership: ['user', 'organization'] }).answers.ownership, undefined);
  const retiredJob = getFlow({ job: ['employee-guided'] });
  assert.equal(retiredJob.answers.job, undefined);
  assert.equal(retiredJob.answers.ownership, undefined);
  assert.equal(recommend({ ...base, job: ['nope'] }).status, 'incomplete');
  assert.equal(recommend({}).status, 'incomplete');
  assert.equal(getFlow({ ...base, channels: ['multi'] }).answers.channels, undefined);
});

test('multi-channel requirements come from selected channels, excluding handover', () => {
  assert.equal(hasMultipleChannels({}), false);
  for (const channels of [['m365'], ['web'], ['voice'], ['handover'], ['m365', 'm365'], ['m365', 'handover'], ['web', 'handover'], ['voice', 'handover']]) {
    assert.equal(hasMultipleChannels({ channels }), false);
    const studio = getFlow({ channels }).shortlist.candidates.find(candidate => candidate.product.id === 'studio');
    assert.ok(!studio?.confirmations.some(note => note.includes('every channel')));
  }
  for (const channels of [['m365', 'web'], ['m365', 'voice'], ['web', 'voice'], ['m365', 'web', 'voice', 'handover']]) {
    assert.equal(hasMultipleChannels({ channels }), true);
    const studio = getFlow({ channels }).shortlist.candidates.find(candidate => candidate.product.id === 'studio');
    assert.ok(studio?.confirmations.some(note => note.includes('every channel')));
  }
  const multiple = recommend({ ...base, channels: ['m365', 'web'] });
  assert.equal(multiple.primary?.product.id, 'studio');
  assert.equal(multiple.status, 'review');
  const single = recommend({ ...base, channels: ['web'] });
  assert.equal(single.primary?.product.id, 'studio');
  assert.equal(single.status, 'recommended');
});

test('branch visibility follows the requirements, not stale answers', () => {
  assert.equal(getFlow(base).questions.length, 6);
  assert.equal(getFlow({ ...base, job: ['actions'] }).questions.length, 8);
  assert.equal(getFlow({ ...base, architecture: ['own'], job: ['actions'] }).questions.length, 6);
  assert.equal(getFlow({ ...base, job: ['knowledge', 'actions'] }).questions.length, 8);
});

test('unanswered questions never exclude platforms or trigger capability warnings', () => {
  const empty = getFlow({});
  assert.equal(empty.shortlist.applicable.length, 6);
  assert.equal(empty.shortlist.conditional.length, 0);
  assert.equal(empty.shortlist.excluded.length, 0);
  assert.equal(empty.shortlist.issues.length, 0);
  assert.equal(recommend({}).candidates.length, 6);
  assert.deepEqual(assessCandidates({}).candidates.flatMap(candidate => candidate.reasons), []);
  const firstAnswer = getFlow({ job: ['actions'] }).shortlist;
  assert.deepEqual(firstAnswer.excluded.map(candidate => candidate.product.id), ['builder']);
  assert.equal(firstAnswer.active.length, 5);
  assert.equal(firstAnswer.candidates.find(candidate => candidate.product.id === 'toolkit')?.confirmations.length, 0);
});

test('explicit requirements progressively narrow the shortlist', () => {
  const expected: [Answers, string[]][] = [
    [{ ownership: ['organization'] }, ['builder', 'cowork']],
    [{ architecture: ['own'] }, ['builder', 'studio', 'standard', 'cowork', 'toolkit']],
    [{ autonomy: ['personal'] }, ['builder', 'toolkit']],
    [{ audience: ['customers'] }, ['builder', 'cowork', 'toolkit']],
    [{ channels: ['web'] }, ['builder', 'cowork', 'toolkit']],
    [{ channels: ['handover'] }, ['builder', 'studio', 'cowork', 'toolkit']],
  ];
  for (const [answers, excluded] of expected) {
    assert.deepEqual(getFlow(answers).shortlist.excluded.map(candidate => candidate.product.id), excluded);
  }
  const voice = getFlow({ channels: ['voice'] }).shortlist;
  assert.ok(voice.conditional.some(candidate => candidate.product.id === 'studio'));
  assert.ok(voice.applicable.some(candidate => candidate.product.id === 'standard'));
  assert.equal(voice.active.length, 3);
});

test('jobs are multi-select and control is always an independent second question', () => {
  assert.equal(questions[0].multiple, true);
  assert.equal(questions[1].id, 'ownership');
  assert.notEqual(questions[1].multiple, true);
  for (const job of jobCombinations) {
    const flow = getFlow({ job });
    assert.deepEqual(flow.answers.job, job);
    assert.deepEqual(flow.questions.slice(0, 3).map(question => question.id), ['job', 'ownership', 'audience']);
    assert.equal(flow.answers.ownership, undefined);
    assert.equal(flow.summary.length, 1);
    for (const ownership of ['user', 'organization']) {
      const answered = getFlow({ job, ownership: [ownership] });
      const edited = getFlow({ ...answered.answers, job: ['knowledge'] });
      assert.deepEqual(edited.answers.ownership, [ownership]);
      assert.equal(edited.summary[1].id, 'ownership');
    }
  }
});

test('every selected job contributes its blockers and confirmations', () => {
  for (const job of jobCombinations) {
    const combined = assessCandidates({ job });
    const singleJobs = job.map(value => assessCandidates({ job: [value] }));
    for (const [index, candidate] of combined.candidates.entries()) {
      assert.deepEqual(new Set(candidate.blockers), new Set(singleJobs.flatMap(single => single.candidates[index].blockers)));
      assert.deepEqual(new Set(candidate.confirmations), new Set(singleJobs.flatMap(single => single.candidates[index].confirmations)));
    }
    const forward = recommend({ ...base, job });
    const reversed = recommend({ ...base, job: [...job].reverse() });
    assert.deepEqual(forward, reversed);
    assert.equal(forward.primary?.product.id, job.includes('actions') || job.includes('reasoning') ? 'studio' : 'builder');
    const summary = getFlow({ ...base, job }).summary.find(answer => answer.id === 'job');
    assert.equal(summary?.value, questions[0].choices.filter(choice => job.includes(choice.id)).map(choice => choice.label).join('; '));
  }
  const allJobs = { ...base, job: jobChoices };
  const standard = recommend({ ...allJobs, existing: ['standard'] });
  assert.equal(standard.primary?.product.id, 'standard');
  assert.equal(standard.status, 'review');
  const toolkit = recommend({ ...allJobs, integration: ['apis'] });
  assert.equal(toolkit.primary?.product.id, 'toolkit');
  assert.equal(toolkit.status, 'review');
  assert.ok(toolkit.primary?.confirmations.some(note => note.includes('complex reasoning')));
  const partial = getFlow({ job: jobChoices });
  const reduced = getFlow({ ...partial.answers, job: ['knowledge'] });
  assert.equal(reduced.shortlist.active.length, 6);
  assert.equal(reduced.shortlist.conditional.length, 0);
  const removed = getFlow({ ...partial.answers, job: [] });
  assert.equal(removed.answers.job, undefined);
  assert.equal(recommend(removed.answers).status, 'incomplete');
});

test('employee-directed business actions retain Cowork subject to plugin confirmation', () => {
  const directed = recommend({ ...base, job: ['knowledge', 'actions'] });
  assert.equal(directed.primary?.product.id, 'studio');
  const cowork = directed.alternatives.find(candidate => candidate.product.id === 'cowork');
  assert.ok(cowork);
  assert.ok(cowork.confirmations.some(note => note.includes('plugins')));
  const organization = recommend({ ...base, job: ['knowledge', 'actions'], ownership: ['organization'] });
  assert.ok(organization.excluded.some(candidate => candidate.product.id === 'cowork'));
  assert.equal(recommend({ ...base, job: ['actions'], audience: ['customers'], channels: ['web'] }).primary?.product.id, 'studio');
});

test('customer audiences hide Microsoft 365 workspace and prune only that channel', () => {
  assert.ok(getFlow({}).questions.find(question => question.id === 'channels')?.choices.some(choice => choice.id === 'm365'));
  for (const audience of ['customers', 'both']) {
    const employee = getFlow({ ...base, job: ['actions'], channels: ['m365', 'web'] });
    const changed = getFlow({ ...employee.answers, audience: [audience] });
    assert.deepEqual(changed.questions.find(question => question.id === 'channels')?.choices.map(choice => choice.id), ['web', 'voice', 'handover']);
    assert.deepEqual(changed.answers.channels, ['web']);
    assert.equal(hasMultipleChannels(changed.answers), false);
    assert.equal(changed.summary.find(answer => answer.id === 'channels')?.value, 'A website or custom app');
    const empty = getFlow({ ...base, job: ['actions'], audience: [audience] });
    assert.equal(empty.answers.channels, undefined);
    assert.equal(empty.answers.integration, undefined);
    assert.ok(empty.missing.some(question => question.id === 'channels'));
    assert.equal(recommend(empty.answers).status, 'incomplete');
    const restored = getFlow({ ...changed.answers, audience: ['employees'] });
    assert.ok(restored.questions.find(question => question.id === 'channels')?.choices.some(choice => choice.id === 'm365'));
    assert.deepEqual(restored.answers.channels, ['web']);
    const sdk = getFlow({ ...changed.answers, architecture: ['own'] });
    assert.ok(!sdk.questions.find(question => question.id === 'channels')?.choices.some(choice => choice.id === 'm365'));
  }
});

test('the Microsoft 365 job restricts audience choices and clears incompatible answers', () => {
  for (const job of jobCombinations) {
    const flow = getFlow({ job });
    assert.deepEqual(
      flow.questions.find(question => question.id === 'audience')?.choices.map(choice => choice.id),
      job.includes('knowledge') ? ['employees'] : ['employees', 'customers', 'both'],
    );
  }
  for (const audience of ['customers', 'both']) {
    const customer = getFlow({ ...base, job: ['actions'], audience: [audience], channels: ['web'] });
    assert.equal(recommend(customer.answers).status, 'recommended');
    const changed = getFlow({ ...customer.answers, job: ['knowledge', 'actions'] });
    assert.equal(changed.answers.audience, undefined);
    assert.ok(!changed.summary.some(answer => answer.id === 'audience'));
    assert.deepEqual(changed.missing.map(question => question.id), ['audience']);
    assert.equal(recommend(changed.answers).status, 'incomplete');
    const restored = getFlow({ ...changed.answers, job: ['actions'] });
    assert.equal(restored.questions.find(question => question.id === 'audience')?.choices.length, 3);
    assert.equal(restored.answers.audience, undefined);
    const corrected = getFlow({ ...changed.answers, audience: ['employees'] });
    assert.deepEqual(corrected.answers.audience, ['employees']);
    assert.equal(recommend(corrected.answers).status, 'recommended');
  }
});

test('candidate exclusions remove irrelevant follow-ups and their stale values', () => {
  const autonomous = getFlow({ ...base, job: ['actions'], autonomy: ['personal'], integration: ['apis'] });
  assert.equal(autonomous.answers.integration, undefined);
  assert.ok(!autonomous.questions.some(question => question.id === 'integration'));
  assert.equal(recommend(autonomous.answers).primary?.product.id, 'cowork');
  const web = getFlow({ ...base, job: ['actions'], channels: ['web', 'm365'], integration: ['apis'] });
  assert.equal(web.answers.integration, undefined);
  assert.equal(recommend(web.answers).primary?.product.id, 'studio');
  const handover = getFlow({ ...base, channels: ['handover'], existing: ['standard'] });
  assert.equal(handover.answers.existing, undefined);
  assert.ok(!handover.questions.some(question => question.id === 'existing'));
  const one = getFlow({ ...base, architecture: ['own'], job: ['actions'] });
  assert.equal(one.shortlist.active.length, 1);
  assert.ok(one.questions.some(question => question.id === 'channels'));
  assert.ok(one.questions.some(question => question.id === 'autonomy'));
  const edited = getFlow({ ...one.answers, architecture: ['managed'] });
  assert.ok(edited.questions.some(question => question.id === 'integration'));
  assert.equal(edited.answers.integration, undefined);
  assert.equal(recommend(edited.answers).status, 'incomplete');
});

test('incompatible answers produce an early no-match result and editing restores candidates', () => {
  const blocked = getFlow({ ...base, job: ['actions', 'reasoning'], ownership: ['organization'], autonomy: ['personal'] });
  assert.equal(blocked.shortlist.active.length, 0);
  assert.equal(blocked.questions.length, 6);
  const result = recommend(blocked.answers);
  assert.equal(result.status, 'review');
  assert.equal(result.primary, undefined);
  assert.equal(result.alternatives.length, 0);
  const revised = getFlow({ ...blocked.answers, ownership: ['user'] });
  assert.equal(revised.shortlist.active.length, 4);
  assert.equal(revised.questions.length, 7);
  assert.equal(recommend(revised.answers).status, 'incomplete');
});

test('exhaustive combinations never mark blocked or unconfirmed must-haves as recommended', () => {
  const channels = ['m365', 'web', 'voice', 'handover'];
  let count = 0;
  for (const job of jobCombinations)
  for (const audience of ['employees', 'customers', 'both'])
  for (const ownership of ['user', 'organization'])
  for (const architecture of ['managed', 'own'])
  for (const autonomy of ['prompted', 'personal', 'organization'])
  for (const integration of ['connectors', 'apis'])
  for (const existing of ['new', 'standard'])
  for (let mask = 1; mask < 16; mask += 1) {
    const answers: Answers = {
      job, audience: [audience], ownership: [ownership], architecture: [architecture],
      autonomy: [autonomy], integration: [integration], existing: [existing],
      channels: channels.filter((_, index) => mask & (1 << index)),
    };
    const result = recommend(answers);
    const incompatibleAudience = job.includes('knowledge') && audience !== 'employees';
    const missingChannel = !incompatibleAudience && audience !== 'employees' &&
      answers.channels?.length === 1 && answers.channels[0] === 'm365';
    const conflictingControl = (ownership === 'user' && autonomy === 'organization') ||
      (ownership === 'organization' && autonomy === 'personal');
    if ((incompatibleAudience || missingChannel) && !conflictingControl) {
      assert.equal(result.status, 'incomplete');
      assert.ok(result.issues.some(issue => issue.includes(incompatibleAudience ? 'Who will use it?' : 'Where does it need to work?')));
    } else {
      assert.notEqual(result.status, 'incomplete');
      assert.ok(result.primary?.reasons.length || result.status === 'review');
    }
    assert.equal(result.candidates.length, products.length);
    assert.ok(result.alternatives.every(candidate => !candidate.blockers.length));
    if (result.primary) assert.equal(result.primary.blockers.length, 0);
    assert.equal(result.alternatives.length + result.excluded.length + Number(!!result.primary), 6);
    if (result.status === 'recommended') {
      assert.equal(result.primary?.blockers.length, 0);
      assert.equal(result.primary?.confirmations.length, 0);
      assert.equal(result.issues.length, 0);
    }
    if (architecture === 'own' && result.primary) assert.equal(result.primary.product.id, 'sdk');
    count += 1;
  }
  assert.equal(count, 15120);
});

test('deployment supports root and repository paths, rejects malformed settings', () => {
  assert.deepEqual(deploymentConfig({}), { site: undefined, base: '/' });
  assert.deepEqual(deploymentConfig({ SITE_URL: 'https://example.github.io', BASE_PATH: '/finder' }), { site: 'https://example.github.io', base: '/finder/' });
  assert.equal(deploymentConfig({ BASE_PATH: '/' }).base, '/');
  assert.throws(() => deploymentConfig({ BASE_PATH: 'finder' }));
  assert.throws(() => deploymentConfig({ BASE_PATH: '/finder?oops' }));
  assert.throws(() => deploymentConfig({ SITE_URL: 'https://example.github.io/finder/' }));
});
