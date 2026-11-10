import { questions, roleDetails, extensionRoles, documentation, experienceTitles, declarativeAgentTerminology, customExtensibility, has, studioAudience, type Answers, type Question, type QuestionId, type SolutionExtension, type ExtensionRole, type SolutionComposition, type DocumentationLink, type ExtensibilityOption } from '../data/guidance';
import { getFlow } from '../lib/flow';
import { recommend } from '../lib/recommend';
import { feedbackUrl } from '../lib/feedback';
import { withBase } from '../lib/url';
function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing preview element: ${selector}`);
  return element;
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

const list = (items: string[]): string => `<ul>${items.map(item => `<li>${escape(item)}</li>`).join('')}</ul>`;

const caption = '<p class="guide-caption">Agent platform selection</p>';

const main = required<HTMLElement>('#main');
const recommendation = () => recommend(answers);

let answers: Answers = {};

let returnRoute = 'guide/audience';

const systemTheme = matchMedia('(prefers-color-scheme: dark)');

const initialTheme = new URLSearchParams(location.search).get('scoutTheme');
let theme = initialTheme === 'light' || initialTheme === 'dark' ? initialTheme : systemTheme.matches ? 'dark' : 'light';

const navigationSession = crypto.randomUUID();

const navigationEntries = [location.hash.slice(1) || 'guide/audience'];

let navigationIndex = 0;

const navigationState = () => ({ guide: navigationSession, index: navigationIndex });

history.replaceState(navigationState(), '', location.href);

function normalize(): void { answers = getFlow(answers).answers; }

const flow = (): Question[] => getFlow(answers).questions;

const missing = (): Question | undefined => flow().find(q => !answers[q.id]?.length);

const complete = (): boolean => !missing();

function route(): string { return location.hash.slice(1) || 'guide/audience'; }

function go(target: string, replace = false): void {
  const destination = `#${target}`;
  if (replace || location.hash === destination) {
    navigationEntries[navigationIndex] = target;
    history.replaceState(navigationState(), '', destination);
  } else {
    navigationIndex++;
    navigationEntries.splice(navigationIndex, navigationEntries.length, target);
    history.pushState(navigationState(), '', destination);
  }
  render();
}

function backTo(target: string): void {
  const index = navigationEntries.lastIndexOf(target, navigationIndex - 1);
  if (navigationIndex > 0 && index >= 0) history.go(index - navigationIndex);
  else go(target, true);
}

function historyNavigation(): void {
  const state: unknown = history.state;
  if (typeof state === 'object' && state !== null && 'guide' in state && state.guide === navigationSession
    && 'index' in state && typeof state.index === 'number' && navigationEntries[state.index] === route()) {
    navigationIndex = state.index;
  } else {
    navigationIndex++;
    navigationEntries.splice(navigationIndex, navigationEntries.length, route());
    history.replaceState(navigationState(), '', location.href);
  }
  render();
}

function controls(back?: string, position?: number): string {
  const total = studioAudience(answers) ? 2 : 3;
  return `<div class="journey-controls"><div class="control-left">${back ? `<a class="back-control" href="${escape(withBase(`#${back}`))}" data-nav>← Back</a>` : ''}${position ? `<span class="question-position">Question ${position} of ${total}</span>` : ''}</div><button type="button" class="reset-button" data-reset ${Object.keys(answers).length ? '' : 'disabled'}>Reset answers</button></div>`;
}

