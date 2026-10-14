import { has, relatedGuidance, type Answers } from '../data/guidance';
import { recommend } from '../lib/recommend';
import { type Candidate } from '../lib/candidates';
import { getFlow } from '../lib/flow';
import { withBase } from '../lib/url';
import { feedbackUrl } from '../lib/feedback';

function element<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Required finder element is missing: ${selector}`);
  return node;
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const value = document.createElement(tag);
  value.className = className;
  if (text) value.textContent = text;
  return value;
}

const root = element('#finder');
const form = element<HTMLFormElement>('#question-form');
const content = element('#question-content');
const result = element('#result');
const summary = element('#answer-summary');
const error = element('#form-error');
const back = element<HTMLButtonElement>('#back');
const next = element<HTMLButtonElement>('#continue');
const restart = element<HTMLButtonElement>('#restart');
const sidebarTabs = [element<HTMLButtonElement>('#shortlist-tab'), element<HTMLButtonElement>('#requirements-tab')];
const sidebarPanels = [element('#platform-shortlist'), element('#requirements')];
let answers: Answers = {};
let step = 0;

function updateFeedback(flow: ReturnType<typeof getFlow>, complete: boolean) {
  const link = element<HTMLAnchorElement>('#context-feedback-link');
  link.textContent = complete ? 'Give feedback on this recommendation' : 'Give feedback on this step';
  link.href = feedbackUrl(complete
    ? { kind: 'result', answers: flow.answers }
    : { kind: 'step', answers: flow.answers, questionId: flow.questions[step].id });
}

function selectSidebarTab(index: number, focus = false) {
  sidebarTabs.forEach((tab, position) => {
    const selected = position === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    sidebarPanels[position].hidden = !selected;
  });
  if (focus) sidebarTabs[index].focus();
}
sidebarTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectSidebarTab(index));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    selectSidebarTab(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index, true);
  });
  element('#shortlist-jump').addEventListener('click', () => {
    selectSidebarTab(0, true);
    sidebarTabs[0].scrollIntoView({ block: 'center', behavior: 'instant' });
  });
});
root.hidden = false;

function focusHeading() {
  const heading = (form.hidden ? result : content).querySelector<HTMLElement>('[data-focus]');
  heading?.focus({ preventScroll: true });
  if (heading && (heading.getBoundingClientRect().top < 80 || heading.getBoundingClientRect().top > innerHeight * 0.6)) {
    heading.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
}

function renderSummary(flow: ReturnType<typeof getFlow>) {
  summary.replaceChildren();
  for (const answer of flow.summary) {
    const item = node('li');
    const button = node('button', 'summary-answer');
    button.type = 'button';
    button.setAttribute('aria-label', `Edit ${answer.label}: ${answer.value}`);
    button.append(node('span', 'summary-label', answer.label), node('span', 'summary-value', answer.value), node('span', 'edit-label', 'Edit'));
    button.addEventListener('click', () => {
      step = getFlow(answers).questions.findIndex(question => question.id === answer.id);
      render();
    });
    item.append(button);
    summary.append(item);
  }
  const count = flow.summary.length;
  element('#answer-count').textContent = String(count);
  element('#empty-summary').hidden = count > 0;
  restart.disabled = count === 0;
}

function renderShortlist(flow: ReturnType<typeof getFlow>) {
  const { applicable, conditional, excluded, active } = flow.shortlist;
  function group(selector: string, title: string, candidates: Candidate[], exclusions = false) {
    const container = element(selector);
    container.replaceChildren();
    if (!candidates.length) return;
    if (title) container.append(node('h3', 'shortlist-group-label', title));
    const list = node('ul', 'shortlist-list');
    for (const candidate of candidates) {
      const item = node('li', 'shortlist-item');
      item.dataset.product = candidate.product.id;
      const notes = exclusions ? candidate.blockers : candidate.confirmations;
      if (notes.length) {
        const details = node('details', 'shortlist-reasons');
        details.append(node('summary', '', candidate.product.shortName));
        const reasons = node('ul');
        notes.forEach(note => reasons.append(node('li', '', note)));
        details.append(reasons);
        item.append(details);
      } else {
        item.append(node('span', '', candidate.product.shortName));
      }
      list.append(item);
    }
    container.append(list);
  }
  group('#applicable-platforms', 'Still applicable', applicable);
  group('#conditional-platforms', 'Requires confirmation', conditional);
  group('#exclusion-reasons', '', excluded, true);
  element('#excluded-platforms').hidden = excluded.length === 0;
  element('#excluded-count').textContent = String(excluded.length);
  element('#shortlist-count').textContent = String(active.length);
  element('#shortlist-jump').textContent = `${active.length} ${active.length === 1 ? 'platform remains' : 'platforms remain'}`;
  const status = active.length
    ? `${active.length} ${active.length === 1 ? 'platform remains' : 'platforms remain'}${conditional.length ? `; ${conditional.length} ${conditional.length === 1 ? 'requires' : 'require'} confirmation` : ''}.`
    : 'No platform meets the current requirements. Review the conflicting answers.';
  const statusElement = element('#shortlist-status');
  if (statusElement.textContent !== status) statusElement.textContent = status;
  statusElement.classList.toggle('shortlist-conflict', active.length === 0);
}

function addList(parent: HTMLElement, title: string, items: string[], className = '') {
  if (!items.length) return;
  const section = node('section', className);
  section.append(node('h3', '', title));
  const list = node('ul', 'reason-list');
  items.forEach(item => list.append(node('li', '', item)));
  section.append(list);
  parent.append(section);
}

function candidateDetails(candidate: Candidate) {
  const container = node('div');
  addList(container, 'Selection factors', candidate.reasons);
  addList(container, 'Does not meet', candidate.blockers, 'conflict-note');
  addList(container, 'Needs confirmation', candidate.confirmations, 'review-note');
  addList(container, 'Limitations and responsibilities', candidate.product.watch);
  return container;
}

function renderResult() {
  const recommendation = recommend(answers);
  if (recommendation.status === 'incomplete') {
    throw new Error('The result screen requires complete answers.');
  }
  const { primary } = recommendation;
  form.hidden = true;
  result.hidden = false;
  result.replaceChildren();
  const review = recommendation.status === 'review';
  result.append(node('span', review ? 'result-status review-status' : 'result-status', review ? 'Needs review' : 'Recommended starting point'));
  const heading = node('h2', 'result-heading', !primary
    ? (recommendation.alternatives.length ? 'Platform selection requires review' : 'No platform meets the current requirements')
    : review ? 'Requirements need validation' : primary.product.name);
  heading.tabIndex = -1;
  heading.dataset.focus = '';
  result.append(heading);
  if (review) result.append(node('p', 'result-intro', primary
    ? 'Review the unconfirmed requirements for the selected platform before development.'
    : 'Review the requirements below. You can revise an answer using the requirements summary.'));
  if (primary) {
    const hero = node('div', 'recommended-product');
    hero.dataset.product = primary.product.id;
    hero.append(node('span', 'utility', primary.product.category));
    if (review) hero.append(node('h3', '', `Platform for review: ${primary.product.name}`));
    hero.append(node('p', '', primary.product.summary));
    result.append(hero);
  }
  addList(result, 'Resolve these requirements', recommendation.issues, 'conflict-note');
  if (primary) {
    result.append(candidateDetails(primary));
    addList(result, 'Items to validate', primary.product.review, 'review-note');
  }
  const documentPlaceholder = node('section', 'related-guidance');
  documentPlaceholder.append(node('h3', '', relatedGuidance.title), node('p', 'muted', relatedGuidance.description));
  result.append(documentPlaceholder);
  if (recommendation.alternatives.length) {
    result.append(node('h3', 'alternatives-heading', primary ? 'Remaining alternatives' : 'Remaining platforms'));
    result.append(node('p', 'muted', 'Expand each option to review its suitability, limitations, and trade-offs.'));
  }
  recommendation.alternatives.forEach(candidate => {
    const details = node('details', 'alternative');
    details.dataset.product = candidate.product.id;
    const heading = node('summary');
    const status = candidate.confirmations.length ? 'Requires confirmation' : 'Still applicable';
    heading.append(node('span', '', candidate.product.shortName), node('span', 'alternative-status', status));
    details.append(heading, node('p', 'alternative-description', candidate.product.summary), candidateDetails(candidate));
    const link = node('a', 'detail-link', 'View scope and caveats');
    link.href = withBase(`compare/#${candidate.product.id}`);
    details.append(link);
    result.append(details);
  });
  if (recommendation.excluded.length) {
    result.append(node('p', 'muted', `${recommendation.excluded.length} ${recommendation.excluded.length === 1 ? 'platform is' : 'platforms are'} excluded. Review the reasons in the platform shortlist or edit your answers to reassess.`));
  }
  const actions = node('div', 'result-actions');
  const edit = node('button', 'button button-quiet', 'Review answers');
  edit.type = 'button';
  edit.addEventListener('click', () => { selectSidebarTab(1); step = 0; render(); });
  const compare = node('a', 'button button-primary', 'Compare all options');
  compare.href = withBase('compare/');
  actions.append(edit, compare);
  result.append(actions, node('p', 'result-disclaimer', 'Based on draft guidance. Validate current capabilities, licensing, and availability for your environment.'));
}

