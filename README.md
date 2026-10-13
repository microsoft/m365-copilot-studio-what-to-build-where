# Agent platform guidance (Draft)

A guided Astro site for choosing an agent platform from draft decision guidance.
It supports platform owners, Center of Excellence (CoE) leads, and platform
architects assessing organizational agentic use cases.
It explains the fit, alternatives, unmet requirements, and claims that need review.
The six outcomes are Agent Builder, Copilot Studio with the GitHub Copilot Harness
or Standard Harness, Cowork, Microsoft 365 Agents Toolkit, and Microsoft 365 Agents SDK.

## Run locally

Requires Node 22.12+ and npm 9.6.5+.

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/`. Answers stay in tab memory and reset on refresh.
The static comparison page is usable without JavaScript. There are no AI calls,
accounts, analytics, answer submission, or remote font requests.

## Checks

```sh
npm run check
npm test
npx playwright install chromium
npm run test:e2e
BASE_PATH=/m365-copilot-studio-what-to-build-where/ npm run test:e2e
```

Browser tests build the site and start/stop their own preview server on port 4327.
They cover desktop/mobile, themes, the six result candidates, uncertainty,
navigation, conditional answers, and no-JavaScript fallback. Unit tests exercise
all 15,120 combinations of the encoded answer categories, including all nonempty
job and channel combinations, plus partial-answer exclusions, independent control choices, and
restoration of platforms after an answer changes.

```sh
npm run build
npm run preview
```

Static output is in `dist/`. No server adapter is required.

## Guidance and rules

The supplied table is **draft guidance requiring capability validation**.
The original table and all review comments are preserved in
[`docs/source-decision-table.md`](docs/source-decision-table.md). Keep this source
reference separate from subsequent editorial and implementation changes.
Additional source explanations are preserved in
[`docs/source-question-guidance.md`](docs/source-question-guidance.md).
Question hints and answer descriptions summarize this material. Informational
process guidance shares the knowledge option; processes that write records use
the business-actions option. The additional source remains separate from the
implemented decision criteria and does not automatically change routing rules.
Editorial corrections have been incorporated, but uncertain claims have not been
silently resolved. Every visitor sees the draft status. Required unknown
capabilities produce a **Needs review** result rather than an unqualified winner.

- `src/data/guidance.ts`: question definitions, six products, watch-outs,
  and confirmation notes.
- `src/lib/candidates.ts`: partial-answer capability checks and requirement conflicts.
- `src/lib/flow.ts`: relevant questions and choices, normalized answers,
  and the live shortlist.
- `src/lib/recommend.ts`: deterministic selection from remaining candidates.
- `src/scripts/finder.ts`: in-memory answers, navigation, rendering, focus.
- `src/pages/compare.astro`: public methodology and static reference.
- `tests/recommend.test.ts`: expected journeys and requirement invariants.

Every answer updates three groups: **Still applicable**, **Requires confirmation**,
and **Excluded**. Unanswered questions impose no restrictions. Confirmations stay
in the active shortlist; exclusions include reasons and are reconsidered when
answers change. Contradictory requirements produce an early no-match review.
The sidebar switches between **Platform shortlist** (the default) and **Your
requirements** using keyboard-accessible tabs. Both views preserve the current
answers and update as selections change.
**Reset answers** stays beside question progress on every step and result.
It clears all selections and returns to the first question and full shortlist.

Recommendations are selected only from active candidates. Preference precedence
is own runtime; voice/handover/existing Standard Harness; owned autonomy; Microsoft 365
API/MCP integration; organization/audience/channel requirements; personal autonomy;
Copilot Studio actions/reasoning; knowledge-only work. The first
applicable preference among remaining candidates wins. Multiple remaining options
without a distinguishing preference produce a review result. Excluded platforms
remain in the shortlist's exclusion section, outside the result's alternatives.

The first question accepts multiple jobs: knowledge or process guidance,
business-system actions, and complex tasks/documents. Every selected job contributes
its requirements; selecting knowledge alongside actions or reasoning does not
restore a platform excluded by those needs. The summary lists all selected jobs.

The second question always asks who guides the work, as a separate single choice.
Job selections never infer ownership. Employee-directed business actions retain
Cowork subject to plugin confirmation; user direction alone does not select it.
Editing the selected jobs preserves the explicit control answer.

Audience is the third question. The Microsoft 365 knowledge/guidance job is
explicitly employee-facing: selecting it, alone or with other jobs, hides both
customer audience choices. The audience step remains visible with Employees
preselected and an explanation, so visitors can continue or go back.
Continue records the selection; going back before confirming leaves it unanswered.
Adding that job clears an incompatible audience answer and requires confirmation;
removing it restores the customer choices.
This is the scope of the job option, rather than a universal restriction on
agents that use Microsoft 365 knowledge sources.

Multi-channel requirements follow from selecting more than one of Microsoft 365,
website/custom app, and voice. Live-human handover is a service capability and
does not count as an additional channel.

Follow-up visibility is evaluated from earlier answers and the candidates still
active at that point. API/MCP integration questions disappear once Toolkit is
excluded. The existing-Standard-Harness question is skipped when voice/handover already
determines the harness preference, or the Copilot Studio options are excluded. Questions
about audience, channels, and autonomy still capture prerequisites when SDK is
the sole remaining candidate. Hidden follow-up answers are discarded; newly
relevant questions require a new answer.

The capability check distinguishes draft support, incompatibility **within the
scope of this guidance**, and unresolved requirements. It is not a universal
capability inventory. In particular, employee-oriented products are not assumed
to support external audiences/custom channels, and SDK-provided transport is
not treated as a ready-made voice, handover, or autonomous implementation.

When changing a claim, update the relevant review notes, rule, methodology,
and tests together. Key distinctions to preserve:

- Fixed-rule business steps do not force the Standard Harness.
- A custom website does not force SDK.
- Prompted-only work does not automatically mean Agent Builder.
- Toolkit API/MCP assumptions and GitHub Copilot Harness voice/multi-channel
  support remain flagged for confirmation.
- Cost, roadmap, model availability, ALM, and telemetry need current validation.

## GitHub Pages setup

Repository: [microsoft/m365-copilot-studio-what-to-build-where](https://github.com/microsoft/m365-copilot-studio-what-to-build-where).
The local `main` branch tracks `origin/main`, preserving the repository's initial
history and policy files.

1. Review, commit, and push the site changes to the repository.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Push to the default branch or run **Deploy to GitHub Pages** from that branch.

The deployment workflow reads the site's origin and base path from
`actions/configure-pages`, so there is no hardcoded owner or repository name.
It supports project sites (`/repository/`), user/organization sites (`/`), and
Pages-configured custom domains. Non-default branches do not deploy.

For a local production build of a specific URL:

```sh
SITE_URL=https://microsoft.github.io BASE_PATH=/m365-copilot-studio-what-to-build-where/ npm run build
BASE_PATH=/m365-copilot-studio-what-to-build-where/ npm run preview
```

`SITE_URL` is an origin only; `BASE_PATH` is an absolute path. The default base
is `/`. Use the same base for build and preview. All application links and
favicon URLs use `withBase`; Astro applies the base to bundled assets.

CI checks types and rules and runs browser tests at both `/` and a project path.
Deployment independently checks types and rules before building. After pushing,
check the **Deploy to GitHub Pages** workflow for the deployment status.
The project-site URL is
<https://microsoft.github.io/m365-copilot-studio-what-to-build-where/>.

## Design

CAT skills gallery-inspired blue accents, DM Sans and JetBrains Mono typography,
and semantic light/dark tokens. The wizard uses open columns, separated answer
rows, and underline tabs for the live shortlist and recorded requirements.
On mobile, the questions appear first with a live platform-count link to the
assessment panel below.
Fonts are self-hosted through Fontsource. The theme follows the system until
changed in the tab; `?scoutTheme=light` or `?scoutTheme=dark` overrides it for previews.
No Microsoft/CAT official endorsement is implied.

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
