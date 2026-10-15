import { expect, test, type Page } from '@playwright/test';

const defaults: Record<string, string[]> = {
  approach: ['employee'], job: ['knowledge'], audience: ['employees'],
  architecture: ['managed'], channels: ['m365'], autonomy: ['prompted'],
};
const approachTitle = 'Which approach does your scenario require?';

async function answer(page: Page, values: string[]) {
  for (const input of await page.locator('#question-content input[type="checkbox"]:checked').all()) {
    if (!values.includes(await input.inputValue())) await input.uncheck();
  }
  for (const value of values) await page.locator(`#question-content input[value="${value}"]`).check();
  await page.locator('#continue').click();
}

async function journey(page: Page, overrides: Record<string, string[]> = {}) {
  const answers = { ...defaults, ...overrides };
  let count = 0;
  while (count < 3 && !(await page.locator('#result').isVisible())) {
    const name = await page.locator('#question-content input').first().getAttribute('name');
    if (!name || !answers[name]) throw new Error(`Unexpected question: ${name}`);
    await answer(page, answers[name]);
    count += 1;
  }
  await expect(page.locator('#result')).toBeVisible();
  return count;
}

async function showRequirements(page: Page) {
  await page.locator('#requirements-tab').click();
}

test('initial approach selection, validation, themes, and responsive layout', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('');
  await expect(page).toHaveTitle('Agent platform selection for Microsoft 365 and Copilot Studio (Draft) | Agent platform guidance');
  await expect(page.locator('#page-title')).toContainText('(Draft)');
  await expect(page.locator('.intro > p')).toContainText('Center of Excellence (CoE) leads');
  await expect(page.getByRole('heading', { name: approachTitle })).toBeVisible();
  await expect(page.locator('input[name="approach"][type="radio"]')).toHaveCount(3);
  await expect(page.locator('#approach-automation-label')).toHaveText('Organization-designed business process automation');
  await expect(page.locator('#approach-automation-detail')).toContainText('a repeatable business process that may include conversational experiences, workflows, or both');
  await expect(page.locator('#approach-custom-detail')).toHaveText('The organization requires greater control over integrations, models, orchestration, hosting, channels, or software delivery.');
  await expect(page.locator('input:checked')).toHaveCount(0);
  await expect(page.locator('#platform-shortlist [data-product]')).toHaveCount(0);
  await expect(page.locator('#shortlist-count')).toBeHidden();
  await expect(page.locator('#step-label')).toHaveText('QUESTION 1');
  await expect(page.locator('#shortlist-help')).toContainText('Choose an approach');
  await expect(page.locator('#restart')).toBeDisabled();
  await expect(page.locator('#continue')).toHaveText('Continue');
  for (const selector of ['.decision-panel', '.assessment-panel', '.choice']) {
    const shape = await page.locator(selector).first().evaluate(element => {
      const style = getComputedStyle(element);
      return { radius: style.borderTopLeftRadius, topBorder: style.borderTopWidth };
    });
    expect(shape).toEqual({ radius: '0px', topBorder: '0px' });
  }
  await page.locator('#continue').click();
  await expect(page.getByRole('alert')).toHaveText('Choose an option to continue.');
  await expect(page.locator('input').first()).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.locator('#shortlist-count')).toHaveText('2');
  await expect(page.locator('#shortlist-count')).toBeVisible();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.screenshot({ path: info.outputPath('approaches-light.png'), fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.choice').first()).toHaveCSS('background-color', 'rgb(22, 48, 74)');
  await page.screenshot({ path: info.outputPath('approaches-dark.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

const scenarios: {
  title: string;
  answers: Record<string, string[]>;
  product: string;
  status: string;
  steps: number;
  alternatives: number;
}[] = [
  { title: 'Agent Builder', answers: {}, product: 'builder', status: 'Recommended starting point', steps: 3, alternatives: 1 },
  { title: 'Cowork actions', answers: { job: ['actions'] }, product: 'cowork', status: 'Needs review', steps: 2, alternatives: 0 },
  { title: 'Cowork complex work', answers: { job: ['reasoning'] }, product: 'cowork', status: 'Recommended starting point', steps: 2, alternatives: 0 },
  { title: 'Cowork scheduling', answers: { autonomy: ['personal'] }, product: 'cowork', status: 'Needs review', steps: 3, alternatives: 0 },
  { title: 'Combined jobs', answers: { job: ['knowledge', 'actions', 'reasoning'] }, product: 'cowork', status: 'Needs review', steps: 2, alternatives: 0 },
  { title: 'GitHub Copilot Harness', answers: { approach: ['automation'] }, product: 'studio', status: 'Recommended starting point', steps: 3, alternatives: 1 },
  { title: 'Standard Harness', answers: { approach: ['automation'], channels: ['web', 'handover'] }, product: 'standard', status: 'Recommended starting point', steps: 3, alternatives: 0 },
  { title: 'Standard voice', answers: { approach: ['automation'], channels: ['voice'] }, product: 'standard', status: 'Recommended starting point', steps: 3, alternatives: 0 },
  { title: 'Multi-channel confirmation', answers: { approach: ['automation'], channels: ['m365', 'web'] }, product: 'studio', status: 'Needs review', steps: 3, alternatives: 1 },
  { title: 'M365 Agents Toolkit', answers: { approach: ['custom'] }, product: 'toolkit', status: 'Needs review', steps: 2, alternatives: 0 },
  { title: 'M365 Agents SDK', answers: { approach: ['custom'], architecture: ['own'] }, product: 'sdk', status: 'Recommended starting point', steps: 2, alternatives: 0 },
];

for (const scenario of scenarios) {
  test(`short journey: ${scenario.title}`, async ({ page }, info) => {
    await page.goto('');
    expect(await journey(page, scenario.answers)).toBe(scenario.steps);
    await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', scenario.product);
    await expect(page.locator('.result-status')).toHaveText(scenario.status);
    await expect(page.locator('.alternative')).toHaveCount(scenario.alternatives);
    await expect(page.locator('#answer-summary li')).toHaveCount(scenario.steps);
    await expect(page.locator('.prerequisites')).toContainText('What you need in place: prerequisites and next steps');
    await expect(page.locator('.prerequisites')).toContainText('They were not confirmed by your assessment answers.');
    await expect(page.locator('.related-guidance')).toContainText(['Selected approach', 'Document link coming soon.']);
    await expect(page.locator('.related-guidance a')).toHaveCount(0);
    await expect(page.locator('[data-focus]:visible')).toBeFocused();
    await expect(page.locator('#result')).toContainText(scenario.title === 'Standard Harness'
      ? 'not the default choice for new agents'
      : scenario.product === 'studio' ? 'existing Copilot Studio agent' : 'prerequisites');
    if (scenario.product === 'sdk') {
      await expect(page.locator('.prerequisites')).toContainText('Voice, human handover, and scheduling/event triggers');
      await expect(page.locator('#answer-summary')).not.toContainText('Channels:');
    }
    const excluded = await page.locator('#exclusion-reasons [data-product]').evaluateAll(items => items.map(item => item.getAttribute('data-product')));
    for (const id of excluded) await expect(page.locator(`#result [data-product="${id}"]`)).toHaveCount(0);
    if (['builder', 'toolkit', 'standard'].includes(scenario.product)) {
      await page.screenshot({ path: info.outputPath(`result-${scenario.product}.png`), fullPage: true });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('approach scope narrows immediately and keeps outside products separate from exclusions', async ({ page }, info) => {
  await page.goto('');
  for (const [approach, products] of [
    ['employee', ['builder', 'cowork']], ['automation', ['studio', 'standard']], ['custom', ['toolkit', 'sdk']],
  ] as const) {
    await page.locator(`input[value="${approach}"]`).check();
    await expect(page.locator('#shortlist-count')).toHaveText('2');
    for (const product of products) {
      await expect(page.locator(`#applicable-platforms [data-product="${product}"], #conditional-platforms [data-product="${product}"]`)).toHaveCount(1);
    }
    await expect(page.locator('#excluded-platforms')).toBeHidden();
    await expect(page.locator('#outside-approach')).toContainText('4 platforms are outside');
  }
  if (info.project.name === 'mobile') {
    await showRequirements(page);
    await page.locator('#shortlist-jump').click();
    await expect(page.locator('#shortlist-tab')).toBeFocused();
    await expect(page.locator('#platform-shortlist')).toBeVisible();
  } else await expect(page.locator('#shortlist-jump')).toBeHidden();
});

test('changing approach clears stale answers and Back preserves relevant selections', async ({ page }) => {
  await page.goto('');
  await answer(page, ['employee']);
  await page.locator('input[value="actions"]').check();
  await page.locator('#back').click();
  await expect(page.locator('input[value="employee"]')).toBeChecked();
  await page.locator('#continue').click();
  await expect(page.locator('input[value="actions"]')).toBeChecked();
  await page.locator('#continue').click();
  await showRequirements(page);
  await page.getByRole('button', { name: /^Edit Approach:/ }).click();
  await page.locator('input[value="automation"]').check();
  await expect(page.getByRole('button', { name: /^Edit The job:/ })).toHaveCount(0);
  await journey(page, { approach: ['automation'] });
  await page.getByRole('button', { name: /^Edit Approach:/ }).click();
  await answer(page, ['employee']);
  await expect(page.locator('input[name="job"]:checked')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Edit Audience:|^Edit Channels:/ })).toHaveCount(0);
  await page.locator('#continue').click();
  await expect(page.getByRole('alert')).toHaveText('Choose an option to continue.');
  await expect(page.locator('#result')).toBeHidden();
});

test('combined jobs prune irrelevant autonomy and require a new answer when it becomes relevant', async ({ page }) => {
  await page.goto('');
  await journey(page, { autonomy: ['personal'] });
  await showRequirements(page);
  await page.getByRole('button', { name: /^Edit The job:/ }).click();
  await page.locator('input[value="actions"]').check();
  await expect(page.getByRole('button', { name: /^Edit Autonomy:/ })).toHaveCount(0);
  await expect(page.locator('#step-label')).toHaveText('QUESTION 2 OF 2');
  await page.locator('input[value="actions"]').uncheck();
  await expect(page.locator('#step-label')).toHaveText('QUESTION 2 OF 3');
  await page.locator('#continue').click();
  await expect(page.locator('input[name="autonomy"]:checked')).toHaveCount(0);
  await expect(page.locator('input[name="autonomy"]')).toHaveCount(2);
  await expect(page.getByRole('radio', { name: 'Yes, on a schedule or when an event occurs', exact: true })).toHaveAttribute('value', 'personal');
  await page.locator('#continue').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await answer(page, ['prompted']);
  await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', 'builder');
});

for (const audience of ['customers', 'both']) {
  test(`disabled Microsoft 365 channel for ${audience} clears without automatic restoration`, async ({ page }, info) => {
    await page.goto('');
    await journey(page, { approach: ['automation'], channels: ['m365', 'web'] });
    await showRequirements(page);
    await page.getByRole('button', { name: /^Edit Audience:/ }).click();
    await answer(page, [audience]);
    const m365 = page.locator('input[value="m365"]');
    await expect(m365).toBeVisible();
    await expect(m365).toBeDisabled();
    await expect(m365).not.toBeChecked();
    await expect(m365).toHaveAccessibleDescription(/Unavailable\. Choose "Employees"/);
    await expect(page.locator('input[value="web"]')).toBeChecked();
    await expect(page.locator('input[name="channels"]')).toHaveCount(4);
    await page.locator('.choice:has(input[value="m365"]) .choice-label').click({ force: true });
    await expect(m365).not.toBeChecked();
    await expect(page.locator('#answer-summary')).not.toContainText('Microsoft 365 workspace');
    const context = new URL((await page.locator('#context-feedback-link').getAttribute('href'))!).searchParams.get('context');
    expect(context).not.toContain('Microsoft 365 workspace');
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await expect(page.locator('#channels-m365-unavailable')).toHaveCSS('color',
        theme === 'light' ? 'rgb(36, 36, 36)' : 'rgb(241, 242, 244)');
    }
    await page.screenshot({ path: info.outputPath('disabled-channel.png'), fullPage: true });
    await page.getByRole('button', { name: /^Edit Audience:/ }).click();
    await answer(page, ['employees']);
    await expect(m365).toBeEnabled();
    await expect(m365).not.toBeChecked();
    await page.locator('input[value="web"]').uncheck();
    await page.locator('input[value="m365"]').check();
    await page.getByRole('button', { name: /^Edit Audience:/ }).click();
    await answer(page, [audience]);
    await expect(page.locator('input:checked')).toHaveCount(0);
    await page.locator('#continue').click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.locator('input[value="web"]')).toBeFocused();
    await answer(page, ['web']);
    await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', 'studio');
  });
}

test('voice and handover each exclude GitHub Copilot Harness until both are removed', async ({ page }) => {
  await page.goto('');
  await answer(page, ['automation']);
  await answer(page, ['employees']);
  await page.locator('input[value="voice"]').check();
  await expect(page.locator('#conditional-platforms [data-product="studio"]')).toHaveCount(0);
  await expect(page.locator('#exclusion-reasons [data-product="studio"]')).toContainText('Voice is required');
  await expect(page.locator('#shortlist-count')).toHaveText('1');
  await page.locator('input[value="handover"]').check();
  await expect(page.locator('#shortlist-count')).toHaveText('1');
  await expect(page.locator('#exclusion-reasons [data-product="studio"]')).toHaveCount(1);
  await page.locator('input[value="handover"]').uncheck();
  await expect(page.locator('#shortlist-count')).toHaveText('1');
  await page.locator('input[value="handover"]').check();
  await page.locator('input[value="voice"]').uncheck();
  await expect(page.locator('#shortlist-count')).toHaveText('1');
  await expect(page.locator('#exclusion-reasons [data-product="studio"]')).toContainText('Live-human handover');
  await page.locator('input[value="handover"]').uncheck();
  await expect(page.locator('#shortlist-count')).toHaveText('2');
  await expect(page.locator('#applicable-platforms [data-product="studio"]')).toHaveCount(1);
  await page.locator('input[value="m365"]').check();
  await page.locator('input[value="web"]').check();
  await expect(page.locator('#conditional-platforms [data-product="studio"]')).toContainText('every channel');
  await page.locator('input[value="m365"]').uncheck();
  await expect(page.locator('#conditional-platforms [data-product="studio"]')).toHaveCount(0);
  await page.locator('#continue').click();
  await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', 'studio');
});

test('changing the development model restores only the relevant custom platform', async ({ page }) => {
  await page.goto('');
  await journey(page, { approach: ['custom'] });
  await expect(page.locator('#exclusion-reasons [data-product="sdk"]')).toContainText('platform-managed runtime');
  await showRequirements(page);
  await page.getByRole('button', { name: /^Edit Development model:/ }).click();
  await answer(page, ['own']);
  await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', 'sdk');
  await expect(page.locator('#answer-summary li')).toHaveCount(2);
  await expect(page.locator('#result')).toContainText('not supplied merely by choosing the SDK');
  await page.getByRole('button', { name: /^Edit Development model:/ }).click();
  await answer(page, ['managed']);
  await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', 'toolkit');
});

test('sidebar keyboard navigation and reset retain accessibility without restoring discarded selections', async ({ page }) => {
  await page.goto('');
  await page.locator('input[value="employee"]').check();
  await showRequirements(page);
  await expect(page.locator('#answer-summary')).toContainText('Employee-guided work in Microsoft 365');
  await page.locator('#requirements-tab').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#shortlist-tab')).toBeFocused();
  await expect(page.locator('#requirements')).toBeHidden();
  await page.keyboard.press('End');
  await expect(page.locator('#requirements-tab')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('#shortlist-tab')).toBeFocused();
  await journey(page);
  const reset = page.locator('.progress-row #restart');
  await expect(reset).toBeVisible();
  await expect(reset).toBeEnabled();
  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: approachTitle })).toBeVisible();
  await expect(page.locator('input:checked')).toHaveCount(0);
  await expect(page.locator('#answer-count')).toHaveText('0');
  await expect(page.locator('#shortlist-count')).toHaveText('6');
  await expect(page.locator('#platform-shortlist [data-product]')).toHaveCount(0);
  await expect(page.locator('#shortlist-tab')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#excluded-platforms')).not.toHaveAttribute('open');
  await expect(page.locator('#back')).toBeDisabled();
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.locator('[data-focus]:visible')).toBeFocused();
  await expect(reset).toBeDisabled();
});

test('comparison groups six profiles and prerequisites without JS and supports base URLs', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const failed: string[] = [];
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  await page.goto(baseURL!);
  await expect(page.locator('noscript .notice')).toBeVisible();
  await page.getByRole('link', { name: 'compare all six options' }).click();
  await expect(page).toHaveTitle(/Compare agent platforms \(Draft\)/);
  await expect(page.locator('.comparison-approach')).toHaveCount(3);
  await expect(page.locator('.comparison-item')).toHaveCount(6);
  for (const section of await page.locator('.comparison-approach').all()) {
    await expect(section.locator('.comparison-item')).toHaveCount(2);
  }
  await expect(page.getByRole('heading', { name: 'What you need in place: prerequisites and next steps', exact: true })).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Data handling' })).toBeVisible();
  await expect(page.locator('.methodology')).toContainText('Document link coming soon.');
  await expect(page.locator('#standard')).toContainText('not the default choice for new agents');
  await page.getByRole('link', { name: 'Back to the guide' }).click();
  expect(page.url()).toBe(baseURL);
  expect(failed).toEqual([]);
  await context.close();
});

test('feedback sends only explicit context, keeps prerequisite caveats, and opens a new tab', async ({ page, context }) => {
  const githubRequests: string[] = [];
  context.on('request', request => {
    if (new URL(request.url()).hostname === 'github.com') githubRequests.push(request.url());
  });
  await page.goto('');
  const general = page.getByRole('link', { name: 'Submit feedback', exact: true });
  const contextual = page.locator('#context-feedback-link');
  await expect(general).toHaveAttribute('target', '_blank');
  await expect(contextual).toHaveAttribute('target', '_blank');
  await expect(page.locator('#context-feedback-notice')).toContainText('sends your current selections to GitHub');
  expect(new URL((await general.getAttribute('href'))!).searchParams.has('context')).toBe(false);
  await answer(page, ['employee']);
  await page.locator('input[value="knowledge"]').check();
  await page.locator('input[value="actions"]').check();
  let url = new URL((await contextual.getAttribute('href'))!);
  expect(url.searchParams.get('context')).toContain('Approach: Employee-guided work in Microsoft 365');
  expect(url.searchParams.get('context')).toContain('Answer questions or guide people in Microsoft 365; Take action in business systems');
  expect(url.searchParams.get('context')).not.toContain('- Audience:');
  await page.locator('#continue').click();
  url = new URL((await contextual.getAttribute('href'))!);
  expect(url.searchParams.get('template')).toBe('feedback.yml');
  expect(url.searchParams.get('step')).toBe('Recommendation');
  expect(url.searchParams.get('context')).toContain('They were not confirmed by your assessment answers.');
  expect(url.searchParams.get('context')).not.toContain('- Autonomy:');
  expect(githubRequests).toEqual([]);
  await context.route('https://github.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Issue draft</title>' }));
  const popupPromise = page.waitForEvent('popup');
  await contextual.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(popup.url()).toBe(url.href);
  await expect(page.locator('#result')).toBeVisible();
  await popup.close();
  await page.locator('#restart').click();
  expect(new URL((await contextual.getAttribute('href'))!).searchParams.get('context')).toContain('No answers recorded.');
});

test('theme URL accepts known values only and reduced motion disables transitions', async ({ page }) => {
  await page.goto('?scoutTheme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  expect(await page.locator('.choice').first().evaluate(choice => getComputedStyle(choice).transitionDuration)).toBe('0s');
  await page.goto('?scoutTheme=unknown');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
