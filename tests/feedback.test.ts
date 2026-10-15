import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { type Answers } from '../src/data/guidance';
import { feedbackUrl } from '../src/lib/feedback';
import { recommend } from '../src/lib/recommend';

const answers: Answers = { approach: ['automation'], audience: ['employees'], channels: ['m365', 'web'] };

test('feedback links preserve general and contextual templates and existing field IDs', () => {
  const general = new URL(feedbackUrl());
  assert.equal(general.origin + general.pathname,
    'https://github.com/microsoft/m365-copilot-studio-what-to-build-where/issues/new');
  assert.equal(general.searchParams.get('template'), 'general-feedback.yml');
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

test('step feedback includes approach and current jobs without inferring skipped answers', () => {
  const input: Answers = { approach: ['employee'], job: ['knowledge', 'actions'], audience: ['customers'], autonomy: ['personal'] };
  const context = new URL(feedbackUrl({ kind: 'step', questionId: 'job', answers: input })).searchParams.get('context')!;
  assert.match(context, /Approach: Employee-guided work in Microsoft 365/);
  assert.match(context, /Answer questions or guide people in Microsoft 365; Take action in business systems/);
  assert.match(context, /Selected approach scope:/);
  assert.doesNotMatch(context, /- Audience:|- Autonomy:|- Behavior:|- Channels:/);
  assert.deepEqual(input.audience, ['customers']);
  const empty = new URL(feedbackUrl({ kind: 'step', questionId: 'approach', answers: {} })).searchParams.get('context')!;
  assert.match(empty, /No answers recorded/);
  assert.match(empty, /Current step has no selection/);
  assert.doesNotMatch(empty, /Displayed selection/);
});

test('disabled channels and stale route selections are omitted from feedback', () => {
  const context = new URL(feedbackUrl({
    kind: 'step', questionId: 'channels',
    answers: { ...answers, audience: ['both'], job: ['actions'], integration: ['apis'] },
  })).searchParams.get('context')!;
  assert.match(context, /A website or custom app/);
  assert.doesNotMatch(context, /Microsoft 365 workspace|Integrations:|The job:/);
});

test('result feedback preserves harness identity, uncertainty, and unconfirmed prerequisite distinction', () => {
  const context = new URL(feedbackUrl({ kind: 'result', answers })).searchParams.get('context')!;
  assert.match(context, /Result: Needs review/);
  assert.match(context, /Platform: Copilot Studio · GitHub Copilot Harness/);
  for (const note of recommend(answers).primary!.confirmations) assert.ok(context.includes(note));
  assert.match(context, /What you need in place: prerequisites and next steps/);
  assert.match(context, /They were not confirmed by your assessment answers/);
  assert.doesNotMatch(context, /- Autonomy:|- Behavior:/);
  assert.throws(() => feedbackUrl({ kind: 'result', answers: {} }), /completed assessment/);
  assert.throws(() => feedbackUrl({ kind: 'result', answers: { approach: ['custom'] } }), /completed assessment/);
  assert.throws(() => feedbackUrl({ kind: 'step', questionId: 'channels',
    answers: { approach: ['custom'], architecture: ['own'] } }), /visible question/);
});