function render(focus = true) {
  const flow = getFlow(answers);
  answers = flow.answers;
  const questions = flow.questions;
  step = Math.min(step, questions.length);
  if (step === questions.length && flow.shortlist.active.length && flow.missing.length) {
    step = questions.findIndex(question => question.id === flow.missing[0].id);
  }
  renderSummary(flow);
  renderShortlist(flow);
  error.hidden = true;
  const complete = step === questions.length;
  element('#step-label').textContent = complete ? 'YOUR STARTING POINT' : `QUESTION ${step + 1} OF ${questions.length}`;
  const percentage = complete ? 100 : Math.round(step / questions.length * 100);
  element('#progress-fill').style.width = `${percentage}%`;
  element('[role="progressbar"]').setAttribute('aria-valuenow', String(percentage));
  if (complete) {
    renderResult();
  } else {
    form.hidden = false;
    result.hidden = true;
    const question = questions[step];
    const singleChoice = !question.multiple && question.choices.length === 1;
    content.replaceChildren();
    const fieldset = node('fieldset', 'question-fieldset');
    const legend = node('legend');
    const title = node('span', 'question-title', question.title);
    title.setAttribute('role', 'heading');
    title.setAttribute('aria-level', '2');
    title.tabIndex = -1;
    title.dataset.focus = '';
    legend.append(title);
    const hint = node('p', 'question-hint', singleChoice ? question.singleChoiceHint ?? question.hint : question.hint);
    hint.id = 'question-hint';
    fieldset.setAttribute('aria-describedby', hint.id);
    fieldset.append(legend, hint);
    const choices = node('div', 'choices');
    for (const choice of question.choices) {
      const label = node('label', 'choice');
      const input = node('input');
      input.type = question.multiple ? 'checkbox' : 'radio';
      input.name = question.id;
      input.value = choice.id;
      input.checked = has(answers, question.id, choice.id) || singleChoice;
      const text = node('span', 'choice-text');
      text.append(node('span', 'choice-label', choice.label), node('span', 'choice-detail', choice.detail));
      label.append(input, text);
      choices.append(label);
    }
    fieldset.append(choices);
    content.append(fieldset);
    back.disabled = step === 0;
    element('#selection-hint').textContent = singleChoice ? 'Continue to confirm' :
      question.multiple ? 'Select all that apply' : 'Choose one option';
    next.textContent = !flow.shortlist.active.length ? 'Review requirements' :
      step === questions.length - 1 ? 'See my recommendation' : 'Continue';
  }
  updateFeedback(flow, complete);
  if (focus) focusHeading();
}

