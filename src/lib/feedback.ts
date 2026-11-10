import { type Answers, type QuestionId } from '../data/guidance';
import { getFlow } from './flow';
import { recommend } from './recommend';

type FeedbackRequest =
  | { kind: 'general' }
  | { kind: 'step'; answers: Answers; questionId: QuestionId }
  | { kind: 'result'; answers: Answers };

export function feedbackUrl(request: FeedbackRequest = { kind: 'general' }): string {
  const url = new URL('https://github.com/microsoft/m365-copilot-studio-what-to-build-where/issues/new');
  url.searchParams.set('template', request.kind === 'general' ? 'general-feedback.yml' : 'feedback.yml');
  url.searchParams.set('title', `[Feedback] ${request.kind === 'general' ? 'General feedback' : request.kind === 'step' ? 'A specific step' : 'Recommendation'}`);
  if (request.kind === 'general') return url.href;

  const flow = getFlow(request.answers);
  const context = ['Agent platform guidance (Draft)', '', 'Current selected requirements:'];
  if (!flow.summary.length) context.push('No answers recorded.');
  for (const answer of flow.summary) context.push(`- ${answer.label}: ${answer.value}`);

  if (request.kind === 'step') {
    const question = flow.questions.find(item => item.id === request.questionId);
    if (!question) throw new Error('Step feedback requires a visible question.');
    url.searchParams.set('step', question.title);
    url.searchParams.set('title', `[Feedback] ${question.title}`);
    context.push('', `Current step: ${question.title}`);
    if (!flow.answers[question.id]?.length) context.push('Current step has no selection.');
  } else {
    if (flow.missing.length) throw new Error('Result feedback requires a completed assessment.');
    const result = recommend(flow.answers);
    url.searchParams.set('step', 'Recommendation');
    context.push('', `Preferred starting point: ${result.title}`,
      'Confirm the required knowledge, integrations, access and publishing support before implementation.');
    if (result.guidance) context.push(result.guidance);
    if (result.coverageFallback) context.push(result.coverageFallback);
    if (result.authentication) context.push(result.authentication);
    context.push('', 'Considerations:', ...result.considerations.map(note => `- ${note}`));
    if (result.options.length) {
      context.push('', 'Other displayed approaches:');
      for (const option of result.options) context.push(`- ${option.title}: ${option.description}`);
    }
  }
  url.searchParams.set('context', context.join('\n'));
  return url.href;
}
