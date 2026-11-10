# Agent platform guidance (Draft)

A static Astro site for platform owners, Center of Excellence leads, and
architects selecting a conversational agent platform across Microsoft 365 and
Copilot Studio. The assessment identifies a starting point, applicable
alternatives, and approach-specific considerations; it does not certify that
every required integration or publishing route is supported.

## Run locally

Requires Node 22.12+ and npm 9.6.5+.

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/`. Answers remain in tab memory and reset on refresh.
There are no accounts, analytics, external API calls, automatic answer
submissions, or remote font requests. Fonts and application assets are bundled
locally. Without JavaScript, the landing page provides scope information and
links to official documentation.

## Assessment paths

The opening question combines audience and experience. Customer voice remains
visible but disabled, with an explicit unavailable-guidance explanation.

| Audience and experience | Following questions | Total |
| --- | --- | --- |
| Employees in Microsoft 365 | Who directs the work, then jobs or use-case type | 3 |
| Employees across an authenticated website/custom app and Microsoft 365 Copilot or Teams | Use-case type | 2 |
| Customers on a website or in a custom app | Use-case type | 2 |

Progress shows Question X of Y and updates with the selected path. Incompatible
or hidden answers are discarded when earlier selections change; ordinary Back
retains relevant answers. Browser Back/Forward and wizard Back use the same
session-local navigation history. Reset clears the assessment and returns to
the first question. Neither history state nor browser storage contains answers.

Employee-directed jobs are cumulative:

- Questions/guidance alone leads to a declarative agent configured in Agent
  Builder.
- Business-system actions without complex cross-app work presents Cowork and a
  developer-authored Microsoft 365 Copilot declarative agent.
- Complex cross-app/document work leads to Cowork, including combinations with
  guidance or business actions.

Cowork can use existing or custom plugins and integrations. Incomplete existing
plugin coverage does not automatically require changing approaches. A dedicated
Copilot agent does not automatically provide Cowork's cross-app execution.
The rationale explains every selected job, not just the most complex one.

Organization-directed, employee web/app, and customer web/app routes prefer
Copilot Studio with the Microsoft Copilot harness. For focused question-answering
or defined-action scenarios, Standard is shown only as a secondary consideration
for extending an existing working agent that still meets requirements.
This guidance prefers upgrading to the Microsoft Copilot harness; it does not
describe Standard as unsupported or impose an upgrade deadline.

Website embedding does not select SDK. Fixed business rules do not select
Standard. No new/existing-agent lifecycle, voice/handover, model-ownership, or
extensibility question is added to the assessment. The Microsoft Copilot harness
does not support voice; the custom handover-pattern status is separate.

## Results and terminology

Results distinguish Build and configure, Authoring experience, Extensibility
options, Considerations, and Learn more. Developer-authored API/MCP actions remain
required build work for the pro-code approach, rather than being presented as an
optional add-on.

The Microsoft Copilot harness's authentication note is scoped to its own
approach, not Standard. Each approach links to relevant licensing documentation;
licensing requirements are not expanded into assessment questions.

The SDK can support custom handover patterns, custom orchestration using your
own model, or additional integrations. These are implementation options rather
than competing use cases or an automatic replacement for a managed agent.
A2A and Foundry-agent connections have separate, harness-specific documentation.
Foundry is not offered as a primary platform in this comparison.

The Plugins page is replacing Agents in Copilot's user-facing navigation.
A declarative agent remains the conversational component; a plugin can package
it with skills and integrations. Standalone agents remain supported. Results
link both the naming announcement and the technical documentation.

The standalone comparison page has been removed. Legacy `/compare/` links
redirect to the assessment and `#compare` resolves to the current result or
relevant question. A Related guidance placeholder is intentionally not a link
until its destination is supplied.

## Feedback

The header's Submit feedback link uses `general-feedback.yml` without selections.
Question/result feedback uses `feedback.yml`, retaining the existing `step` and
`context` field IDs for shared links. Context contains normalized current answers,
not click history, disabled choices, or stale branch selections.

Links open a new tab and do not submit an issue automatically. Opening contextual
feedback sends its URL parameters to GitHub and may leave them in browser history.
Visitors can edit or remove that context before submitting. A GitHub account is
required and submitted issues are public. The notices explain these consequences
before navigation; do not include confidential information.

The forms must exist on the repository's default branch. No backend, token,
new dependency, or category dropdown is required.

## Implementation and checks

- `src/data/guidance.ts`: approved questions, approach content, documentation,
  configuration roles, and extensibility guidance.
- `src/lib/flow.ts`: earlier-answer normalization and visible question flow.
- `src/lib/recommend.ts`: deterministic outcomes and conditional alternatives.
- `src/lib/feedback.ts`: contextual/general GitHub issue-form URLs.
- `src/scripts/finder.ts`: rendering, in-memory state, focus, history, and theme.
- `src/lib/url.ts`: deployment-base-aware internal URLs.
- `tests/`: pure routing/feedback tests and production browser journeys.

The historical public source drafts in `docs/source-decision-table.md` and
`docs/source-question-guidance.md` are preserved separately and are not rewritten
as current capability inventories.

```sh
npm run check
npm test
npx playwright install chromium
npm run test:e2e
BASE_PATH=/m365-copilot-studio-what-to-build-where/ npm run test:e2e
```

Browser tests build the real Astro app and start/stop its preview server on port
4327. They cover all seven employee-job combinations, six audience/use-case
combinations, disabled voice, navigation and clearing, feedback privacy, themes,
responsive comparisons, legacy URLs, and no-JavaScript documentation.

## GitHub Pages

The deployment workflow reads origin and base path from `actions/configure-pages`;
no owner or repository path is baked into application assets. Internal links use
`withBase`, and Astro applies the base to bundled scripts, styles, and fonts.
Root and project-path builds are tested in CI. Only the default branch deploys.

```sh
SITE_URL=https://microsoft.github.io BASE_PATH=/m365-copilot-studio-what-to-build-where/ npm run build
BASE_PATH=/m365-copilot-studio-what-to-build-where/ npm run preview
```

The production site is
<https://microsoft.github.io/m365-copilot-studio-what-to-build-where/>.
The theme defaults to the system preference and responds to system changes.
The icon permits a temporary switch; refresh restores the system preference.
The `scoutTheme` query parameter can set an initial light/dark theme for previews.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit [Contributor License Agreements](https://cla.opensource.microsoft.com).

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
