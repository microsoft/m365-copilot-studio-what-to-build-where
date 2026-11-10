import { questions, type Answers, type Question, type QuestionId } from '../data/guidance';

export interface SummaryAnswer {
  id: QuestionId;
  label: string;
  value: string;
}

export function getFlow(input: Answers = {}) {
  const answers: Answers = {};
  const visible: Question[] = [];
  const summary: SummaryAnswer[] = [];

  for (const question of questions) {
    if (!question.when(answers)) continue;
    visible.push(question);
    const enabled = question.choices.filter(choice => !choice.disabledReason?.(answers));
    let values = enabled.filter(choice => input[question.id]?.includes(choice.id))
      .map(choice => choice.id);
    if (!question.multiple) values = values.slice(0, 1);
    if (!values.length) continue;
    answers[question.id] = values;
    summary.push({
      id: question.id,
      label: question.title,
      value: enabled.filter(choice => values.includes(choice.id)).map(choice => choice.label).join('; '),
    });
  }

  return {
    answers,
    questions: visible,
    summary,
    missing: visible.filter(question => !answers[question.id]?.length),
  };
}
