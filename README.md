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
accounts, analytics, automatic answer submission, or remote font requests.

## Feedback

**Submit feedback** in the header opens the general GitHub issue form. Each
question and the result also provide a contextual feedback link. Comparison
remains available in the footer.

`src/lib/feedback.ts` selects one of two templates in `.github/ISSUE_TEMPLATE/`:
`general-feedback.yml` for the header link, with only feedback and suggestion
questions; `feedback.yml` for step and result links, with the question heading
(or "Recommendation") and selected-answer context. There is no category question
or conditional form logic. The contextual filename is retained so existing shared
step/result URLs continue to populate their fields.

Links use GitHub issue-form URL parameters keyed by field ID. Contextual links contain the
current normalized selections and question, or the result with its platform and
items to validate. Disabled, irrelevant, or stale selections are omitted. When only
one option is enabled, its displayed default is identified as unconfirmed until
Continue records it. This is a snapshot
of current requirements, not a click history. General feedback sends no answers.
Prefilled fields use text inputs and textareas. The editable context appears before the questions asking for
feedback; those questions remain blank for the visitor to complete.

Links open a new tab so the assessment remains available. Opening a contextual
link sends its URL parameters to GitHub and may leave them in browser history.
Visitors can edit or remove the context before submitting; nothing is submitted
automatically. Submission requires a GitHub account and creates a public issue.
The issue templates must be published on the repository's default branch before these
links work on GitHub. No backend, access token, or new dependency is required.

## Checks

```sh
npm run check
npm test
npm audit
npx playwright install chromium
npm run test:e2e
BASE_PATH=/m365-copilot-studio-what-to-build-where/ npm run test:e2e
```

Browser tests build the site and start/stop their own preview server on port 4327.
They cover desktop/mobile, themes, the six result candidates, uncertainty,
navigation, conditional answers, and no-JavaScript fallback. Unit tests exercise
route membership and question budgets, all nonempty job and channel combinations,
partial answers, normalization, and restoration of platforms after an answer changes.

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

- `src/data/guidance.ts`: three approaches, question definitions, six products,
  watch-outs, prerequisites, and confirmation notes.
- `src/lib/candidates.ts`: partial-answer capability checks and requirement conflicts.
- `src/lib/flow.ts`: relevant questions, choice availability, normalized answers,
  and the live shortlist.
- `src/lib/recommend.ts`: deterministic selection from remaining candidates.
- `src/scripts/finder.ts`: in-memory answers, navigation, rendering, focus.
- `src/pages/compare.astro`: public methodology and static reference.
- `tests/recommend.test.ts`: expected journeys and requirement invariants.

The first question selects one of three approaches. Membership is defined in
`approaches`, separately from capability checks, so future combinations can be
added without equating organization-designed automation with a single platform.
Automation plus deeper customization is not currently offered.

| Approach | Current platforms | Questions, including the approach |
| --- | --- | --- |
| Employee-guided work in Microsoft 365 | Agent Builder, Cowork | Work type; unprompted execution only while Agent Builder remains (2–3 total) |
| Organization-designed business process automation | Copilot Studio GitHub Copilot Harness, Standard Harness | Audience and channels (3 total) |
| Deeper customization and control | M365 Agents Toolkit, M365 Agents SDK | Development/runtime model (2 total) |

Before an approach is selected, the sidebar prompts for that choice rather than
listing six platforms. The full internal candidate set remains available, and
the comparison page lists all products under the same approach headings.
There is no default approach.

Each selection updates **Still applicable**, **Requires confirmation**, and
**Excluded** within the approach. Platforms outside its current scope are counted
separately; this is not a claim that those products lack the required capabilities.
Recommendations and alternatives come only from active in-scope candidates.
Unknown capabilities remain active with confirmation notes. Unanswered questions
impose no capability restrictions. A no-match result never silently switches
approaches.

The employee route explicitly establishes employee-directed Microsoft 365 work.
Jobs remain cumulative multi-select requirements: knowledge/process guidance,
business actions, and complex tasks/documents. Explaining onboarding steps is
distinct from performing actions, checks, and approvals. Actions or complex tasks
narrow to Cowork; business actions retain plugin/permissions confirmation.
Knowledge-only work additionally asks about unprompted execution, favoring Agent
Builder for prompted work or Cowork with scheduling confirmation when required.
User direction alone does not choose Cowork.

The automation route covers organization-designed repeatable business processes
that may include conversational experiences, workflows, or both. GitHub Copilot
Harness is always preferred unless voice or live-human handover is required.
Either requirement excludes GitHub Copilot Harness and selects Standard Harness.
This user-directed rule treats both capabilities as unsupported, superseding the
original source's unresolved voice note without changing the preserved source.
Non-voice multi-channel support remains flagged for confirmation. Job complexity,
autonomy, integration authoring, and operational controls are checks on the result
rather than extra questions.

The customization route starts with the organization's requirements for deeper
technical control; professional developers implement and operate the solution.
It distinguishes a prompted, employee-facing Microsoft 365
Copilot agent with developer-owned integrations from a developer-owned runtime.
The former selects Toolkit with integration/tooling confirmation and excludes SDK
because SDK requires team-owned models, orchestration, and hosting. The latter
selects SDK and excludes managed options. Editing or clearing the development
model restores the relevant candidates. Scope is explicit in both choices.

Multi-channel requirements follow from selecting more than one of Microsoft 365,
website/custom app, and voice. Live-human handover is a service capability and
does not count as an additional channel.
Microsoft 365 workspace is available for employee-only audiences and disabled for
customer-only or mixed audiences. Changing audience removes an incompatible
Microsoft 365 channel selection while retaining other selected channels.
The channel description lists Microsoft 365 Copilot and Teams; Outlook remains
only in the preserved source drafts, pending confirmation of support.

All choices in a relevant question stay visible in their original order. Unavailable options use
native disabled controls and a brief inline explanation identifying the earlier
answer to change. Explanations remain visible on touch devices and in screen-reader
reading mode; no tooltip is required. Unanswered prerequisites do not disable options.
Only enabled choices can be recorded or used as a displayed default.

Whole-question visibility is evaluated from earlier normalized answers and active
candidates. Hidden or incompatible answers are discarded. Changing an approach
never restores discarded selections, and newly relevant questions require a new
answer. The sidebar retains keyboard-accessible **Platform shortlist** and
**Your requirements** tabs. **Reset answers** stays beside progress, clears the
assessment, and returns to the approach question and full internal candidate set.

Non-differentiating checks move to **What you need in place: prerequisites and
next steps** on results and comparison profiles. They are explicitly unconfirmed,
not inferred answers or certified capabilities. SDK channel, audience, voice,
handover, autonomy, hosting, security, and operational responsibilities remain
visible there. Standard reasoning and autonomous-execution checks remain visible
even though the shorter flow does not ask about them.

There is no new/existing-agent question or lifecycle-based routing. Standard
Harness limitations highlight the preference for GitHub Copilot Harness for new
agents while retaining Standard for channel requirements or existing agents.
Copilot Studio GitHub Copilot Harness results also surface the consideration to
retain Standard when extending an existing Standard Harness agent, as requested
in [issue #1](https://github.com/microsoft/m365-copilot-studio-what-to-build-where/issues/1).

Results and the comparison page also include a non-clickable **Related guidance**
document placeholder for platform details and next steps. No document URL has
been supplied yet; the copy lives in `relatedGuidance` in `src/data/guidance.ts`.

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
- Voice or live-human handover excludes GitHub Copilot Harness and selects Standard.
- Toolkit API/MCP assumptions and GitHub Copilot Harness non-voice multi-channel
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