function captureAnswer() {
  const question = getFlow(answers).questions[step];
  const values = new FormData(form).getAll(question.id).filter((value): value is string => typeof value === 'string');
  answers[question.id] = values;
  const flow = getFlow(answers);
  answers = flow.answers;
  return flow;
}

form.addEventListener('change', () => {
  const flow = captureAnswer();
  error.hidden = true;
  renderSummary(flow);
  renderShortlist(flow);
  updateFeedback(flow, false);
  const count = flow.questions.length;
  element('#step-label').textContent = `QUESTION ${step + 1} OF ${count}`;
  const percentage = Math.round(step / count * 100);
  element('#progress-fill').style.width = `${percentage}%`;
  element('[role="progressbar"]').setAttribute('aria-valuenow', String(percentage));
  next.textContent = !flow.shortlist.active.length ? 'Review requirements' :
    step === count - 1 ? 'See my recommendation' : 'Continue';
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const flow = captureAnswer();
  const current = flow.questions[step].id;
  if (!answers[current]?.length) {
    error.textContent = 'Choose an option to continue.';
    error.hidden = false;
    content.querySelector('input')?.focus();
    return;
  }
  step = flow.shortlist.active.length ? step + 1 : flow.questions.length;
  render();
});
back.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
restart.addEventListener('click', () => {
  answers = {};
  step = 0;
  element<HTMLDetailsElement>('#excluded-platforms').open = false;
  selectSidebarTab(0);
  render();
});
render(false);
