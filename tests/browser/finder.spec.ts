import { expect, test, type Page } from '@playwright/test';

const defaults: Record<string, string[]> = {
  job: ['knowledge'], audience: ['employees'], ownership: ['user'], architecture: ['managed'],
  channels: ['m365'], autonomy: ['prompted'], integration: ['connectors'], existing: ['new'],
};

async function journey(page: Page, overrides: Record<string, string[]> = {}) {
  const answers = { ...defaults, ...overrides };
  for (let index = 0; index < 8; index += 1) {
    if (await page.locator('#result').isVisible()) break;
    const name = await page.locator('#question-content input').first().getAttribute('name');
    if (!name || !answers[name]) throw new Error(`Unexpected question: ${name}`);
    for (const input of await page.locator('#question-content input[type="checkbox"]:checked').all()) {
      if (!answers[name].includes(await input.inputValue())) await input.uncheck();
    }
    for (const value of answers[name]) await page.locator(`input[name="${name}"][value="${value}"]`).check();
    await page.locator('#continue').click();
  }
  await expect(page.locator('#result')).toBeVisible();
}

test('initial page, color themes, keyboard validation, and responsive layout', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('');
  await expect(page.getByRole('link', { name: 'Agent platform guidance home' })).toHaveText('Agent platform guidance');
  await expect(page).toHaveTitle('Agent platform selection for Microsoft 365 and Copilot Studio (Draft) | Agent platform guidance');
  await expect(page.locator('#page-title')).toHaveText('Agent platform selection for Microsoft 365 and Copilot Studio (Draft)');
  await expect(page.locator('.intro > p')).toContainText('Center of Excellence (CoE) leads');
  await expect(page.getByRole('heading', { name: 'What does the agent need to do?' })).toBeVisible();
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
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({ path: info.outputPath('finder-light.png'), fullPage: true });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.choice').first()).toHaveCSS('background-color', 'rgb(22, 48, 74)');
  await page.screenshot({ path: info.outputPath('finder-dark.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

const scenarios: { title: string; overrides: Record<string, string[]>; product: string; status: string; alternatives: number }[] = [
  { title: 'Agent Builder', overrides: {}, product: 'Agent Builder', status: 'Recommended starting point', alternatives: 5 },
  { title: 'Studio new actions', overrides: { job: ['actions'] }, product: 'Copilot Studio', status: 'Recommended starting point', alternatives: 4 },
  { title: 'Standard existing', overrides: { job: ['actions'], existing: ['standard'] }, product: 'Copilot Studio', status: 'Recommended starting point', alternatives: 4 },
  { title: 'Cowork personal autonomy', overrides: { autonomy: ['personal'] }, product: 'Cowork', status: 'Needs review', alternatives: 3 },
  { title: 'Combined jobs', overrides: { job: ['knowledge', 'actions', 'reasoning'] }, product: 'Copilot Studio', status: 'Recommended starting point', alternatives: 4 },
  { title: 'Toolkit integration review', overrides: { job: ['actions'], integration: ['apis'] }, product: 'Microsoft 365 Agents Toolkit', status: 'Needs review', alternatives: 4 },
  { title: 'SDK own runtime', overrides: { architecture: ['own'] }, product: 'Microsoft 365 Agents SDK', status: 'Recommended starting point', alternatives: 0 },
];
for (const scenario of scenarios) {
  test(`complete journey: ${scenario.title}`, async ({ page }, info) => {
    await page.goto('');
    await journey(page, scenario.overrides);
    await expect(page.locator('.result-status')).toHaveText(scenario.status);
    await expect(page.locator('#result')).toContainText(scenario.product);
    await expect(page.locator('.alternative')).toHaveCount(scenario.alternatives);
    const excluded = await page.locator('#exclusion-reasons [data-product]').evaluateAll(items => items.map(item => item.getAttribute('data-product')));
    for (const id of excluded) await expect(page.locator(`#result [data-product="${id}"]`)).toHaveCount(0);
    await expect(page.locator('[data-focus]:visible')).toBeFocused();
    if (scenario.title === 'Toolkit integration review') {
      await page.screenshot({ path: info.outputPath('result-review.png'), fullPage: true });
    }
    if (scenario.title === 'Agent Builder') {
      await page.screenshot({ path: info.outputPath('result-recommended.png'), fullPage: true });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('back, edit, stale conditional branches, and restart', async ({ page }) => {
  await page.goto('');
  await page.locator('input[value="actions"]').check();
  await page.locator('#continue').click();
  await page.locator('#back').click();
  await expect(page.locator('input[value="actions"]')).toBeChecked();
  await journey(page, { job: ['actions'], integration: ['apis'] });
  await showRequirements(page);
  await page.getByRole('button', { name: /^Edit Architecture:/ }).click();
  await page.locator('input[value="own"]').check();
  await expect(page.getByRole('button', { name: /^Edit Integrations:/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Edit Starting point:/ })).toHaveCount(0);
  await journey(page, { architecture: ['own'] });
  await expect(page.locator('.result-heading')).toHaveText('Microsoft 365 Agents SDK');
  await page.getByRole('button', { name: 'Reset answers' }).click();
  await expect(page.getByRole('heading', { name: 'What does the agent need to do?' })).toBeVisible();
  await expect(page.locator('#answer-count')).toHaveText('0');
  await expect(page.locator('input:checked')).toHaveCount(0);
  await expect(page.locator('#back')).toBeDisabled();
});

test('conflicts and required unknowns stay explicit', async ({ page }) => {
  await page.goto('');
  await journey(page, { ownership: ['user'], autonomy: ['organization'] });
  await expect(page.locator('.result-status')).toHaveText('Needs review');
  await expect(page.locator('#result')).toContainText('Decide who owns the process');
  await page.locator('#restart').click();
  await journey(page, { architecture: ['own'], channels: ['voice', 'handover'] });
  await expect(page.locator('.result-status')).toHaveText('Needs review');
  await expect(page.locator('#result')).toContainText('SDK alone does not supply it');
});

async function showShortlist(page: Page) {
  await page.locator('#shortlist-tab').click();
}

async function showRequirements(page: Page) {
  await page.locator('#requirements-tab').click();
}

test('sidebar tabs alternate panels and retain answers with keyboard navigation', async ({ page }, info) => {
  await page.goto('');
  await expect(page.locator('#shortlist-tab')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#platform-shortlist')).toBeVisible();
  await expect(page.locator('#requirements')).toBeHidden();
  await page.locator('input[value="actions"]').check();
  await showRequirements(page);
  await expect(page.locator('#platform-shortlist')).toBeHidden();
  await expect(page.locator('#requirements')).toBeVisible();
  await expect(page.locator('#answer-summary')).toContainText('Take action in business systems');
  await page.screenshot({ path: info.outputPath('requirements-tab.png'), fullPage: true });
  await page.locator('#requirements-tab').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#shortlist-tab')).toBeFocused();
  await expect(page.locator('#shortlist-tab')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#requirements')).toBeHidden();
  await expect(page.locator('#shortlist-count')).toHaveText('5');
  await expect(page.locator('input[value="actions"]')).toBeChecked();
  await page.keyboard.press('End');
  await expect(page.locator('#requirements-tab')).toBeFocused();
  await expect(page.locator('#requirements')).toBeVisible();
  await page.keyboard.press('Home');
  await expect(page.locator('#shortlist-tab')).toBeFocused();
  await expect(page.locator('#platform-shortlist')).toBeVisible();
  await expect(page.locator('.bottom-note')).toHaveCount(0);
});

test('mobile platform count provides access to the live shortlist', async ({ page }, info) => {
  await page.goto('');
  await page.locator('input[value="actions"]').check();
  if (info.project.name === 'mobile') {
    await expect(page.locator('#shortlist-jump')).toBeVisible();
    await expect(page.locator('#shortlist-jump')).toHaveText('5 platforms remain');
    await showRequirements(page);
    await page.locator('#shortlist-jump').click();
    await expect(page.locator('#shortlist-tab')).toBeFocused();
    await expect(page.locator('#platform-shortlist')).toBeVisible();
    await expect(page.locator('#requirements')).toBeHidden();
  } else {
    await expect(page.locator('#shortlist-jump')).toBeHidden();
  }
});

test('shortlist excludes immediately, explains exclusions, and restores edited options', async ({ page }, info) => {
  await page.goto('');
  await showShortlist(page);
  await expect(page.locator('#shortlist-count')).toHaveText('6');
  await expect(page.locator('#applicable-platforms [data-product]')).toHaveCount(6);
  await expect(page.locator('#applicable-platforms [data-product="studio"]')).toHaveText('Copilot Studio · GitHub Copilot Harness');
  await expect(page.locator('#applicable-platforms [data-product="standard"]')).toHaveText('Copilot Studio · Standard Harness');
  await expect(page.locator('#applicable-platforms [data-product="sdk"]')).toHaveText('M365 Agents SDK');
  await expect(page.locator('#conditional-platforms [data-product]')).toHaveCount(0);
  await expect(page.locator('#excluded-platforms')).toBeHidden();

  await page.locator('input[value="actions"]').check();
  await expect(page.locator('#shortlist-count')).toHaveText('5');
  await expect(page.locator('#applicable-platforms [data-product="builder"]')).toHaveCount(0);
  await expect(page.locator('#conditional-platforms [data-product="cowork"]')).toHaveCount(1);
  await expect(page.locator('#shortlist-status')).toHaveText('5 platforms remain; 1 requires confirmation.');
  await page.locator('#excluded-platforms > summary').click();
  await page.locator('#exclusion-reasons [data-product="builder"] summary').click();
  await expect(page.locator('#exclusion-reasons')).toContainText('The job writes to business systems');
  await page.screenshot({ path: info.outputPath('progressive-shortlist.png'), fullPage: true });

  await page.locator('input[value="knowledge"]').check();
  await expect(page.locator('#shortlist-count')).toHaveText('5');
  await page.locator('input[value="actions"]').uncheck();
  await expect(page.locator('#shortlist-count')).toHaveText('6');
  await expect(page.locator('#applicable-platforms [data-product="builder"]')).toHaveCount(1);
  await expect(page.locator('#conditional-platforms [data-product]')).toHaveCount(0);
  await expect(page.locator('#excluded-platforms')).toBeHidden();
});

test('jobs combine requirements and control remains an explicit second step', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('input[name="job"][type="checkbox"]')).toHaveCount(3);
  await expect(page.locator('#selection-hint')).toHaveText('Select all that apply');
  for (const value of ['knowledge', 'actions', 'reasoning']) await page.locator(`input[value="${value}"]`).check();
  await expect(page.locator('#shortlist-count')).toHaveText('5');
  await expect(page.locator('#conditional-platforms [data-product="cowork"]')).toHaveCount(1);
  await expect(page.locator('#conditional-platforms [data-product="standard"]')).toHaveCount(1);
  await expect(page.locator('#conditional-platforms [data-product="toolkit"]')).toHaveCount(1);
  await page.locator('input[value="actions"]').uncheck();
  await expect(page.locator('#shortlist-count')).toHaveText('5');
  await expect(page.locator('#conditional-platforms [data-product="cowork"]')).toHaveCount(0);
  await page.locator('input[value="reasoning"]').uncheck();
  await expect(page.locator('#shortlist-count')).toHaveText('6');
  await page.locator('input[value="knowledge"]').uncheck();
  await page.locator('#continue').click();
  await expect(page.getByRole('alert')).toHaveText('Choose an option to continue.');
  await expect(page.locator('input').first()).toBeFocused();
  for (const value of ['knowledge', 'actions', 'reasoning']) await page.locator(`input[value="${value}"]`).check();
  await expect(page.getByRole('alert')).toBeHidden();
  await showRequirements(page);
  await expect(page.locator('#answer-summary')).toContainText('Answer questions or guide people in Microsoft 365; Take action in business systems; Work through a complex business task');
  await expect(page.locator('#answer-count')).toHaveText('1');
  await page.locator('#continue').click();
  await expect(page.getByRole('heading', { name: 'Who guides the work?' })).toBeVisible();
  await expect(page.locator('#step-label')).toHaveText('QUESTION 2 OF 6');
  await expect(page.locator('input[name="ownership"][type="radio"]')).toHaveCount(2);
  await expect(page.locator('input[name="ownership"]').first()).toHaveValue('organization');
  await expect(page.locator('input[name="ownership"]:checked')).toHaveCount(0);
  await expect(page.locator('#selection-hint')).toHaveText('Choose one option');
  await page.locator('input[value="user"]').check();
  await page.locator('input[value="organization"]').check();
  await expect(page.locator('input[name="ownership"]:checked')).toHaveCount(1);
  await showShortlist(page);
  await expect(page.locator('#exclusion-reasons [data-product="cowork"]')).toHaveCount(1);
  await page.locator('input[value="user"]').check();
  await expect(page.locator('#conditional-platforms [data-product="cowork"]')).toHaveCount(1);
  await page.locator('#continue').click();
  await expect(page.getByRole('heading', { name: 'Who will use it?' })).toBeVisible();
  await expect(page.locator('input[name="audience"]')).toHaveCount(1);
  await expect(page.locator('input[value="employees"]')).toBeVisible();
  await showRequirements(page);
  await page.getByRole('button', { name: /^Edit The job:/ }).click();
  await expect(page.locator('input[name="job"]:checked')).toHaveCount(3);
  await page.locator('input[value="actions"]').uncheck();
  await page.locator('input[value="reasoning"]').uncheck();
  await page.locator('#continue').click();
  await expect(page.locator('input[value="user"]')).toBeChecked();
  await page.getByRole('button', { name: /^Edit Behavior:/ }).click();
  await expect(page.getByRole('heading', { name: 'Who guides the work?' })).toBeVisible();
});

test('Microsoft 365 audience stays visible and preselected for confirmation or going back', async ({ page }, info) => {
  await page.goto('');
  await journey(page, { job: ['actions'], audience: ['both'], channels: ['web'] });
  await showRequirements(page);
  await page.getByRole('button', { name: /^Edit The job:/ }).click();
  await page.locator('input[value="knowledge"]').check();
  await expect(page.getByRole('button', { name: /^Edit Audience:/ })).toHaveCount(0);
  await page.getByRole('button', { name: /^Edit Starting point:/ }).click();
  await page.locator('#continue').click();
  await expect(page.getByRole('heading', { name: 'Who will use it?' })).toBeVisible();
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('input[name="audience"]')).toHaveCount(1);
  await expect(page.locator('input[value="employees"]')).toBeChecked();
  await expect(page.locator('#question-hint')).toHaveText('Your Microsoft 365 job selection limits this experience to employees. Go back to change the selected jobs.');
  await expect(page.locator('#selection-hint')).toHaveText('Continue to confirm');
  await expect(page.getByRole('button', { name: /^Edit Audience:/ })).toHaveCount(0);
  await expect(page.locator('input[value="customers"]')).toHaveCount(0);
  await expect(page.locator('input[value="both"]')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('preselected-audience.png'), fullPage: true });
  await page.locator('#back').click();
  await expect(page.getByRole('heading', { name: 'Who guides the work?' })).toBeVisible();
  await page.locator('#back').click();
  await page.locator('input[value="knowledge"]').uncheck();
  await page.locator('#continue').click();
  await page.locator('#continue').click();
  await expect(page.locator('input[name="audience"]')).toHaveCount(3);
  await expect(page.locator('input[value="customers"]')).toBeVisible();
  await expect(page.locator('input[value="both"]')).toBeVisible();
  await expect(page.locator('input[name="audience"]:checked')).toHaveCount(0);
  await page.locator('input[value="customers"]').check();
  await page.getByRole('button', { name: /^Edit The job:/ }).click();
  await page.locator('input[value="knowledge"]').check();
  await page.locator('#continue').click();
  await page.locator('#continue').click();
  await expect(page.locator('input[name="audience"]')).toHaveCount(1);
  await expect(page.locator('input[value="employees"]')).toBeChecked();
  await page.locator('#continue').click();
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.getByRole('button', { name: /^Edit Audience: Employees$/ })).toBeVisible();
  await journey(page, { job: ['knowledge', 'actions'], channels: ['web'] });
  await expect(page.locator('.result-status')).toHaveText('Recommended starting point');
});

test('reset is accessible beside progress and clears the entire assessment', async ({ page }, info) => {
  await page.goto('');
  const reset = page.getByRole('button', { name: 'Reset answers' });
  await expect(reset).toBeVisible();
  await expect(reset).toBeDisabled();
  await expect(page.locator('.progress-row #restart')).toHaveCount(1);
  await page.locator('input[value="actions"]').check();
  await page.locator('input[value="reasoning"]').check();
  await page.locator('#excluded-platforms > summary').click();
  await showRequirements(page);
  await page.locator('#continue').click();
  await expect(reset).toBeEnabled();
  await expect(reset).toBeInViewport();
  await page.screenshot({ path: info.outputPath('reset-control.png'), fullPage: true });
  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('input[name="job"]:checked')).toHaveCount(0);
  await expect(page.locator('#answer-count')).toHaveText('0');
  await expect(page.locator('#answer-summary li')).toHaveCount(0);
  await expect(page.locator('#shortlist-count')).toHaveText('6');
  await expect(page.locator('#conditional-platforms [data-product]')).toHaveCount(0);
  await expect(page.locator('#exclusion-reasons [data-product]')).toHaveCount(0);
  await expect(page.locator('#excluded-platforms')).not.toHaveAttribute('open');
  await expect(page.locator('#shortlist-tab')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#back')).toBeDisabled();
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.locator('[data-focus]:visible')).toBeFocused();
  await expect(reset).toBeDisabled();
  await page.locator('#continue').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await journey(page, { job: ['knowledge', 'actions', 'reasoning'] });
  await expect(reset).toBeEnabled();
  await reset.click();
  await expect(page.locator('#step-label')).toHaveText('QUESTION 1 OF 6');
  await expect(page.locator('#answer-count')).toHaveText('0');
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.locator('#result')).toBeHidden();
  await expect(reset).toBeDisabled();
});

test('one remaining platform still receives channel and autonomy checks', async ({ page }) => {
  await page.goto('');
  for (const [name, value] of [['job', 'actions'], ['ownership', 'user'], ['audience', 'employees'], ['architecture', 'own']]) {
    await page.locator(`input[name="${name}"][value="${value}"]`).check();
    await page.locator('#continue').click();
  }
  await expect(page.locator('#shortlist-count')).toHaveText('1');
  await expect(page.locator('input[name="channels"]')).toHaveCount(4);
  await expect(page.locator('#result')).toBeHidden();
  await page.locator('input[value="voice"]').check();
  await expect(page.locator('#shortlist-status')).toHaveText('1 platform remains; 1 requires confirmation.');
  await page.locator('#continue').click();
  await expect(page.locator('input[name="autonomy"]')).toHaveCount(3);
  await page.locator('input[value="prompted"]').check();
  await page.locator('#continue').click();
  await expect(page.locator('.result-status')).toHaveText('Needs review');
  await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', 'sdk');
  await expect(page.locator('.alternative')).toHaveCount(0);
});

test('selecting channels directly applies and removes multi-channel requirements', async ({ page }) => {
  await page.goto('');
  for (const [name, value] of [['job', 'actions'], ['ownership', 'user'], ['audience', 'employees'], ['architecture', 'managed']]) {
    await page.locator(`input[name="${name}"][value="${value}"]`).check();
    await page.locator('#continue').click();
  }
  await expect(page.locator('input[name="channels"][type="checkbox"]')).toHaveCount(4);
  await expect(page.getByText('One agent, multiple channels', { exact: true })).toHaveCount(0);
  await page.locator('input[value="m365"]').check();
  await page.locator('input[value="web"]').check();
  await expect(page.locator('#conditional-platforms [data-product="studio"]')).toContainText('every channel in your proposed combination');
  await page.locator('input[value="web"]').uncheck();
  await expect(page.locator('#conditional-platforms [data-product="studio"]')).toHaveCount(0);
  await expect(page.locator('#applicable-platforms [data-product="toolkit"]')).toHaveCount(1);
  await page.locator('input[value="web"]').check();
  await page.locator('#continue').click();
  await journey(page, { job: ['actions'], channels: ['m365', 'web'] });
  await expect(page.locator('.result-status')).toHaveText('Needs review');
  await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', 'studio');
  await showRequirements(page);
  await page.getByRole('button', { name: /^Edit Channels:/ }).click();
  await page.locator('input[value="m365"]').uncheck();
  await page.locator('#continue').click();
  await journey(page, { job: ['actions'], channels: ['web'] });
  await expect(page.locator('.result-status')).toHaveText('Recommended starting point');
  await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', 'studio');
});

for (const audience of ['customers', 'both']) {
  test(`Microsoft 365 workspace is hidden for ${audience} and restored for employees`, async ({ page }) => {
    await page.goto('');
    await journey(page, { job: ['actions'], channels: ['m365', 'web'] });
    await showRequirements(page);
    await page.getByRole('button', { name: /^Edit Audience:/ }).click();
    await page.locator(`input[value="${audience}"]`).check();
    await page.getByRole('button', { name: /^Edit Channels:/ }).click();
    await expect(page.locator('input[name="channels"]')).toHaveCount(3);
    await expect(page.locator('input[value="m365"]')).toHaveCount(0);
    await expect(page.locator('input[value="web"]')).toBeChecked();
    await expect(page.locator('#answer-summary')).not.toContainText('Microsoft 365 workspace');
    await page.getByRole('button', { name: /^Edit Audience:/ }).click();
    await page.locator('input[value="employees"]').check();
    await page.getByRole('button', { name: /^Edit Channels:/ }).click();
    await expect(page.locator('input[value="m365"]')).toBeVisible();
    await expect(page.locator('input[value="m365"]')).not.toBeChecked();
    await expect(page.locator('#question-content')).not.toContainText('Outlook');
    await page.locator('input[value="web"]').uncheck();
    await page.locator('input[value="m365"]').check();
    await page.getByRole('button', { name: /^Edit Audience:/ }).click();
    await page.locator(`input[value="${audience}"]`).check();
    await expect(page.getByRole('button', { name: /^Edit Channels:/ })).toHaveCount(0);
    await page.getByRole('button', { name: /^Edit Starting point:/ }).click();
    await page.locator('#continue').click();
    await expect(page.getByRole('heading', { name: 'Where does it need to work?' })).toBeVisible();
    await expect(page.locator('input[name="channels"]:checked')).toHaveCount(0);
    await expect(page.locator('input[value="m365"]')).toHaveCount(0);
  });
}

test('unknown voice support remains conditional while handover excludes and restores Studio', async ({ page }) => {
  await page.goto('');
  for (const [name, value] of [['job', 'actions'], ['ownership', 'organization'], ['audience', 'employees'], ['architecture', 'managed']]) {
    await page.locator(`input[name="${name}"][value="${value}"]`).check();
    await page.locator('#continue').click();
  }
  await page.locator('input[value="voice"]').check();
  await expect(page.locator('#conditional-platforms [data-product="studio"]')).toHaveCount(1);
  await expect(page.locator('#shortlist-count')).toHaveText('3');
  await page.locator('input[value="handover"]').check();
  await expect(page.locator('#conditional-platforms [data-product="studio"]')).toHaveCount(0);
  await expect(page.locator('#exclusion-reasons [data-product="studio"]')).toHaveCount(1);
  await expect(page.locator('#shortlist-count')).toHaveText('2');
  await page.locator('input[value="handover"]').uncheck();
  await expect(page.locator('#conditional-platforms [data-product="studio"]')).toHaveCount(1);
  await expect(page.locator('#shortlist-count')).toHaveText('3');
});

test('irrelevant integration and harness questions are skipped', async ({ page }) => {
  await page.goto('');
  for (const [name, value] of [['job', 'actions'], ['ownership', 'user'], ['audience', 'employees'], ['architecture', 'managed']]) {
    await page.locator(`input[name="${name}"][value="${value}"]`).check();
    await page.locator('#continue').click();
  }
  await page.locator('input[value="m365"]').check();
  await page.locator('input[value="handover"]').check();
  await page.locator('#continue').click();
  await page.locator('input[value="prompted"]').check();
  await page.locator('#continue').click();
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('.recommended-product .utility')).toHaveText('Standard Harness');
  await expect(page.locator('.alternative')).toHaveCount(1);
  await expect(page.locator('.alternative')).toHaveAttribute('data-product', 'sdk');
});

test('no-match result identifies conflicting answers and can be revised', async ({ page }, info) => {
  await page.goto('');
  for (const [name, value] of [['job', 'knowledge'], ['ownership', 'organization'], ['audience', 'employees'], ['architecture', 'managed'], ['channels', 'm365']]) {
    await page.locator(`input[name="${name}"][value="${value}"]`).check();
    await page.locator('#continue').click();
  }
  await page.locator('input[name="autonomy"][value="personal"]').check();
  await expect(page.locator('#shortlist-count')).toHaveText('0');
  await expect(page.locator('#continue')).toHaveText('Review requirements');
  await page.locator('#continue').click();
  await expect(page.locator('.result-heading')).toHaveText('No platform meets the current requirements');
  await expect(page.locator('.recommended-product')).toHaveCount(0);
  await expect(page.locator('.alternative')).toHaveCount(0);
  await expect(page.locator('#result')).toContainText('Clarify which behavior');
  await page.screenshot({ path: info.outputPath('no-match-review.png'), fullPage: true });
  await showRequirements(page);
  await page.getByRole('button', { name: /^Edit Behavior:/ }).click();
  await page.locator('input[value="user"]').check();
  await expect(page.locator('#shortlist-count')).toHaveText('4');
  await journey(page, { autonomy: ['personal'] });
  await expect(page.locator('.recommended-product')).toHaveAttribute('data-product', 'cowork');
  await expect(page.locator('.result-status')).toHaveText('Needs review');
});

test('comparison works without JS, base-aware assets and links load', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const failed: string[] = [];
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  await page.goto(baseURL!);
  await expect(page.locator('noscript .notice')).toBeVisible();
  await expect(page.locator('noscript .notice')).toContainText('The interactive guide needs JavaScript.');
  await page.getByRole('link', { name: 'compare all six options' }).click();
  await expect(page.locator('.comparison-item')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Compare agent platforms' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How recommendations are determined' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Data handling' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to the guide' }).click();
  expect(page.url()).toBe(baseURL);
  expect(failed).toEqual([]);
  await context.close();
});

test('theme URL accepts known values only and reduced motion disables transitions', async ({ page }) => {
  await page.goto('?scoutTheme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  expect(await page.locator('.choice').first().evaluate(choice => getComputedStyle(choice).transitionDuration)).toBe('0s');
  await page.goto('?scoutTheme=unknown');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
