export type QuestionId = 'audience' | 'direction' | 'job' | 'complexity';

export type SolutionId = 'builder' | 'cowork' | 'microsoft' | 'review';

export type Answers = Partial<Record<QuestionId, string[]>>;

export interface Choice { id: string; label: string; description: string; disabledReason?: (a: Answers) => string | undefined }

export interface Question {
  id: QuestionId; title: string; hint: string; choices: Choice[]; multiple?: boolean;
  help?: { title: string; text: string }; when: (a: Answers) => boolean;
}

export type ImplementationKind = 'configuration' | 'developer' | 'unconfirmed';

export type ExtensionRole = 'maker' | 'developer' | 'admin';

export interface SolutionExtension {
  name: string;
  implementation: ImplementationKind;
  developerCondition?: 'unsupported-operation';
}

export interface DocumentationLink { label: string; url: string }

export interface ExtensibilityOption {
  id: 'sdk' | 'agents' | 'actions' | 'packages';
  name: string; description: string;
  documentation: DocumentationLink[]; documentationNote?: string;
  considerations?: string[];
}

export interface SolutionComposition {
  authoringExperience: string; extendedBy: SolutionExtension[]; documentation: DocumentationLink[];
  extensibilityOptions?: ExtensibilityOption[];
  considerations: string[]; terminology?: string;
}

export interface SolutionOption extends SolutionComposition {
  title: string; description: string; note?: string; consideration?: 'existing-standard';
}

export interface Recommendation extends SolutionComposition {
  id: SolutionId; status: 'recommended' | 'review'; title: string; introduction: string;
  guidance?: string; authentication?: string; coverageFallback?: string;
  reasons: string[];
  alternatives: string[]; excluded: string[];
  options: SolutionOption[];
}

export const extensionRoles: Record<ImplementationKind, readonly ExtensionRole[]> = {
  configuration: ['maker', 'admin'],
  developer: ['developer', 'admin'],
  unconfirmed: ['maker', 'admin'],
};

