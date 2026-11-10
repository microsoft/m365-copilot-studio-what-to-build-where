import { has, employee, m365Experience, organization, studioAudience, documentation, experienceTitles, coworkAuthoring, microsoftAuthoring, declarativeAgentTerminology, customExtensibility, type Answers, type Recommendation } from '../data/guidance';
import { getFlow } from './flow';
export function recommend(input: Answers): Recommendation {
  const { answers, missing } = getFlow(input);
  if (missing.length) throw new Error('Cannot recommend before all relevant questions have answers.');
  const r: Recommendation = {
    id: 'review', status: 'recommended', title: '', introduction: '',
    reasons: [], alternatives: [], excluded: [],
    options: [], authoringExperience: '', extendedBy: [], documentation: [], considerations: [],
  };
  if (employee(answers) && m365Experience(answers)) {
    const actions = has(answers, 'job', 'actions');
    const complex = has(answers, 'job', 'complex');
    if (has(answers, 'job', 'knowledge')) {
      r.reasons.push('Questions and guidance: answer policy or process questions using the approved organizational knowledge sources, and confirm access to that content.');
    }
    if (actions) {
      r.reasons.push('Business-system actions: retrieving or changing live records needs supported integrations, permissions and coverage of each required operation.');
    }
    if (complex) {
      r.reasons.push('Cross-app and document work: Cowork coordinates information gathering, document comparison and content creation across apps. Validate the required sources and outputs.');
    }
    if (complex || actions) {
      r.id = 'cowork';
      r.title = 'Cowork';
      r.authoringExperience = coworkAuthoring;
      r.documentation = [documentation.cowork, documentation.coworkDevelopment, documentation.coworkAdministration, documentation.coworkLicensing];
      r.considerations = [
        'The employee directs the task and sequence of work. Use an organization-designed agent when prescribed steps and controls are required.',
        'Review outputs and completed actions before relying on them.',
        'Confirm support for each capability and publishing route. Connected services may need separate sign-in or consent; assign owners for shared instructions, connections and updates.',
        "Govern scheduled and event-driven tasks, which run with their creator's permissions.",
      ];
      r.extensibilityOptions = [
        { id: 'packages', name: 'Custom plugin packages', description: 'Use Work IQ Dev Tools (preview) when a developer-managed package is required. The solution team owns any custom service code and its lifecycle.', documentation: [documentation.coworkDevelopment, documentation.wiqd] },
      ];
      r.extendedBy.push({
        name: actions ? 'Existing or custom plugins and integrations' : 'Optional skills, plugins, and connectors',
        implementation: 'unconfirmed',
        developerCondition: 'unsupported-operation',
      });
      r.introduction = complex
        ? 'Ready-made experience for employee-directed, cross-app work.'
        : 'Use existing or custom plugins for the required business operations.';
      r.reasons.push(complex
        ? 'The task requires coordinated reasoning, tool use, and work across Microsoft 365 apps and documents.'
        : 'Cowork can perform employee-directed business actions through supported plugins and integrations, which may be reused or developed for the task.');
      if (actions) {
        r.guidance = 'Cowork is the preferred starting point for this employee-guided task. Validate the required knowledge and integrations, using existing or custom plugins.';
        r.coverageFallback = complex
          ? "If coverage is incomplete, assess custom Cowork plugins or integrations and validate the combined task. A dedicated Copilot agent does not automatically provide Cowork's cross-app capabilities."
          : 'If coverage is incomplete, assess custom plugins or integrations for Cowork. Compare the dedicated-agent approach based on the experience you need, not existing plugin availability alone.';
        r.status = 'review';
        r.reasons.push('Confirm each required operation through an existing or custom Cowork integration. Missing integrations or business logic may require developer work without changing the Cowork experience.');
      }
      r.reasons.push('Admins deploy and govern plugins. Makers can configure skills in Cowork Customize, and users connect services through Sources & Skills. Customer-developed code is not required to adopt existing plugins. Work IQ Dev Tools (preview) is optional for custom plugin packages; connector/service code may require developers.');
      if (complex) {
        r.excluded.push('Agent Builder alone does not provide the selected complex cross-app execution experience.');
        r.excluded.push('Work IQ Dev Tools (preview) authors supported agent/plugin packages; the tooling alone does not supply the Cowork execution experience.');
      } else {
        r.options = [{
          title: 'Microsoft 365 Copilot declarative agent: pro-code authoring',
          description: 'Build a task-specific assistant that users invoke in Microsoft 365 Copilot, with reusable instructions, curated knowledge and custom actions.',
          terminology: declarativeAgentTerminology,
          authoringExperience: 'Work IQ Dev Tools (preview)',
          extendedBy: [{
            name: 'API/MCP actions',
            implementation: 'developer',
          }],
          documentation: [documentation.plugins, documentation.declarativeAgents, documentation.pluginRegistry, documentation.actions, documentation.wiqd, documentation.copilotAdministration, documentation.copilotLicensing],
          considerations: [
            "The employee still directs the wider process. Microsoft 365 Copilot provides the agent's models and orchestration.",
            'Confirm host, capability and preview restrictions for Work IQ Dev Tools. Hosted-runtime visibility is limited to supported diagnostics and reports.',
            'Your team owns API/MCP hosting, identity, permissions, support and instrumentation. Keep deterministic business logic in those services.',
          ],
          extensibilityOptions: [
            { id: 'actions', name: 'Custom service implementations', description: 'Develop and operate the APIs or MCP services the agent calls for integrations, AI-service calls, or business logic. Microsoft 365 Copilot continues to provide the managed models and conversation orchestration.', documentation: [documentation.actions, documentation.wiqd] },
          ],
        }];
      }
    } else {
      r.id = 'builder';
      r.title = experienceTitles.copilot;
      r.authoringExperience = 'Agent Builder';
      r.extendedBy.push({ name: 'Knowledge sources and optional skills', implementation: 'configuration' });
      r.documentation = [documentation.builder, documentation.declarativeAgents, documentation.plugins, documentation.pluginRegistry, documentation.copilotAdministration, documentation.builderLicensing];
      r.terminology = declarativeAgentTerminology;
      r.considerations = [
        'The employee still directs the wider process; configuring an agent does not define an end-to-end business process.',
        'Agent Builder has more limited integrations, lifecycle management and telemetry than pro-code or Copilot Studio routes. It does not author custom external-service actions.',
        'Confirm host, sharing and data-access support. Plugin availability does not grant access to knowledge or connected services.',
      ];
      r.extensibilityOptions = [
        { id: 'packages', name: 'Developer-managed agent or plugin packages', description: 'Use Work IQ Dev Tools (preview) for supported developer-authored packages, custom service integrations, and source-controlled releases. Agent Builder does not author custom external-service actions; native knowledge and supported skills remain part of building and configuring the agent.', documentation: [documentation.actions, documentation.wiqd] },
      ];
      r.introduction = 'Answer questions and provide guidance from approved knowledge.';
      r.guidance = 'Create and configure this agent in Agent Builder.';
      r.reasons.push('Employees need answers or guidance from approved content. You have not selected business-system actions or cross-app execution.');
      r.alternatives.push('Use approved knowledge directly in Microsoft 365 Copilot Chat if the task does not need a separately configured assistant with its own instructions and sharing scope.');
      r.alternatives.push('Use Work IQ Dev Tools (preview) instead of Agent Builder when you need developer-managed agent packages or custom service actions. Reusing an approved integration alone does not require developer authoring.');
    }
    if (actions) r.excluded.push('Agent Builder does not author custom external-service actions. A knowledge-only Agent Builder solution does not meet the selected business-system action requirement.');
  } else {
    const complex = has(answers, 'complexity', 'complex') || has(answers, 'job', 'complex');
    r.id = 'microsoft';
    r.title = experienceTitles.microsoft;
    r.authoringExperience = microsoftAuthoring;
    r.documentation = [documentation.microsoftHarness, documentation.studioAuthoring, documentation.studioPlugin, documentation.studioAdministration, documentation.microsoftLicensing];
    if (has(answers, 'audience', 'customers-web')) r.authentication = 'Website or custom app authentication: anonymous access or Microsoft Entra ID.';
    if (has(answers, 'audience', 'employees-web')) r.authentication = 'Internal website or custom app authentication: Microsoft Entra ID.';
    r.extensibilityOptions = customExtensibility('microsoft');
    r.considerations = [
      'Pilot consumption for your workload rather than assuming a fixed cost comparison with Standard.',
      'Confirm the required publishing channels. The Microsoft Copilot harness does not support voice. Custom live-human handover requires a separate integration pattern.',
    ];
    r.introduction = !complex
      ? 'The preferred approach for question answering and defined business actions.'
      : organization(answers)
        ? 'A managed runtime for organization-designed conversational processes.'
        : 'A managed agent for the selected audience and channels.';
    if (organization(answers) || studioAudience(answers)) {
      r.extendedBy.push({ name: 'Knowledge sources, skills, MCP servers, tools and workflows', implementation: 'configuration' });
    } else if (!has(answers, 'job', 'actions')) {
      r.extendedBy.push({ name: 'Knowledge sources and optional tools', implementation: 'configuration' });
    }
    if (has(answers, 'job', 'actions')) {
      r.extendedBy.push({
        name: 'Business-system connectors or tools',
        implementation: 'unconfirmed',
      });
      r.reasons.push('The process also requires business-system operations; the integrations and permissions are separate feasibility checks.');
    }
    r.reasons.push(complex
      ? 'The process requires complex reasoning, iterative planning, and coordinated work across tools and documents.'
      : 'The use case requires question answering or defined business actions. The Microsoft Copilot harness remains the preferred managed approach.');
    if (m365Experience(answers)) {
      r.reasons.push('The organization defines the process. Design and evaluate the required checks and approvals in the agent; the harness choice alone does not enforce them.');
    } else {
      r.reasons.push('The same agent must serve the selected website or custom app experience. Validate publishing, sign-in and access for each required destination.');
    }
    if (!m365Experience(answers)) {
      r.excluded.push('Microsoft 365-only experiences do not meet the selected audience and channel requirements.');
    }
    r.status = 'review';
    if (!complex) {
      r.options.push({
        title: experienceTitles.standard,
        description: 'Recommended only for extending an existing agent that is working well and still meets requirements.',
        note: 'This guidance prefers upgrading to the Microsoft Copilot harness. Standard remains supported and maintained. Forward-looking capability and model investment focuses mainly on newer harnesses.',
        consideration: 'existing-standard',
        authoringExperience: 'Copilot Studio',
        extendedBy: [{ name: 'Knowledge, topics and tools', implementation: 'configuration' }],
        extensibilityOptions: customExtensibility('standard'),
        documentation: [documentation.standardHarness, documentation.studioAdministration, documentation.standardLicensing, documentation.upgrade],
        considerations: [
          'Standard uses a chat-model and topic-based architecture rather than the newer reasoning-loop architecture.',
          'Preserve existing functionality and run automated evaluations when models or agent behavior change.',
        ],
      });
    }
  }
  return r;
}
