export type ProductId = 'builder' | 'studio' | 'standard' | 'cowork' | 'toolkit' | 'sdk';
export type QuestionId = 'approach' | 'job' | 'audience' | 'ownership' | 'architecture' | 'channels' | 'autonomy' | 'integration';
export type Answers = Partial<Record<QuestionId, string[]>>;

export interface Approach {
  id: 'employee' | 'automation' | 'custom';
  label: string;
  detail: string;
  scope: string;
  products: readonly ProductId[];
}

export const approaches: readonly Approach[] = [
  {
    id: 'employee',
    label: 'Employee-guided work in Microsoft 365',
    detail: 'The employee asks questions or directs work across apps. The organization governs knowledge, connectors, plugins, and skills.',
    scope: 'Employee-directed work in Microsoft 365, with organizational governance of access and building blocks. The employee chooses the sequence of work.',
    products: ['builder', 'cowork'],
  },
  {
    id: 'automation',
    label: 'Organization-designed business process automation',
    detail: 'The organization designs a repeatable business process that may include conversational experiences, workflows, or both, using governed tools, integrations, and agentic reasoning.',
    scope: 'Organization-designed repeatable business processes that may include conversational experiences, workflows, or both. This guidance currently covers the two Copilot Studio harnesses in this approach; the category is broader than these platforms.',
    products: ['studio', 'standard'],
  },
  {
    id: 'custom',
    label: 'Deeper customization and control',
    detail: 'The organization requires greater control over integrations, models, orchestration, hosting, channels, or software delivery.',
    scope: 'The organization requires deeper technical control. Professional developers implement, secure, test, and operate the integrations or runtime.',
    products: ['toolkit', 'sdk'],
  },
];

export function getApproach(answers: Answers): Approach | undefined {
  return answers.approach?.length === 1
    ? approaches.find(approach => approach.id === answers.approach?.[0])
    : undefined;
}

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
    watch: ['If you are extending an existing Copilot Studio agent that uses the Standard Harness, consider retaining that harness for its existing topics and integrations.', 'Budget for multistep execution and autonomous work; assign an owner to review outcomes.', 'Voice and live-human handover are not supported by this harness. Use Copilot Studio Standard Harness for those requirements.'],
    review: ['Confirm the required non-voice publishing channels and channel combinations.', 'Validate the draft claims about reasoning models, recovery behavior, and per-request costs against current product documentation.'],
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

export const prerequisiteTitle = 'What you need in place: prerequisites and next steps';
export const prerequisiteNotice = 'These checks remain to be completed. They were not confirmed by your assessment answers.';
export const prerequisites: Record<ProductId, string[]> = {
  builder: [
    'Confirm Microsoft 365 access, approved knowledge sources, connector availability, permissions, and sharing policies.',
    'Validate answer quality, maker telemetry, and lifecycle requirements. Business-system writes or unprompted execution need another route.',
  ],
  cowork: [
    'Confirm access to the required apps and centrally managed connectors, plugins, and skills, including permissions for business-system actions.',
    'Validate scheduling or event-trigger availability if needed. The employee must direct the work; prescribed end-to-end processes need the organization-designed approach.',
    'Set expectations for reviewing generated documents, outputs, and completed actions.',
  ],
  studio: [
    'Define conversation behavior, process ownership, required steps, approvals, tools, knowledge, and integration permissions.',
    'Confirm the required non-voice publishing channels. Voice and live-human handover require the Standard Harness in this guidance.',
    'Pilot reasoning and document workloads, estimate consumption, and establish evaluations, ALM, monitoring, and controls for autonomous execution.',
  ],
  standard: [
    'Validate the exact publishing, voice, speech/DTMF, and live-human handover integrations required.',
    'Confirm support for complex reasoning, document processing, autonomous triggers, and execution behavior if the process needs them.',
    'Review existing topics and integrations, configure evaluations and monitoring, and assess GitHub Copilot Harness for new agents without Standard-specific requirements.',
  ],
  toolkit: [
    'Confirm the intended prompted, employee-facing Microsoft 365 Copilot agent type and current API/MCP integration, grounding, and tooling support.',
    'Own API/MCP hosting, app registrations, scopes, permissions, authentication, integration testing, telemetry, and support.',
    'Plan source control and deployment. Deterministic workflows require code or an external workflow service; unprompted execution is outside this option’s draft scope.',
  ],
  sdk: [
    'Select and implement AI services, models, orchestration, hosting, security, and conversation handling.',
    'Validate audience access and implement each required channel. Voice, human handover, and scheduling/event triggers are not supplied merely by choosing the SDK.',
    'Own testing, evaluations, deployment, monitoring, support, compliance, and responsible AI. Confirm current roadmap constraints for the intended scenario.',
  ],
};