function questionView(q: Question): string {
  const steps = flow();
  const index = steps.findIndex(item => item.id === q.id);
  return `${controls(index > 0 ? `guide/${steps[index - 1].id}` : undefined, index + 1)}
    ${caption}${q.id === 'audience' ? '<p class="guide-intro">Guidance for platform owners, Center of Excellence leads and architects selecting a conversational agent platform across Microsoft 365 and Copilot Studio.</p>' : ''}
    <form class="guide-form" id="guide-form" data-question="${q.id}" novalidate>
      <fieldset aria-describedby="question-hint">
        <legend><h1 data-focus tabindex="-1">${escape(q.title)} <span class="heading-draft">(Draft)</span></h1></legend>
        <p class="question-hint" id="question-hint">${escape(q.hint)}</p>
        <div class="guide-choices">${q.choices.map(choice => {
          const disabledReason = choice.disabledReason?.(answers);
          return `<label class="guide-choice"><input type="${q.multiple ? 'checkbox' : 'radio'}" name="${q.id}" value="${choice.id}" ${has(answers, q.id, choice.id) ? 'checked' : ''} ${disabledReason ? 'disabled' : ''} aria-labelledby="label-${choice.id}" aria-describedby="description-${choice.id}"><span><span id="label-${choice.id}" class="answer-label">${escape(choice.label)}</span><span id="description-${choice.id}" class="answer-description">${escape(choice.description)}${disabledReason ? `<span class="unavailable-reason">${escape(disabledReason)}</span>` : ''}</span></span></label>`;
        }).join('')}</div>
      </fieldset>
      <p class="form-error" id="question-error" role="alert" hidden>Select ${q.multiple ? 'at least one answer' : 'an answer'} to continue.</p>
      ${q.help ? `<details class="help"><summary>${escape(q.help.title)}</summary><p>${escape(q.help.text)}</p></details>` : ''}
      <div class="guide-submit"><button class="button button-primary" type="submit" id="continue">Continue</button><small>You can go back and change your answers.</small></div>
    </form>`;
}

function extensionRoleView(role: ExtensionRole, qualifier = ''): string {
  return `<span class="extension-role" data-role="${role}"><svg class="roles-icon" data-icon="${role}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${roleDetails[role].icon}</svg><strong>${escape(roleDetails[role].label)}</strong>${qualifier ? ` ${escape(qualifier)}` : ''}</span>`;
}

function extensionRolesView(extension: SolutionExtension): string {
  const condition = extension.developerCondition ?? (extension.implementation === 'unconfirmed' ? 'integration-unconfirmed' : undefined);
  const conditionalRole = condition
    ? `<span class="extension-conditional" data-condition="${condition}">${extensionRoleView('developer', condition === 'integration-unconfirmed' ? 'may be needed' : '(optional)')}</span>`
    : '';
  return `<span class="extension-implementation"><span class="extension-roles-label">Roles for this route</span><span class="extension-roles">${extensionRoles[extension.implementation].map(role => extensionRoleView(role)).join(' ')}</span>${conditionalRole}</span>`;
}

function authoringView(experience: string): string {
  if (!experience) throw new Error('An authoring experience is required for each solution.');
  return `<dl class="authoring-experience"><div data-component="authoring"><dt>Authoring experience</dt><dd>${escape(experience)}</dd></div></dl>`;
}

function documentationLink(link: DocumentationLink, label = link.label, className = ''): string {
  return `<a${className ? ` class="${escape(className)}"` : ''} href="${escape(link.url)}" target="_blank" rel="noopener noreferrer">${escape(label)}<span class="sr-only"> (opens in a new tab)</span></a>`;
}

function documentationLinks(links: DocumentationLink[], className = 'documentation-links', label = 'Learn more'): string {
  return `<ul class="${escape(className)}" aria-label="${escape(label)}">${links.map(link => `<li>${documentationLink(link)}</li>`).join('')}</ul>`;
}

function extensibilityOptionView(option: ExtensibilityOption): string {
  if (option.id === 'sdk') {
    const link = option.documentation[0];
    if (!link) throw new Error('SDK extensibility requires a documentation link.');
    return `<div class="extension-option extension-explanation" data-extension-option="sdk"><div class="extension-explanation-content extension-compact-content">
      <p>${documentationLink(link, option.name, 'extension-heading')}: ${escape(option.description)}</p>
      ${option.documentationNote ? `<p class="extension-documentation-note"><strong>${escape(option.documentationNote)}</strong></p>` : ''}
      ${option.considerations?.length ? `<ul class="extension-considerations" aria-label="SDK considerations">${option.considerations.map(item => `<li>${escape(item)}</li>`).join('')}</ul>` : ''}
    </div></div>`;
  }
  if (option.id === 'agents') {
    return `<div class="extension-option extension-explanation" data-extension-option="agents"><div class="extension-explanation-content extension-compact-content"><p><span class="extension-heading">${escape(option.name)}</span>: ${option.documentation.map(link => documentationLink(link)).join(' / ')}.</p></div></div>`;
  }
  const content = `<div class="extension-explanation-content">
      <p>${escape(option.description)}</p>
      ${option.documentationNote ? `<p class="extension-documentation-note">${escape(option.documentationNote)}</p>` : ''}
      ${documentationLinks(option.documentation, 'extension-documentation', `${option.name} documentation`)}
    </div>`;
  return `<details class="extension-option extension-explanation" data-extension-option="${escape(option.id)}"><summary>${escape(option.name)}</summary>${content}</details>`;
}

