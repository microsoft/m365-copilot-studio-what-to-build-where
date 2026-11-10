import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { type Answers } from '../src/data/guidance';
import { feedbackUrl } from '../src/lib/feedback';

const answers: Answers = { audience: ['employees-m365'], direction: ['employee'], job: ['knowledge', 'actions'] };

test('feedback preserves template names and existing field IDs', () => {
  const general = new URL(feedbackUrl());
  assert.equal(general.origin + general.pathname, 'https://github.com/microsoft/m365-copilot-studio-what-to-build-where/issues/new');
  assert.equal(general.searchParams.get('template'), 'general-feedback.yml');
  assert.equal(general.searchParams.has('context'), false);
  assert.equal(general.searchParams.has('step'), false);
  const template = readFileSync(new URL('../.github/ISSUE_TEMPLATE/feedback.yml', import.meta.url), 'utf8');
  const generalTemplate = readFileSync(new URL('../.github/ISSUE_TEMPLATE/general-feedback.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(generalTemplate, /id: (area|step|context)\n/);
  assert.match(generalTemplate, /id: feedback\n/);
  for (const request of [{ kind: 'step', answers, questionId: 'job' }, { kind: 'result', answers }] as const) {
    const url = new URL(feedbackUrl(request));
    assert.equal(url.searchParams.get('template'), 'feedback.yml');
    assert.equal(url.searchParams.has('area'), false);
    for (const key of url.searchParams.keys()) {
      if (key !== 'template' && key !== 'title') assert.ok(template.includes(`id: ${key}\n`));
    }
  }
  assert.match(template, /- type: input\n\s+id: step\n/);
  assert.match(template, /- type: textarea\n\s+id: context\n/);
  assert.ok(template.indexOf('id: context\n') < template.indexOf('id: feedback\n'));
});

test('step context includes all selected jobs, not hidden answers or click history', () => {
  const input: Answers = { ...answers, complexity: ['complex'] };
  const context = new URL(feedbackUrl({ kind: 'step', questionId: 'job', answers: input })).searchParams.get('context')!;
  assert.match(context, /Answer questions or provide guidance; Take action in business systems/);
  assert.doesNotMatch(context, /Multi-step work across tools and documents/);
  assert.deepEqual(input.complexity, ['complex']);
  const empty = new URL(feedbackUrl({ kind: 'step', questionId: 'audience', answers: {} })).searchParams.get('context')!;
  assert.match(empty, /No answers recorded/);
  assert.match(empty, /Current step has no selection/);
  assert.doesNotMatch(empty, /Displayed selection/);
});

test('disabled and stale selections are omitted and hidden-step requests are rejected', () => {
  const context = new URL(feedbackUrl({
    kind: 'step', questionId: 'audience', answers: { audience: ['customers-voice'], direction: ['employee'], job: ['actions'] },
  })).searchParams.get('context')!;
  assert.match(context, /No answers recorded/);
  assert.doesNotMatch(context, /Customers using voice|Take action in business systems/);
  assert.throws(() => feedbackUrl({ kind: 'step', questionId: 'job', answers: { audience: ['customers-web'] } }), /visible question/);
});

test('result context preserves the preferred approach, coverage check and conditional alternative', () => {
  const context = new URL(feedbackUrl({ kind: 'result', answers })).searchParams.get('context')!;
  assert.match(context, /Preferred starting point: Cowork/);
  assert.match(context, /existing or custom plugins/);
  assert.match(context, /If coverage is incomplete/);
  assert.match(context, /Other displayed approaches:/);
  assert.match(context, /declarative agent: pro-code authoring/);
  const studio = new URL(feedbackUrl({
    kind: 'result', answers: { audience: ['customers-web'], complexity: ['routine'] },
  })).searchParams.get('context')!;
  assert.match(studio, /Microsoft Copilot harness/);
  assert.match(studio, /only for extending an existing agent/);
  assert.throws(() => feedbackUrl({ kind: 'result', answers: {} }), /completed assessment/);
});