export const roleDetails: Record<ExtensionRole, { label: string; icon: string }> = {
  maker: {
    label: 'Maker',
    icon: '<path d="M3 6h8m4 0h6M3 12h3m4 0h11M3 18h11m4 0h3"/><circle cx="13" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  },
  developer: {
    label: 'Developer',
    icon: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18"/>',
  },
  admin: {
    label: 'Admin',
    icon: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  },
};

export const documentation = {
  cowork: { label: 'Customize Cowork', url: 'https://learn.microsoft.com/en-us/copilot/cowork/cowork-customize' },
  coworkDevelopment: { label: 'Build Cowork plugins', url: 'https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugin-development' },
  coworkAdministration: { label: 'Cowork plugin administration', url: 'https://learn.microsoft.com/en-us/copilot/cowork/cowork-manage-plugins' },
  copilotAdministration: { label: 'Microsoft 365 agent administration', url: 'https://learn.microsoft.com/en-us/microsoft-agent-365/admin/manage-copilot-agents-integrated-apps' },
  plugins: { label: 'Copilot plugins', url: 'https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugins-overview' },
  declarativeAgents: { label: 'Declarative agents and plugin packages', url: 'https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/overview-declarative-agent' },
  pluginRegistry: { label: 'Plugins naming and registry announcement', url: 'https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/introducing-the-plugin-registry---one-place-to-discover-and-govern-plugins-for-m/4559682' },
  actions: { label: 'Agent API/MCP actions', url: 'https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/overview-plugins' },
  wiqd: { label: 'Work IQ Dev Tools (preview)', url: 'https://microsoft.github.io/wiqd/' },
  builder: { label: 'Agent Builder documentation', url: 'https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agent-builder' },
  microsoftHarness: { label: 'Microsoft Copilot harness documentation', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/overview' },
  standardHarness: { label: 'Standard harness documentation', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-get-started' },
  microsoftA2a: { label: 'A2A', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/add-agent-to-agent' },
  microsoftFoundry: { label: 'Foundry agents', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/add-agent-foundry' },
  standardA2a: { label: 'A2A', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-agent-agent-to-agent' },
  standardFoundry: { label: 'Foundry agents', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-agent-foundry-agent' },
  studioAdministration: { label: 'Copilot Studio security and governance', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/security-and-governance' },
  sdk: { label: 'M365 Agents SDK overview', url: 'https://learn.microsoft.com/en-us/microsoft-365/agents-sdk/agents-sdk-overview' },
  studioMcp: { label: 'Copilot Studio MCP tools', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-mcp' },
  sdkIntegration: { label: 'Copilot Studio SDK integration', url: 'https://learn.microsoft.com/en-us/microsoft-365/agents-sdk/integrate-with-mcs' },
  coworkLicensing: { label: 'Cowork licensing', url: 'https://learn.microsoft.com/en-us/copilot/cowork/cowork-manage-plugins#prerequisites' },
  builderLicensing: { label: 'Agent Builder licensing', url: 'https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agent-builder#licensing' },
  copilotLicensing: { label: 'Microsoft 365 Copilot extensibility licensing', url: 'https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/cost-considerations' },
  microsoftLicensing: { label: 'Microsoft Copilot harness licensing and billing', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/billing-credit-overview' },
  standardLicensing: { label: 'Standard harness licensing', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/billing-licensing' },
  upgrade: { label: 'Copilot Studio plugin upgrade guidance', url: 'https://github.com/microsoft/copilot-studio-plugin/blob/main/commands/migrate.md' },
  studioAuthoring: { label: 'Create and test in Copilot Studio', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/authoring-first-bot' },
  studioPlugin: { label: 'Code-based authoring with the Copilot Studio plugin', url: 'https://github.com/microsoft/copilot-studio-plugin' },
} satisfies Record<string, DocumentationLink>;

export const coworkAuthoring = 'Cowork Customize for configuration; optional Work IQ Dev Tools (preview) for custom plugin packages.';

export const microsoftAuthoring = 'Create and test in Copilot Studio. Other authoring surfaces: Cowork or coding agents (GitHub Copilot CLI or GitHub Copilot app).';

export const declarativeAgentTerminology = 'Copilot is replacing the Agents page with Plugins. Declarative agents remain the conversational component; a plugin can package an agent with skills and integrations. Standalone agents remain supported.';

export const experienceTitles = {
  copilot: 'Microsoft 365 Copilot declarative agent',
  microsoft: 'Copilot Studio agent with the Microsoft Copilot harness',
  standard: 'Copilot Studio agent with the Standard harness',
};

export const has = (a: Answers, id: QuestionId, value: string): boolean => a[id]?.includes(value) ?? false;

export const employee = (a: Answers): boolean => has(a, 'direction', 'employee');

export const organization = (a: Answers): boolean => has(a, 'direction', 'organization');

export const m365Experience = (a: Answers): boolean => has(a, 'audience', 'employees-m365');

export const studioAudience = (a: Answers): boolean => has(a, 'audience', 'employees-web') || has(a, 'audience', 'customers-web');

export const questions: Question[] = [
  {
    id: 'audience', title: 'Who will use the agent, and where?',
    hint: 'Choose the audience and experience for this use case.',
    when: () => true,
    choices: [
      { id: 'employees-m365', label: 'Employees in Microsoft 365', description: 'An employee experience in the Microsoft 365 Copilot workspace.' },
      { id: 'employees-web', label: 'Employees across a website or custom app and Microsoft 365 Copilot or Teams', description: 'The same agent must work on an internal, authenticated website or custom app, plus Microsoft 365 Copilot, Teams, or both.' },
      { id: 'customers-web', label: 'Customers on a website or in a custom app', description: 'A customer-facing conversation embedded in a website, web app, or mobile app.' },
      { id: 'customers-voice', label: 'Customers using voice or telephony', description: 'A customer-facing voice conversation, including telephone-based services.', disabledReason: () => 'Not covered by this wizard. More guidance coming soon.' },
    ],
  },
  {
    id: 'direction', title: 'Who directs the work?',
    hint: 'Think about one use case. Who decides the outcome and the steps to take?',
    when: a => m365Experience(a),
    choices: [
      { id: 'employee', label: 'The person using the agent guides the task', description: 'The person directs the task using approved knowledge and capabilities. This can include reading or updating CRM records.' },
      { id: 'organization', label: 'The organization defines the process', description: 'The solution must follow defined steps, controls, and responsibilities, with room for the agent to adapt.' },
    ],
    help: { title: 'How do I distinguish these?', text: 'A person can ask an agent to retrieve information or carry out a permitted operation through approved integrations, while directing the task and its execution. In an organization-designed process, the solution defines the required steps, checks, and responsibilities. Both patterns can read and write systems of record, subject to permissions and approval policies. The distinction is who directs the work. If your project includes both, consider one part at a time.' },
  },
  {
    id: 'job', title: 'What does the agent need to do?',
    hint: 'Select all that apply. The recommended solution must support the combined requirements.',
    when: a => employee(a), multiple: true,
    choices: [
      { id: 'knowledge', label: 'Answer questions or provide guidance', description: 'Use approved content to explain policies, procedures, or information. Select business-system actions too for live business-record lookups or changes.' },
      { id: 'actions', label: 'Take action in business systems', description: 'Use an integration to look up, create or update business records in systems such as CRM, ERP or HR.' },
      { id: 'complex', label: 'Coordinate complex work across apps and documents', description: 'Gather information, compare documents, and produce or edit content across apps. Select business-system actions too for live business-record lookups or updates.' },
    ],
    help: { title: 'How do I describe a combined task?', text: 'For a renewal briefing that gathers email and contract context and updates CRM, select cross-app work and business-system actions. Select questions or guidance as well only if answering questions is a separate requirement. Explaining onboarding policies is guidance; checking an approval or creating an onboarding record requires business-system actions. You do not need to choose an implementation tool here.' },
  },
  {
    id: 'complexity', title: 'Which type of use case best describes the agent?',
    hint: 'If the use case includes both, choose multi-step work across tools and documents.',
    when: a => organization(a) || studioAudience(a),
    choices: [
      { id: 'complex', label: 'Multi-step work across tools and documents', description: 'Gather information from several tools, plan the next steps, and produce or edit documents as the task progresses.' },
      { id: 'routine', label: 'Question answering or defined business actions', description: 'Answer questions, retrieve information, or complete defined operations such as checking a record or submitting a request.' },
    ],
  },
];

export function customExtensibility(harness: 'microsoft' | 'standard'): ExtensibilityOption[] {
  return [{
    id: 'sdk', name: 'M365 Agents SDK',
    description: 'Build custom handover patterns, custom orchestration using your own model, or additional integrations.',
    documentation: [documentation.sdk],
    documentationNote: harness === 'microsoft' ? 'Custom handover pattern coming soon.' : undefined,
    considerations: [
      "Use Copilot Studio's built-in publishing options when they meet your needs. For SDK extensions, your team maintains the custom code and any services it hosts.",
      'If you build orchestration using your own model, your team also operates and evaluates those components and owns their compliance and responsible AI.',
    ],
  }, {
    id: 'agents', name: 'Agent connections',
    description: 'Connect to A2A-compatible agents or Foundry agents.',
    documentation: harness === 'microsoft'
      ? [documentation.microsoftA2a, documentation.microsoftFoundry]
      : [documentation.standardA2a, documentation.standardFoundry],
  }];
}