function compositionView(composition: SolutionComposition): string {
  if (!composition.extendedBy.length) throw new Error('Extension guidance is required for each solution.');
  if (!composition.considerations.length) throw new Error('Considerations are required for each solution.');
  return `<dl class="solution-composition">
    <div data-component="configuration"><dt>Build and configure</dt><dd>${composition.extendedBy.map(extension => `<div class="extension-option extension-component" data-implementation="${extension.implementation}"><span class="extension-name">${escape(extension.name)}</span>${extensionRolesView(extension)}</div>`).join('')}</dd></div>
    </dl>
    ${authoringView(composition.authoringExperience)}
    ${composition.extensibilityOptions?.length ? `<dl class="deep-extensibility"><div data-component="extensibility"><dt>Extensibility options</dt><dd>${composition.extensibilityOptions.map(extensibilityOptionView).join('')}</dd></div></dl>` : ''}
    <dl class="approach-considerations"><div data-component="considerations"><dt>Considerations</dt><dd>${list(composition.considerations)}</dd></div></dl>
    ${composition.documentation.length ? `<div class="solution-documentation"><p class="documentation-label">Learn more</p>${documentationLinks(composition.documentation)}</div>` : ''}`;
}

function answerSummaryView(): string {
  const labels: Record<QuestionId, Record<string, string>> = {
    audience: {
      'employees-m365': 'Employees in Microsoft 365',
      'employees-web': 'Employees on a website or custom app plus Microsoft 365 Copilot or Teams',
      'customers-web': 'Customers on a website or custom app',
    },
    direction: { employee: 'employee-guided work', organization: 'organization-defined process' },
    job: { knowledge: 'questions and guidance', actions: 'business-system actions', complex: 'cross-app and document work' },
    complexity: { complex: 'multi-step work across tools and documents', routine: 'question answering or defined business actions' },
  };
  const parts = flow().map(question => (answers[question.id] ?? []).map(value => {
    const label = labels[question.id][value];
    if (!label) throw new Error(`Missing answer summary label: ${question.id}/${value}`);
    return label;
  }).join(', '));
  return `<div class="answer-summary"><p class="answer-summary-label">Based on your answers</p><p>${parts.map(escape).join('; ')}.</p></div>`;
}

