import { questions, type Answers, type Question, type QuestionId } from '../data/guidance';
import { assessCandidates } from './candidates';

export interface SummaryAnswer {
  id: QuestionId;
  label: string;
  value: string;
}

export function getFlow(input: Answers) {
  const answers: Answers = {};
  const visible: Question[] = [];
  const summary: SummaryAnswer[] = [];

  // Evaluate visibility from earlier answers only, so a selection cannot hide
  // itself and discarded follow-ups cannot prevent a platform from returning.
  for (const definition of questions) {
    const shortlist = assessCandidates(answers);
    if (!shortlist.active.length) break;
    if (definition.when && !definition.when(answers, shortlist.active.map(candidate => candidate.product.id))) continue;
    const question = {
      ...definition,
      choices: definition.choices.filter(choice => !choice.when || choice.when(answers)),
    };
    visible.push(question);
    const values = [...new Set(input[question.id] ?? [])].filter(value =>
      question.choices.some(choice => choice.id === value));
    if (!values.length || (!question.multiple && values.length !== 1)) continue;
    answers[question.id] = values;
    summary.push({
      id: question.id, label: question.label,
      value: question.choices.filter(choice => values.includes(choice.id)).map(choice => choice.label).join('; '),
    });
  }
  return {
    answers,
    questions: visible,
    summary,
    shortlist: assessCandidates(answers),
    missing: visible.filter(question => !answers[question.id]?.length),
  };
}
