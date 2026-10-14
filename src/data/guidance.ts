export type ProductId = 'builder' | 'studio' | 'standard' | 'cowork' | 'toolkit' | 'sdk';
export type QuestionId = 'job' | 'audience' | 'ownership' | 'architecture' | 'channels' | 'autonomy' | 'integration';
export type Answers = Partial<Record<QuestionId, string[]>>;

export const relatedGuidance = {
  title: 'Related guidance',
  description: 'Document link coming soon. The related document will provide further platform details and next steps.',
};

export interface Product {
  id: ProductId;
  name: string;
  shortName: string;
  category: string;
  summary: string;
  goodFor: string;
  watch: string[];
  review: string[];
}

export const products: Product[] = [
  {
    id: 'builder', name: 'Agent Builder', shortName: 'Agent Builder', category: 'No-code',
    summary: 'Enable a focused assistant over Microsoft 365 content.',
    goodFor: 'Personal or team knowledge and productivity, when people ask the questions.',
    watch: ['Enable it securely within your Microsoft 365 governance, rather than treating every use case as a central build.', 'The draft does not position it for writing to business systems or running without a prompt.'],
    review: ['Validate the current supported sources, ALM, and runtime telemetry before committing.'],
  },
  {
    id: 'studio', name: 'Copilot Studio', shortName: 'Copilot Studio · GitHub Copilot Harness', category: 'GitHub Copilot Harness',
    summary: 'Build an organization-designed agent for complex work.',
    goodFor: 'New business agents with reasoning, document processing, tool use, and organization-owned automation.',
    watch: ['If you are extending an existing Copilot Studio agent that uses the Standard Harness, consider retaining that harness for its existing topics and integrations.', 'Budget for multistep execution and autonomous work; assign an owner to review outcomes.', 'The draft does not provide live-human handover for this harness.'],
    review: ['Confirm supported channels and voice availability.', 'Validate the draft claims about reasoning models, recovery behavior, and per-request costs against current product documentation.'],
  },
  {
    id: 'standard', name: 'Copilot Studio', shortName: 'Copilot Studio · Standard Harness', category: 'Standard Harness',
    summary: 'Use Copilot Studio for voice or live-human handover, or extend an existing Standard Harness agent.',
    goodFor: 'Existing Copilot Studio agents using the Standard Harness, and the draft’s voice or live-human-handover scenarios.',
    watch: ['The Standard Harness is not the default choice for new agents. Evaluate the GitHub Copilot Harness first, unless voice or live-human handover requires Standard.', 'Fixed-rule business steps alone are not a reason to choose the Standard Harness.', 'Check the exact voice or handover integration and the channels you intend to use.'],
    review: ['Validate the roadmap and model availability; the draft’s “no major new capabilities” statement is not a verified roadmap.', 'Organization-owned autonomy and advanced reasoning requirements need confirmation for this harness.'],
  },
  {
    id: 'cowork', name: 'Cowork', shortName: 'Cowork', category: 'No agent to build',
    summary: 'Let an employee direct the work in a ready-made assistant.',
    goodFor: 'User-directed cross-app tasks, with centrally managed plugins and skills.',
    watch: ['Not a substitute for an organization-designed end-to-end process.', 'Review outputs before relying on them.'],
    review: ['Validate scheduling, event triggers, available integrations, and collaboration/ALM limits in your environment.'],
  },
  {
    id: 'toolkit', name: 'Microsoft 365 Agents Toolkit', shortName: 'M365 Agents Toolkit', category: 'Pro-code · Microsoft 365',
    summary: 'Build a Microsoft 365 agent with your own integrations.',
    goodFor: 'Prompted actions from Microsoft 365 Copilot using the team’s own APIs or MCP servers.',
    watch: ['Your team owns integration engineering, authentication, testing, and deployment.', 'The draft positions this option for tasks initiated by a user prompt.'],
    review: ['The source explicitly asks for review of API/MCP actions, Microsoft 365 grounding, and deployment assumptions. Confirm the intended agent type and supported integration path.'],
  },
  {
    id: 'sdk', name: 'Microsoft 365 Agents SDK', shortName: 'M365 Agents SDK', category: 'Pro-code · Own your runtime',
    summary: 'Bring your own models and orchestration.',
    goodFor: 'A developer-owned runtime that can serve Microsoft 365, websites, and other channels.',
    watch: ['You host and secure the solution.', 'The SDK does not supply an AI model or orchestration. Those remain your responsibility.'],
    review: ['Verify channel-specific requirements and build the orchestration, autonomy, voice, or handover capabilities you need; these are not supplied merely by choosing the SDK.'],
  },
];

export interface Choice {
  id: string;
  label: string;
  detail: string;
  when?: (answers: Answers) => boolean;
}
export interface Question {
  id: QuestionId;
  label: string;
  title: string;
  hint: string;
  singleChoiceHint?: string;
  multiple?: boolean;
  choices: Choice[];
  when?: (answers: Answers, candidates: readonly ProductId[]) => boolean;
}

export const has = (answers: Answers, key: QuestionId, value: string): boolean =>
  answers[key]?.includes(value) ?? false;

