# Agent platform guidance

Static Astro + strict TypeScript. Read README.md before source changes.
Use `npm run check`, `npm test`, and targeted Playwright tests. Do not publish or
create a GitHub repository without the user's request. This is a folder-backed
app session with a local Git repository.

## Important Notes

- State guidance and caveats directly. Avoid rhetorical "this is X, not Y"
  phrasing; retain explicit factual limitations where they affect a decision.
- Use informative, formal headings and labels. Avoid slogans, clever phrasing,
  and marketing-style copy throughout the site.
- Display "Copilot Studio" in full, with "GitHub Copilot Harness" or "Standard
  Harness" as applicable. Short labels for SDK and Toolkit retain the M365 prefix.
- Keep "(Draft)" in the page heading and browser titles while guidance is under review.
- Prefer an open wizard layout with separated answer rows and underline sidebar
  tabs. Avoid nested bordered cards and decorative badges.

- The site works independently and alongside documentation for platform owners,
  CoE leads, and platform architects. Do not frame the public introduction as
  dependent on documentation. Use formal platform-selection language rather than finder or
  build-tutorial framing; keep the introduction aligned with the supplied summary.

- Remote: `https://github.com/microsoft/m365-copilot-studio-what-to-build-where.git`.
  Local `main` tracks `origin/main`. The initial remote history and policy files
  were preserved when connecting the existing site. GitHub Pages deploys through
  `.github/workflows/deploy.yml` from the default branch.

- Observed source context: the user's decision table is a draft with unresolved
  editorial claims. The user chose to retain and visibly flag uncertainty, not
  research and certify current capabilities. Revisit notes if verified evidence arrives.
- The user requested CAT gallery accent and typography, not its gallery layout.
  Use the semantic blue/neutral theme and self-hosted DM Sans/JetBrains Mono.
- Source table and original editorial comments: `docs/source-decision-table.md`.
  Preserve this reference separately from updated site wording and rules.
- Additional question guidance: `docs/source-question-guidance.md`. Keep the
  supplied text intact; concise UI descriptions are edited separately. Group
  informational process guidance with knowledge and record-writing processes
  with business actions. New source claims require a separate decision-rule review.
- Evaluate only explicit answers; missing answers impose no
  exclusions. Keep unconfirmed capabilities active. Recommendations and alternatives
  must come from the remaining shortlist; contradictions can produce no match.
  SDK features
  supplied by application developers are not automatically platform capabilities.
- Flow visibility uses earlier answers and the remaining candidates. Discard
  hidden follow-ups and retain prerequisite checks even with a single candidate.
  Jobs are multi-select with cumulative requirements. The independent,
  single-select control question is always second; never infer control from jobs.
  User direction alone does not select Cowork; business actions retain it subject
  to plugin confirmation. Preserve explicit control when jobs change.
- User-directed scope: the Microsoft 365 knowledge/guidance job is employee-facing.
  Audience is third. Selecting that job, alone or in a combination, hides both
  customer choices and clears incompatible audience answers. This restriction
  belongs to the job option, not the channel or all Microsoft 365-grounded agents.
  Keep the audience step with Employees preselected and explain the restriction.
  Record the default only on Continue, preserving the opportunity to go back.
- Keep the platform shortlist and requirements in alternating sidebar tabs,
  defaulting to the shortlist. Avoid stacking both views vertically or adding
  decorative captions below the wizard.
- Keep Reset answers beside question progress, visible on desktop and mobile
  and disabled when empty. Reset returns to the first question and full shortlist.
- Derive multi-channel requirements from selected delivery options; do not offer
  a separate multi-channel checkbox. Handover does not count as a channel.
- Hide Microsoft 365 workspace for customer-only and mixed audiences; keep it
  for employees. Clear incompatible channel selections when audience changes.
  Outlook was supplied in the source drafts but is unverified; omit it from UI
  channel descriptions while preserving the original source documents.
- Fixed rules do not imply Standard; website embedding does not imply SDK;
  prompt-only does not imply Agent Builder. These are tested distinctions.
- GitHub Pages origin/base come from deployment metadata. Keep root and project
  path builds working. Internal URLs use `src/lib/url.ts`.
- The Astro scaffolder initially emitted an unavailable Astro version; the app
  pins the registry-resolvable 7.2.8 release. Check runtime compatibility before upgrades.
- Dependency remediation on 13 October 2026: Astro 7.2.8 addresses
  GHSA-26w7-cxv4-gfx2. The lockfile uses http-cache-semantics 4.3.0, outside the
  affected range for GHSA-ch52-4w7c-c8xp; that advisory is disputed and does not
  identify an official patched version. npm audit reported no vulnerabilities
  after these updates. Recheck advisory metadata rather than assuming permanent clearance.
- Pin unifont to 0.7.4 (within Astro's supported range): 0.7.5 pulls undici 8,
  which requires Node 22.19+, beyond the local Node 22.17 runtime. Revisit this
  override when the supported Node baseline is raised.
- Answers are in memory only. Fonts and application assets are local to the site;
  no analytics, storage of answers, or external API calls are part of this app.
- Feedback uses GitHub issue-form URL parameters matching the field IDs in
  `.github/ISSUE_TEMPLATE/feedback.yml`. General feedback includes no selections.
  Contextual links share normalized current answers, not click history, only when
  opened. Label unconfirmed single-option defaults explicitly. Warn before leaving
  that GitHub receives the selections, an account is required, and issues are public.
  Keep the form and links in the same deployment; the form must exist on default branch.
  User-directed: feedback must open in a new tab, preserving the assessment.
  Do not switch to same-tab navigation to work around embedded-preview behavior.
  Observed feedback issue: title and step prefilled, but category dropdown did not.
  GitHub community discussion 44983 documents dropdown-prefill limitations.
  Use text inputs/textareas for prefilled fields; show context before feedback
  questions so the supplied selections are easy to find. Revisit if GitHub adds support.