function resultView(): string {
  const r = recommendation();
  const multiple = r.options.length > 0;
  const title = multiple
    ? `<h2 id="primary-title">${escape(r.title)}</h2>`
    : `<h1 class="wide-heading" id="primary-title" data-solution="${r.id}" data-focus tabindex="-1">${escape(r.title)} <span class="heading-draft">(Draft)</span></h1>`;
  const guidance = `${r.guidance ? `<p class="result-guidance">${escape(r.guidance)}</p>` : ''}${r.coverageFallback ? `<p class="coverage-fallback">${escape(r.coverageFallback)}</p>` : ''}`;
  const primary = `<section id="primary-option" class="${multiple ? 'recommendation-item' : ''}" data-status="${r.status}" aria-labelledby="primary-title">
    ${title}${!multiple ? guidance : ''}
    <p class="result-lead">${escape(r.introduction)}${r.terminology ? ` <span class="terminology-note">${escape(r.terminology)}</span>` : ''}${r.authentication ? ` <span class="result-authentication">${escape(r.authentication)}</span>` : ''}</p>${compositionView(r)}</section>`;
  const hasStandard = r.options.some(option => option.consideration === 'existing-standard');
  const overview = multiple && !hasStandard
    ? '<p class="approach-overview">Two approaches: Cowork with existing or custom integrations, or a dedicated Microsoft 365 Copilot agent.</p>'
    : '';
  const options = r.options.map((option, index) => {
    const note = option.note ? `<span class="option-note">${escape(option.note)}</span>` : '';
    const upgrade = option.consideration
      ? '<span class="upgrade-routes">Upgrade through the describe-to-build experience in Copilot Studio or the Copilot Studio plugin.</span>'
      : '';
    const description = option.consideration
      ? `<strong class="existing-agent-guidance">${escape(option.description)}</strong>`
      : escape(option.description);
    return `<section class="recommendation-item" ${option.consideration ? `data-consideration="${option.consideration}"` : ''} aria-labelledby="alternative-title-${index}">
      <h2 id="alternative-title-${index}">${escape(option.title)}</h2>
      <p class="result-lead">${description}${option.terminology ? ` <span class="terminology-note">${escape(option.terminology)}</span>` : ''}${note}${upgrade}</p>${compositionView(option)}</section>`;
  }).join('');
  return `${controls(`guide/${flow().at(-1)?.id ?? 'audience'}`)}${caption}
    ${multiple ? `<h1 class="wide-heading" data-solution="${r.id}" data-focus tabindex="-1">Approaches for your use case <span class="heading-draft">(Draft)</span></h1>
      ${guidance}${overview}<div class="result-options" ${hasStandard ? 'data-comparison="existing-standard"' : ''}>${primary}<div id="viable-options">${options}</div></div>` : primary}
    <p class="shared-consideration"><strong>For all approaches:</strong> Evaluate task outcomes, tool actions and access to sensitive information before production.</p>
    <div class="detail-sections">
      <details id="fit-detail"><summary>Why this recommendation</summary><div class="more-content">${answerSummaryView()}${list(r.reasons)}</div></details>
      ${r.alternatives.length || r.excluded.length ? `<details id="other-options"><summary>Other options and exclusions</summary><div class="more-content">${r.alternatives.length ? '<h3>Other applicable options</h3>' + list(r.alternatives) : ''}${r.excluded.length ? '<h3>Why other routes were not selected</h3>' + list(r.excluded) : ''}</div></details>` : ''}
    </div>
    <p class="disclaimer">Related guidance document: link to be supplied.</p>`;
}

