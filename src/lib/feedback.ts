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
  const subject = request.kind === 'general' ? 'General feedback' :
    request.kind === 'step' ? 'A specific step' : 'Recommendation';
  url.searchParams.set('title', `[Feedback] ${subject}`);
  if (request.kind === 'general') return url.href;

  const flow = getFlow(request.answers);
  const context = ['Agent platform guidance (Draft)', '', 'Current selected requirements:'];
  if (!flow.summary.length) context.push('No answers recorded.');
  flow.summary.forEach(answer => context.push(`- ${answer.label}: ${answer.value}`));

  if (request.kind === 'step') {
    const question = flow.questions.find(question => question.id === request.questionId);
    if (!question) throw new Error('Step feedback requires a visible question.');
    url.searchParams.set('step', question.title);
    url.searchParams.set('title', `[Feedback] ${question.title}`);
    context.push('', `Current step: ${question.title}`);
    if (!flow.answers[question.id]?.length) {
      context.push(question.singleEnabledChoice
        ? `Displayed selection (not yet confirmed): ${question.singleEnabledChoice.label}`
        : 'Current step has no selection.');
    }
  } else {
    url.searchParams.set('step', 'Recommendation');
    const result = recommend(flow.answers);
    if (result.status === 'incomplete') throw new Error('Result feedback requires a completed assessment.');
    context.push('', `Result: ${result.status === 'review' ? 'Needs review' : 'Recommended starting point'}`,
      `Platform: ${result.primary?.product.shortName ?? 'No single recommendation'}`);
    const notes = [...new Set([...result.issues, ...(result.primary?.confirmations ?? []), ...(result.primary?.product.review ?? [])])];
    if (notes.length) context.push('', 'Requirements and items to validate:', ...notes.map(note => `- ${note}`));
  }
  url.searchParams.set('context', context.join('\n'));
  return url.href;
}
