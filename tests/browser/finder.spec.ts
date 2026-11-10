import { expect, test, type Page } from '@playwright/test';

type Journey = Record<string, string[]>;
const employee = (job: string[]): Journey => ({ audience: ['employees-m365'], direction: ['employee'], job });
const process = (complexity: string, audience = 'employees-m365'): Journey => ({
  audience: [audience], ...(audience === 'employees-m365' ? { direction: ['organization'] } : {}), complexity: [complexity],
});

test.use({ colorScheme: 'light', contextOptions: { reducedMotion: 'reduce' } });

async function answer(page: Page, question: string, values: string[]) {
  await expect(page.locator('#guide-form')).toHaveAttribute('data-question', question);
  const before = page.url();
  for (const value of await page.locator('#guide-form input[type="checkbox"]:checked').evaluateAll(inputs =>
    inputs.map(input => (input as HTMLInputElement).value))) {
    if (!values.includes(value)) await page.locator(`input[name="${question}"][value="${value}"]`).uncheck();
  }
  for (const value of values) await page.locator(`input[name="${question}"][value="${value}"]`).check();
  expect(page.url()).toBe(before);
  await page.locator('#continue').click();
  await expect(page.locator('h1')).toBeFocused();
}

async function journey(page: Page, input: Journey, solution: string) {
  await page.goto('');
  await page.reload();
  for (const [question, values] of Object.entries(input)) await answer(page, question, values);
  await expect(page.locator('h1')).toHaveAttribute('data-solution', solution);
  await expect(page.locator('#guide-form')).toHaveCount(0);
  await expect(page.locator('#fit-detail .answer-summary')).toHaveCount(1);
  await expect(page.locator('.answer-summary')).toBeHidden();
  await expect(page.locator('#custom-detail, .important, [data-extend]')).toHaveCount(0);
  await expect(page.locator('a[href$="#compare"]')).toHaveCount(0);
  for (const approach of await page.locator('#primary-option, #viable-options .recommendation-item').all()) {
    await expect(approach.locator('[data-component="configuration"] dt')).toHaveText('Build and configure');
    await expect(approach.locator('[data-component="extensibility"] dt')).toHaveText('Extensibility options');
    await expect(approach.locator('[data-component="considerations"] dt')).toHaveText('Considerations');
    await expect(approach.locator('.documentation-links a').filter({ hasText: /licensing/i })).toHaveCount(1);
  }
  await expect(page.locator('.shared-consideration')).toContainText('For all approaches:');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function backTo(page: Page, question: string) {
  for (let count = 0; count < 4; count++) {
    const before = page.url();
    await page.locator('.back-control').click();
    await expect(page).not.toHaveURL(before);
    if (await page.locator('#guide-form').getAttribute('data-question') === question) return;
  }
  throw new Error(`Back did not reach ${question}`);
}

test('opening choices, validation, disabled voice and progress remain explicit', async ({ page }) => {
  await page.goto('');
  await expect(page).toHaveTitle(/\(Draft\) \| Agent platform guidance$/);
  await expect(page.locator('h1')).toContainText('Who will use the agent, and where?');
  await expect(page.locator('input[name="audience"]')).toHaveCount(4);
  await expect(page.locator('input:checked')).toHaveCount(0);
  await expect(page.locator('[data-reset]')).toBeDisabled();
  await expect(page.locator('.question-position')).toHaveText('Question 1 of 3');
  await expect(page.locator('input[value="customers-voice"]')).toBeDisabled();
  await expect(page.locator('.unavailable-reason')).toHaveText('Not covered by this wizard. More guidance coming soon.');
  await page.locator('#continue').click();
  await expect(page.locator('#question-error')).toBeVisible();
  await expect(page.locator('input').first()).toBeFocused();
  await page.locator('input[value="customers-web"]').check();
  await expect(page.locator('.question-position')).toHaveText('Question 1 of 2');
  await page.locator('#continue').click();
  await expect(page.locator('.question-position')).toHaveText('Question 2 of 2');
  await expect(page.locator('#guide-form')).toHaveAttribute('data-question', 'complexity');
});

for (let mask = 1; mask < 8; mask++) {
  const jobs = ['knowledge', 'actions', 'complex'].filter((_, bit) => mask & (1 << bit));
  test(`employee jobs: ${jobs.join(' + ')}`, async ({ page }) => {
    const solution = mask === 1 ? 'builder' : 'cowork';
    await journey(page, employee(jobs), solution);
    for (const [value, text] of [
      ['knowledge', 'Questions and guidance:'], ['actions', 'Business-system actions:'], ['complex', 'Cross-app and document work:'],
    ]) {
      if (jobs.includes(value)) await expect(page.locator('#fit-detail')).toContainText(text);
      else await expect(page.locator('#fit-detail')).not.toContainText(text);
    }
    if (solution === 'builder') {
      await expect(page.locator('.result-guidance')).toHaveText('Create and configure this agent in Agent Builder.');
      await expect(page.locator('.terminology-note')).toContainText('Copilot is replacing the Agents page with Plugins.');
    } else {
      await expect(page.locator('#primary-title')).toContainText('Cowork');
      await expect(page.locator('.extension-conditional')).toHaveText('Developer (optional)');
      if (jobs.includes('actions')) {
        await expect(page.locator('.result-guidance')).toContainText('existing or custom plugins');
        await expect(page.locator('.coverage-fallback')).toContainText('custom');
      }
      if (jobs.includes('complex')) {
        await expect(page.locator('#viable-options')).toHaveCount(0);
        if (jobs.includes('actions')) await expect(page.locator('.coverage-fallback')).toContainText('does not automatically provide');
      } else {
        await expect(page.locator('#viable-options h2')).toHaveText('Microsoft 365 Copilot declarative agent: pro-code authoring');
        await expect(page.locator('#viable-options .terminology-note')).toContainText('Declarative agents remain the conversational component');
        await expect(page.locator('.approach-overview')).toContainText('existing or custom integrations');
        const preferred = await page.locator('#primary-option').evaluate(node => getComputedStyle(node).borderTopColor);
        const alternative = await page.locator('#viable-options .recommendation-item').evaluate(node => getComputedStyle(node).borderTopColor);
        expect(preferred).not.toBe(alternative);
      }
    }
    await page.locator('#fit-detail > summary').click();
    await expect(page.locator('.answer-summary')).toBeVisible();
    for (const [value, text] of [
      ['knowledge', 'questions and guidance'], ['actions', 'business-system actions'], ['complex', 'cross-app and document work'],
    ]) if (jobs.includes(value)) await expect(page.locator('.answer-summary')).toContainText(text);
  });
}

for (const audience of ['employees-m365', 'employees-web', 'customers-web']) {
  for (const complexity of ['routine', 'complex']) {
    test(`process: ${audience} / ${complexity}`, async ({ page }) => {
      await journey(page, process(complexity, audience), 'microsoft');
      await expect(page.locator('#primary-option [data-component="configuration"] .extension-name')).toHaveText('Knowledge sources, skills, MCP servers, tools and workflows');
      await expect(page.locator('#primary-option [data-role="developer"]')).toHaveCount(0);
      await expect(page.locator('#primary-option [data-component="considerations"]')).toContainText('does not support voice');
      await expect(page.locator('#primary-option .extension-documentation-note strong')).toHaveText('Custom handover pattern coming soon.');
      await expect(page.locator('main > .result-authentication, #viable-options .result-authentication')).toHaveCount(0);
      if (audience === 'employees-web') {
        await expect(page.locator('#primary-option .result-authentication')).toHaveText('Internal website or custom app authentication: Microsoft Entra ID.');
      } else if (audience === 'customers-web') {
        await expect(page.locator('#primary-option .result-authentication')).toHaveText('Website or custom app authentication: anonymous access or Microsoft Entra ID.');
      } else await expect(page.locator('.result-authentication')).toHaveCount(0);
      if (complexity === 'routine') {
        await expect(page.locator('#viable-options h2')).toContainText('Standard harness');
        await expect(page.locator('[data-consideration="existing-standard"]')).toHaveCount(1);
        await expect(page.locator('.existing-agent-guidance')).toHaveText('Recommended only for extending an existing agent that is working well and still meets requirements.');
        await expect(page.locator('.option-note')).toContainText('This guidance prefers upgrading');
        await expect(page.locator('#viable-options [data-role="developer"]')).toHaveCount(0);
        await expect(page.locator('#viable-options [data-component="configuration"] .extension-name')).toHaveText('Knowledge, topics and tools');
        await expect(page.locator('.approach-overview')).toHaveCount(0);
        await expect(page.locator('#primary-option .documentation-links a').first()).toHaveAttribute('href', /agents-experience\/overview$/);
        await expect(page.locator('#viable-options .documentation-links a').first()).toHaveAttribute('href', /fundamentals-get-started$/);
      } else await expect(page.locator('#viable-options')).toHaveCount(0);
    });
  }
}

test('wizard Back and browser history move consistently without restoring cleared answers', async ({ page }) => {
  await journey(page, employee(['knowledge', 'actions']), 'cowork');
  await backTo(page, 'job');
  await backTo(page, 'direction');
  await page.goBack();
  await expect(page.locator('#guide-form')).toHaveAttribute('data-question', 'audience');
  await page.goForward();
  await expect(page.locator('#guide-form')).toHaveAttribute('data-question', 'direction');
  await page.goForward();
  await expect(page.locator('input[value="actions"]')).toBeChecked();
  await page.goForward();
  await expect(page.locator('h1')).toHaveAttribute('data-solution', 'cowork');
  await backTo(page, 'direction');
  await answer(page, 'direction', ['organization']);
  await expect(page.locator('#guide-form')).toHaveAttribute('data-question', 'complexity');
  await expect(page.locator('input:checked')).toHaveCount(0);
  await backTo(page, 'direction');
  await answer(page, 'direction', ['employee']);
  await expect(page.locator('#guide-form')).toHaveAttribute('data-question', 'job');
  await expect(page.locator('input:checked')).toHaveCount(0);
});

test('reset and removed comparison routes never resurrect an assessment', async ({ page }) => {
  await journey(page, process('routine', 'customers-web'), 'microsoft');
  await page.evaluate(() => { location.hash = 'compare'; });
  await expect(page).toHaveURL(/#recommendation$/);
  await page.locator('[data-reset]').click();
  await expect(page.locator('#guide-form')).toHaveAttribute('data-question', 'audience');
  await expect(page.locator('[data-reset]')).toBeDisabled();
  await page.goBack();
  await expect(page.locator('input:checked')).toHaveCount(0);
  await page.goto('#compare');
  await page.reload();
  await expect(page.locator('#guide-form')).toHaveAttribute('data-question', 'audience');
});

test('feedback links preserve current normalized selections and explicit new-tab privacy notices', async ({ page }) => {
  await page.goto('');
  const general = page.getByRole('link', { name: 'Submit feedback', exact: true });
  const generalUrl = new URL((await general.getAttribute('href'))!);
  expect(generalUrl.searchParams.get('template')).toBe('general-feedback.yml');
  expect(generalUrl.searchParams.has('context')).toBe(false);
  await expect(general).toHaveAttribute('target', '_blank');
  await expect(page.locator('#header-feedback-notice')).toContainText('Public GitHub issue');
  await answer(page, 'audience', ['employees-m365']);
  await answer(page, 'direction', ['employee']);
  await page.locator('input[value="knowledge"]').check();
  await page.locator('input[value="actions"]').check();
  const step = new URL((await page.locator('#context-feedback-link').getAttribute('href'))!);
  expect(step.searchParams.get('step')).toBe('What does the agent need to do?');
  expect(step.searchParams.get('context')).toContain('Answer questions or provide guidance; Take action in business systems');
  await expect(page.locator('#context-feedback-notice')).toContainText('GitHub account is required to submit a public issue');
  await expect(page.locator('#context-feedback-link')).toHaveAttribute('target', '_blank');
  await expect(page.locator('#context-feedback-link')).toHaveAttribute('rel', 'noopener noreferrer');
  await page.locator('#continue').click();
  const result = new URL((await page.locator('#context-feedback-link').getAttribute('href'))!);
  expect(result.searchParams.get('step')).toBe('Recommendation');
  expect(result.searchParams.get('context')).toContain('Preferred starting point: Cowork');
  await backTo(page, 'direction');
  await answer(page, 'direction', ['organization']);
  const changed = new URL((await page.locator('#context-feedback-link').getAttribute('href'))!);
  expect(changed.searchParams.get('context')).not.toContain('Take action in business systems');
});

test('system theme follows preference changes and the icon supports keyboard switching', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#theme')).toHaveText('');
  await expect(page.locator('#theme')).toHaveAttribute('aria-label', 'Switch to light theme');
  await expect(page.locator('#theme svg')).toHaveAttribute('aria-hidden', 'true');
  await page.locator('input[value="employees-web"]').check();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('input[value="employees-web"]')).toBeChecked();
  await page.locator('#theme').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('layout stays stable between questions and results and keyboard controls remain usable', async ({ page }, info) => {
  await page.goto('');
  const frame = async () => page.locator('main').evaluate(node => {
    const bounds = node.getBoundingClientRect();
    const controls = node.querySelector('.journey-controls')!.getBoundingClientRect();
    return { x: bounds.x, width: bounds.width, controlsX: controls.x, controlsRight: controls.right };
  });
  const initial = await frame();
  for (const value of ['employees-m365', 'employee', 'actions']) {
    await page.locator(`input[value="${value}"]`).focus();
    await page.keyboard.press('Space');
    await page.locator('#continue').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('h1')).toBeFocused();
  }
  expect(await frame()).toEqual(initial);
  await page.locator('#fit-detail > summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.answer-summary')).toBeVisible();
  await page.screenshot({ path: info.outputPath('reviewed-result.png'), fullPage: true });
  await backTo(page, 'job');
  expect(await frame()).toEqual(initial);
  for (const control of await page.locator('.back-control, .reset-button, #theme').all()) {
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});

test('project-base assets, internal links, and legacy comparison redirect resolve locally', async ({ page, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('');
  const expected = new URL(baseURL!).pathname;
  const assets = await page.locator('link[rel="stylesheet"], script[src], link[rel="icon"]').evaluateAll(nodes =>
    nodes.map(node => node.getAttribute('href') ?? node.getAttribute('src') ?? ''));
  for (const asset of assets) expect(new URL(asset, baseURL!).pathname.startsWith(expected)).toBe(true);
  await page.getByRole('link', { name: 'Scope', exact: true }).click();
  await expect(page.locator('h1')).toContainText('Scope');
  await expect(page.locator('main')).toContainText('Opening contextual feedback');
  await page.goto(new URL('compare/', baseURL!).href);
  await expect(page.locator('#guide-form')).toHaveAttribute('data-question', 'audience');
  expect(new URL(page.url()).pathname).toBe(expected);
  expect(errors).toEqual([]);
});

test('static documentation remains available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.locator('#page-title')).toContainText('(Draft)');
  await expect(page.locator('#no-script-message')).toBeVisible();
  expect(await page.locator('#no-script-message').evaluate(node => node.textContent)).toContain('interactive assessment requires JavaScript');
  await expect(page.locator('[aria-label="Platform documentation"] a')).toHaveCount(5);
  await expect(page.locator('#theme')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Submit feedback', exact: true })).toHaveAttribute('target', '_blank');
  await context.close();
});