function referenceView(kind: string): string {
  const intro = `${controls(returnRoute)}${caption}`;
  if (kind === 'scope') return `${intro}<h1 data-focus tabindex="-1">Scope <span class="heading-draft">(Draft)</span></h1>
    <p class="reference-intro">This guidance compares conversational agentic experiences. Their deterministic business logic and scheduled or event-driven tasks remain in scope.</p>
    <section class="reference-section"><h2>Outside this comparison</h2><p>Standalone business-process automation, including Copilot Studio workflows, requires separate automation guidance. Foundry agent development as a primary platform choice, the Customer Conversation harness, and declarative agents authored in Copilot Studio are excluded. Connecting to Foundry agents is covered as an extensibility option.</p></section>
    <section class="reference-section"><h2>Draft guidance</h2><p>The Microsoft Copilot harness does not support voice. The unavailable customer voice route concerns other approaches outside the current guidance. The custom handover pattern is separate; “coming soon” does not provide a release date. Capabilities and preview availability require confirmation for the selected route. This guidance distinguishes standalone agents, plugin packages, and API/MCP actions. The related guidance document link is pending.</p></section>
    <section class="reference-section"><h2>Data handling</h2><p>Answers stay in this tab and reset on refresh. This site uses no analytics or account sign-in. Opening contextual feedback sends your selected answers to GitHub in an editable issue form. A GitHub account is required to submit a public issue; review the context before sharing it.</p></section>`;
  if (kind === 'extensions') return `${intro}<h1 data-focus tabindex="-1">Extensibility <span class="heading-draft">(Draft)</span></h1>
    <p class="reference-intro">Extensibility covers deeper customization through developer-owned packages, integrations, clients, and backend components. Native knowledge, skills, and supported tool configuration belong to building and configuring the agent.</p>
    <section class="reference-section"><h2>${experienceTitles.microsoft}</h2><p>Use the M365 Agents SDK for custom implementation patterns. These extensibility options do not add scenario questions or change the recommendation.</p>${customExtensibility('microsoft').map(extensibilityOptionView).join('')}</section>
    <section class="reference-section"><h2>${experienceTitles.copilot}</h2><p>${escape(declarativeAgentTerminology)} ${documentationLink(documentation.pluginRegistry)}</p><p>Use the agent in a dedicated conversation or invoke it within Copilot Chat. API and MCP action plugins add external-service operations within a declarative agent. The broader installable plugin package can contain agents, skills, or MCP connections; support for each capability and registration route depends on the host.</p>${authoringView('Agent Builder for managed configuration; Work IQ Dev Tools (preview) for developer-authored packages and custom actions.')}<p>Keep deterministic business logic in the called services. Use M365 Agents Toolkit directly when lower-level manifest, app-package or lifecycle control is required. Reusing an approved agent or integration does not itself require owning its development.</p></section>
    <section class="reference-section"><h2>Custom applications, clients, and channels</h2><p>Use Copilot Studio's built-in publishing options when they meet your needs. Custom clients support the Microsoft Copilot harness. Additional custom patterns for this harness will be published soon. SDK integrations do not require replacing the managed agent. If you build orchestration using your own model, your team operates those components. Existing documented Standard-harness client-library and SDK-agent examples remain route-specific.</p>${authoringView('Custom client development; M365 Agents SDK where applicable')}<p>Identity, Azure Bot, hosting, distribution, app packages, and Agent 365 requirements depend on the chosen integration route.</p></section>
    <section class="reference-section"><h2>Cowork, documents, and apps</h2><p>Cowork Customize manages plugins and skills; Sources &amp; Skills handles activation and connector sign-in. Existing plugins can meet supported requirements without customer-developed code. Work IQ Dev Tools (preview) is optional for custom plugin packages. For in-app or document-context requirements, assess supported declarative-agent scenarios, Office Add-ins, and Copilot skills for Excel (preview).</p></section>
    <p class="disclaimer">Related guidance document: link to be supplied.</p>`;
  throw new Error(`Unknown reference view: ${kind}`);
}

