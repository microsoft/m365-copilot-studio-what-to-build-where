import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { type Answers } from '../src/data/guidance';
import { feedbackUrl } from '../src/lib/feedback';
import { recommend } from '../src/lib/recommend';

const answers: Answers = {
  job: ['knowledge', 'actions'], ownership: ['user'], audience: ['employees'],
  architecture: ['managed'], channels: ['m365', 'web'], autonomy: ['prompted'],
  integration: ['connectors'],
};

test('feedback links select general or contextual templates without a category question', () => {
  const general = new URL(feedbackUrl());
  assert.equal(general.origin + general.pathname,
    'https://github.com/microsoft/m365-copilot-studio-what-to-build-where/issues/new');
  assert.equal(general.searchParams.get('template'), 'general-feedback.yml');
  assert.equal(general.searchParams.has('area'), false);
  assert.equal(general.searchParams.has('context'), false);
  assert.equal(general.searchParams.has('step'), false);
  const template = readFileSync(new URL('../.github/ISSUE_TEMPLATE/feedback.yml', import.meta.url), 'utf8');
  const generalTemplate = readFileSync(new URL('../.github/ISSUE_TEMPLATE/general-feedback.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(generalTemplate, /id: (area|step|context)\n/);
  assert.match(generalTemplate, /id: feedback\n/);
  assert.match(generalTemplate, /id: suggestion\n/);
  for (const kind of ['step', 'result'] as const) {
    const url = new URL(feedbackUrl({ kind, answers, questionId: 'channels' }));
    assert.equal(url.searchParams.get('template'), 'feedback.yml');
    assert.equal(url.searchParams.has('area'), false);
    assert.equal(url.searchParams.get('step'), kind === 'step' ? 'Where does it need to work?' : 'Recommendation');
    for (const key of url.searchParams.keys()) {
      if (key !== 'template' && key !== 'title') assert.ok(template.includes(`id: ${key}\n`));
    }
  }
  assert.doesNotMatch(template, /id: area\n/);
  assert.match(template, /- type: input\n\s+id: step\n/);
  assert.match(template, /- type: textarea\n\s+id: context\n/);
  assert.ok(template.indexOf('id: context\n') < template.indexOf('id: feedback\n'));
});

test('step feedback includes combined selections and removes stale hidden answers', () => {
  const url = new URL(feedbackUrl({
    kind: 'step', questionId: 'channels',
    answers: { ...answers, job: ['actions'], audience: ['both'], integration: ['apis'] },
  }));
  assert.equal(url.searchParams.get('step'), 'Where does it need to work?');
  const context = url.searchParams.get('context')!;
  assert.match(context, /Take action in business systems/);
  assert.match(context, /A website or custom app/);
  assert.doesNotMatch(context, /Microsoft 365 workspace|Integrations:/);
  const jobs = new URL(feedbackUrl({ kind: 'step', questionId: 'job', answers })).searchParams.get('context')!;
  assert.match(jobs, /Answer questions or guide people in Microsoft 365; Take action in business systems/);
});

test('preselected audience remains unconfirmed without mutating answers', () => {
  const partial: Answers = { job: ['knowledge'], ownership: ['user'] };
  const context = new URL(feedbackUrl({ kind: 'step', questionId: 'audience', answers: partial })).searchParams.get('context')!;
  assert.match(context, /Displayed selection \(not yet confirmed\): Employees/);
  assert.doesNotMatch(context, /- Audience:/);
  assert.equal(partial.audience, undefined);
});

test('result feedback preserves harness identity, review notes, and no-match results', () => {
  const context = new URL(feedbackUrl({ kind: 'result', answers })).searchParams.get('context')!;
  assert.match(context, /Result: Needs review/);
  assert.match(context, /Platform: Copilot Studio · GitHub Copilot Harness/);
  for (const note of recommend(answers).primary!.confirmations) assert.ok(context.includes(note));
  const conflict = { ...answers, ownership: ['organization'], autonomy: ['personal'] };
  const noMatch = new URL(feedbackUrl({ kind: 'result', answers: conflict })).searchParams.get('context')!;
  assert.match(noMatch, /No single recommendation/);
  for (const issue of recommend(conflict).issues) assert.ok(noMatch.includes(issue));
  assert.throws(() => feedbackUrl({ kind: 'result', answers: {} }), /completed assessment/);
  assert.throws(() => feedbackUrl({
    kind: 'step', questionId: 'integration', answers: { architecture: ['own'] },
  }), /visible question/);
});