export const hasMultipleChannels = (answers: Answers): boolean =>
  ['m365', 'web', 'voice'].filter(channel => has(answers, 'channels', channel)).length > 1;

export const questions: Question[] = [
  {
    id: 'job', label: 'The job', title: 'What does the agent need to do?',
    hint: 'Select all that apply. The platform needs to support the combined requirements of the work.',
    multiple: true,
    choices: [
      { id: 'knowledge', label: 'Answer questions or guide people in Microsoft 365', detail: 'Answer employees’ policy questions or explain process steps using Microsoft 365 content. Also select business-system actions if the agent must carry out those steps.' },
      { id: 'actions', label: 'Take action in business systems', detail: 'Carry out process steps, such as creating onboarding tasks, updating employee or CRM records, and routing approvals.' },
      { id: 'reasoning', label: 'Work through a complex business task', detail: 'Combine reasoning, tools, and document processing, such as investigating invoice discrepancies or reviewing contracts.' },
    ],
  },
  {
    id: 'ownership', label: 'Behavior', title: 'Who guides the work?',
    hint: 'Choose who determines what the agent does next. Both approaches can use approved organizational content and act in business systems.',
    choices: [
      { id: 'organization', label: 'The organization', detail: 'The agent must follow organization-defined steps, checks, and escalation paths, such as coordinating onboarding tasks and approvals.' },
      { id: 'user', label: 'The person doing the work', detail: 'The person directs each task within organizational policies, permissions, and centrally managed plugins and skills.' },
    ],
  },
  {
    id: 'audience', label: 'Audience', title: 'Who will use it?',
    hint: 'Identify everyone who needs access. The Microsoft 365 job is employee-facing; other jobs can also serve customers.',
    singleChoiceHint: 'Your Microsoft 365 job selection limits this experience to employees. Go back to change the selected jobs.',
    choices: [
      { id: 'employees', label: 'Employees', detail: 'People inside your organization, using Microsoft 365 or an internal app.' },
      {
        id: 'customers', label: 'Customers', detail: 'Customers or other external users, such as visitors to a public website.',
        when: a => !has(a, 'job', 'knowledge'),
      },
      {
        id: 'both', label: 'Employees and customers', detail: 'One solution serving internal and external users, with suitable access for each.',
        when: a => !has(a, 'job', 'knowledge'),
      },
    ],
  },
  {
    id: 'architecture', label: 'Architecture', title: 'Do you need your own models or orchestration?',
    hint: 'Orchestration controls reasoning and tool use. A platform-managed agent can also be embedded in a website or custom client.',
    choices: [
      { id: 'managed', label: 'No, we need a platform-managed runtime', detail: 'Use the platform’s models and orchestration, with supported tools and integrations.' },
      { id: 'own', label: 'Yes, we must choose and run our own', detail: 'Developers select the AI services and orchestration libraries, and own hosting and security.' },
    ],
  },
  {
    id: 'channels', label: 'Channels', title: 'Where does it need to work?',
    hint: 'Select every required channel and service capability. Confirm channel support and admin approvals, including voice and live-human handover.',
    multiple: true,
    choices: [
      {
        id: 'm365', label: 'Microsoft 365 workspace', detail: 'Microsoft 365 Copilot or Teams. Check support for the specific app and interaction.',
        when: a => !has(a, 'audience', 'customers') && !has(a, 'audience', 'both'),
      },
      { id: 'web', label: 'A website or custom app', detail: 'Embed an agent in your own website or client for customers or employees.' },
      { id: 'voice', label: 'Voice', detail: 'People speak to the agent. Confirm speech and any telephone keypad requirements.' },
      { id: 'handover', label: 'Handover to a live human', detail: 'Transfer the conversation to a human service agent when needed.' },
    ],
  },
  {
    id: 'autonomy', label: 'Autonomy', title: 'Does it need to act without a prompt?',
    hint: 'Consider future schedules and event triggers. Autonomous work needs action logs, named owners, approval for high-impact steps, and a way to stop it.',
    choices: [
      { id: 'prompted', label: 'No, only when someone asks', detail: 'Every task starts with a person’s prompt, and this will remain true for the agent’s lifetime.' },
      { id: 'personal', label: 'Yes, for an employee’s own work', detail: 'Scheduled or event-driven tasks that the employee directs.' },
      { id: 'organization', label: 'Yes, as an organization-owned process', detail: 'The organization defines triggers, required steps, monitoring, and accountability for background work.' },
    ],
  },
  {
    id: 'integration', label: 'Integrations', title: 'How do you want to connect business systems?',
    hint: 'Choose how integrations will be built and maintained. Pre-authored workflows can combine fixed-rule steps with agentic work.',
    when: (a, candidates) => has(a, 'job', 'actions') && has(a, 'channels', 'm365') &&
      has(a, 'architecture', 'managed') && candidates.includes('toolkit'),
    choices: [
      { id: 'connectors', label: 'Use platform connectors and workflows', detail: 'Build business actions and pre-authored steps in a low-code tool.' },
      { id: 'apis', label: 'Use our own APIs or MCP servers', detail: 'Developers own integration code, authentication, testing, and deployment. Fixed-rule workflows use code or an external service.' },
    ],
  },
];
