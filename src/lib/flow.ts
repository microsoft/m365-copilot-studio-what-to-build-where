import { getApproach, questions, type Answers, type Choice, type Question, type QuestionId } from '../data/guidance';
import { assessCandidates } from './candidates';

export interface SummaryAnswer {
  id: QuestionId;
  label: string;
  value: string;
}

interface ResolvedChoice extends Omit<Choice, 'disabledReason'> {
  disabledReason?: string;
}

interface ResolvedQuestion extends Omit<Question, 'choices'> {
  choices: ResolvedChoice[];
  singleEnabledChoice?: ResolvedChoice;
}

export function getFlow(input: Answers) {
  const answers: Answers = {};
  const visible: ResolvedQuestion[] = [];
  const summary: SummaryAnswer[] = [];

  // Resolve visibility and availability from earlier answers only, so a choice
  // cannot disable itself and discarded answers cannot block returning platforms.
  for (const definition of questions) {
    const shortlist = assessCandidates(answers);
    if (!shortlist.active.length) break;
    if (definition.when && !definition.when(answers, shortlist.active.map(candidate => candidate.product.id))) continue;
    const choices = definition.choices.map(({ disabledReason, ...choice }) => ({
      ...choice, disabledReason: disabledReason?.(answers),
    }));
    const enabledChoices = choices.filter(choice => !choice.disabledReason);
    const question: ResolvedQuestion = {
      ...definition,
      choices,
      singleEnabledChoice: !definition.multiple && enabledChoices.length === 1 ? enabledChoices[0] : undefined,
    };
    visible.push(question);
    const values = enabledChoices.filter(choice => input[question.id]?.includes(choice.id))
      .map(choice => choice.id);
    if (!values.length || (!question.multiple && values.length !== 1)) continue;
    answers[question.id] = values;
    summary.push({
      id: question.id, label: question.label,
      value: question.choices.filter(choice => values.includes(choice.id)).map(choice => choice.label).join('; '),
    });
  }
  return {
    answers,
    approach: getApproach(answers),
    questions: visible,
    summary,
    shortlist: assessCandidates(answers),
    missing: visible.filter(question => !answers[question.id]?.length),
  };
}