function updateContinue(): void {
  const form = document.querySelector<HTMLFormElement>('#guide-form');
  if (!form) return;
  const steps = flow();
  const last = steps.at(-1)?.id === form.dataset.question;
  required<HTMLButtonElement>('#continue').textContent = last && answers[steps.at(-1)!.id]?.length ? 'See guidance' : 'Continue';
}
function contextualFeedbackView(): string {
  const form = document.querySelector<HTMLFormElement>('#guide-form');
  const question = form && questions.find(item => item.id === form.dataset.question);
  const url = question
    ? feedbackUrl({ kind: 'step', questionId: question.id, answers })
    : feedbackUrl({ kind: 'result', answers });
  return `<div class="context-feedback">
    <a id="context-feedback-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer" aria-describedby="context-feedback-notice">Give feedback on this ${question ? 'step' : 'recommendation'}</a>
    <p id="context-feedback-notice">Opens a new tab and shares your current selected answers with GitHub in an editable issue form. A GitHub account is required to submit a public issue. Review or remove the context before submitting; do not include confidential information.</p>
  </div>`;
}
function updateContextualFeedback(): void {
  const current = main.querySelector('.context-feedback');
  if (current) current.outerHTML = contextualFeedbackView();
}
function render(): void {
  normalize();
  const current = route();
  main.classList.toggle('results-view', current === 'recommendation' && complete());
  if (current.startsWith('guide/')) {
    const q = flow().find(item => `guide/${item.id}` === current);
    if (!q) { go(`guide/${missing()?.id ?? 'audience'}`, true); return; }
    const prerequisite = flow().slice(0, flow().indexOf(q)).find(item => !answers[item.id]?.length);
    if (prerequisite) { go(`guide/${prerequisite.id}`, true); return; }
    main.innerHTML = questionView(q);
    returnRoute = current;
    document.title = `${q.title} (Draft) | Agent platform guidance`;
  } else if (current === 'prerequisites') {
    go(complete() ? 'recommendation' : `guide/${missing()?.id ?? 'audience'}`, true);
    return;
  } else if (current === 'recommendation') {
    if (!complete()) { go(`guide/${missing()?.id ?? 'audience'}`, true); return; }
    main.innerHTML = resultView();
    returnRoute = 'recommendation';
    document.title = 'Suggested approach (Draft) | Agent platform guidance';
  } else if (current === 'compare') {
    go(complete() ? 'recommendation' : `guide/${missing()?.id ?? 'audience'}`, true);
    return;
  } else if (['extensions', 'scope'].includes(current)) {
    main.innerHTML = referenceView(current);
    document.title = `${current[0].toUpperCase() + current.slice(1)} (Draft) | Agent platform guidance`;
  } else { go('guide/audience', true); return; }
  updateContinue();
  if (current.startsWith('guide/') || current === 'recommendation') {
    main.insertAdjacentHTML('beforeend', contextualFeedbackView());
  }
  required<HTMLElement>('[data-focus]').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const q = questions.find(item => item.id === input.name);
  if (!q || !q.when(answers) || !q.choices.some(choice => choice.id === input.value && !choice.disabledReason?.(answers))) return;
  const form = input.closest('form');
  if (!form) return;
  answers[q.id] = [...form.querySelectorAll<HTMLInputElement>('input:checked')].map(item => item.value);
  normalize();
  const progress = document.querySelector<HTMLElement>('.question-position');
  if (progress) progress.textContent = `Question ${flow().findIndex(item => item.id === q.id) + 1} of ${studioAudience(answers) ? 2 : 3}`;
  required<HTMLButtonElement>('[data-reset]').disabled = Object.keys(answers).length === 0;
  required<HTMLElement>('#question-error').hidden = true;
  form.classList.remove('has-error');
  form.querySelector('fieldset')?.setAttribute('aria-describedby', 'question-hint');
  updateContinue();
  updateContextualFeedback();
});

document.addEventListener('submit', event => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'guide-form') return;
  const form = event.target;
  event.preventDefault();
  const q = questions.find(item => item.id === form.dataset.question);
  if (!q) throw new Error('Unknown question submitted.');
  if (!answers[q.id]?.length) {
    required<HTMLElement>('#question-error').hidden = false;
    form.classList.add('has-error');
    form.querySelector('fieldset')?.setAttribute('aria-describedby', 'question-hint question-error');
    form.querySelector<HTMLInputElement>('input')?.focus();
    return;
  }
  const steps = flow();
  const next = steps[steps.findIndex(item => item.id === q.id) + 1];
  go(next ? `guide/${next.id}` : 'recommendation');
});

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('[data-reset]')) {
    answers = {}; returnRoute = 'guide/audience';
    go('guide/audience', true);
    return;
  }
  const link = event.target.closest<HTMLAnchorElement>('a[data-nav], .skip-link');
  if (!link || !(event instanceof MouseEvent) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (link.classList.contains('skip-link')) { main.focus(); return; }
  if (link.classList.contains('back-control')) backTo(link.hash.slice(1));
  else go(link.hash.slice(1));
});

function applyTheme(): void {
  document.documentElement.dataset.theme = theme;
  const button = required<HTMLButtonElement>('#theme');
  const label = `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`;
  button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${theme === 'light'
    ? '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>'
    : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'}</svg>`;
  button.setAttribute('aria-label', label);
  button.title = label;
}

required<HTMLButtonElement>('#theme').addEventListener('click', () => { theme = theme === 'light' ? 'dark' : 'light'; applyTheme(); });

systemTheme.addEventListener('change', event => { theme = event.matches ? 'dark' : 'light'; applyTheme(); });

window.addEventListener('popstate', historyNavigation);

window.addEventListener('hashchange', historyNavigation);

applyTheme();

render();