export interface Choice {
  id: string;
  label: string;
  detail: string;
  disabledReason?: (answers: Answers) => string | undefined;
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
    id: 'approach', label: 'Approach', title: 'Which approach does your scenario require?',
    hint: 'Choose how the work will be directed and delivered. Each approach narrows the assessment to two currently covered platforms.',
    choices: approaches.map(({ id, label, detail }) => ({ id, label, detail })),
  },
  {
    id: 'job', label: 'The job', title: 'What does the agent need to do?',
    hint: 'Select all that apply. The platform needs to support the combined requirements of the work.',
    when: a => has(a, 'approach', 'employee'),
    multiple: true,
    choices: [
      { id: 'knowledge', label: 'Answer questions or guide people in Microsoft 365', detail: 'Answer employees’ policy questions or explain process steps using Microsoft 365 content. Also select business-system actions if the agent must carry out those steps.' },
      { id: 'actions', label: 'Take action in business systems', detail: 'Carry out process steps, such as creating onboarding tasks, updating employee or CRM records, and routing approvals.' },
      { id: 'reasoning', label: 'Work through a complex business task', detail: 'Combine reasoning, tools, and document processing, such as investigating invoice discrepancies or reviewing contracts.' },
    ],
  },
  {
    id: 'audience', label: 'Audience', title: 'Who will use it?',
    hint: 'Identify everyone who needs access so the available delivery options match the audience.',
    when: a => has(a, 'approach', 'automation'),
    choices: [
      { id: 'employees', label: 'Employees', detail: 'People inside your organization, using Microsoft 365 or an internal app.' },
      { id: 'customers', label: 'Customers', detail: 'Customers or other external users, such as visitors to a public website.' },
      { id: 'both', label: 'Employees and customers', detail: 'One solution serving internal and external users, with suitable access for each.' },
    ],
  },
  {
    id: 'architecture', label: 'Development model', title: 'Which development model do you need?',
    hint: 'Choose the scope your team must implement and operate. Review the responsibilities and remaining checks in the result.',
    when: a => has(a, 'approach', 'custom'),
    choices: [
      { id: 'managed', label: 'A Microsoft 365 Copilot agent with developer-owned integrations', detail: 'Prompted, employee-facing work using Microsoft 365 Copilot models and orchestration. Developers own instructions, API/MCP integrations, testing, and deployment.' },
      { id: 'own', label: 'An agent with a developer-owned runtime', detail: 'Choose and operate your models and orchestration, or build one backend for Microsoft 365 and other channels. Your team owns hosting and security.' },
    ],
  },
  {
    id: 'channels', label: 'Channels', title: 'Where does it need to work?',
    hint: 'Select every required channel and service capability. Confirm channel support and admin approvals, including voice and live-human handover.',
    when: a => has(a, 'approach', 'automation'),
    multiple: true,
    choices: [
      {
        id: 'm365', label: 'Microsoft 365 workspace', detail: 'Microsoft 365 Copilot or Teams. Check support for the specific app and interaction.',
        disabledReason: a => has(a, 'audience', 'customers') || has(a, 'audience', 'both')
          ? 'Choose "Employees" in "Who will use it?" to enable this channel.' : undefined,
      },
      { id: 'web', label: 'A website or custom app', detail: 'Embed an agent in your own website or client for customers or employees.' },
      { id: 'voice', label: 'Voice', detail: 'People speak to the agent. Requires Copilot Studio Standard Harness; confirm speech and any telephone keypad requirements.' },
      { id: 'handover', label: 'Handover to a live human', detail: 'Transfer the conversation to a human service agent. Requires Copilot Studio Standard Harness.' },
    ],
  },
  {
    id: 'autonomy', label: 'Autonomy', title: 'Does it need to act without a prompt?',
    hint: 'Consider schedules and event triggers for the employee’s work. Availability still needs confirmation in your environment.',
    when: (a, candidates) => has(a, 'approach', 'employee') && !!a.job?.length && candidates.includes('builder'),
    choices: [
      { id: 'prompted', label: 'No, only when someone asks', detail: 'Every task starts with a person’s prompt. Unprompted execution is not required.' },
      { id: 'personal', label: 'Yes, on a schedule or when an event occurs', detail: 'Start tasks automatically rather than waiting for a prompt. Confirm the required trigger is available.' },
    ],
  },
];
