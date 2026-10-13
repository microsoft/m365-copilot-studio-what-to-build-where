import { has, hasMultipleChannels, products, type Answers, type Product } from '../data/guidance';

export interface Candidate {
  product: Product;
  reasons: string[];
  blockers: string[];
  confirmations: string[];
}

export function requirementConflicts(a: Answers): string[] {
  const issues: string[] = [];
  if (has(a, 'ownership', 'user') && has(a, 'autonomy', 'organization')) {
    issues.push('You selected employee-guided behavior and organization-owned autonomy. Decide who owns the process and revise the relevant answer.');
  }
  if (has(a, 'ownership', 'organization') && has(a, 'autonomy', 'personal')) {
    issues.push('You selected an organization-designed process and employee-directed autonomous work. Clarify which behavior the solution must enforce.');
  }
  return issues;
}

export function evaluate(product: Product, a: Answers): Candidate {
  const candidate: Candidate = { product, reasons: [], blockers: [], confirmations: [] };
  const { reasons, blockers, confirmations } = candidate;
  const id = product.id;
  const isStudio = id === 'studio' || id === 'standard';
  const autonomous = has(a, 'autonomy', 'personal') || has(a, 'autonomy', 'organization');

  if (has(a, 'architecture', 'own')) {
    if (id === 'sdk') reasons.push('You need to choose your own models and orchestration; the SDK leaves that runtime with your team.');
    else blockers.push('Your requirement to supply your own models and orchestration conflicts with this platform-managed runtime.');
  }
  if ((has(a, 'audience', 'customers') || has(a, 'audience', 'both')) &&
      ['builder', 'cowork', 'toolkit'].includes(id)) {
    blockers.push('This guidance scopes this option to employee Microsoft 365 work. Your audience includes customers.');
  }
  if (has(a, 'ownership', 'organization')) {
    if (id === 'builder' || id === 'cowork') blockers.push('Your organization needs to design the process; this option is positioned for user-directed productivity.');
    if (isStudio) reasons.push('The organization can design the agent’s behavior and sensitive paths.');
    if (id === 'toolkit') confirmations.push('Confirm how the intended Toolkit agent type enforces organization-designed processes and sensitive paths.');
  }
  if (has(a, 'job', 'actions') && id === 'builder') blockers.push('The job writes to business systems; Agent Builder is not positioned for those actions in the draft.');
  if (has(a, 'job', 'reasoning') && id === 'builder') {
    blockers.push('This job goes beyond the focused Microsoft 365 knowledge assistant described for Agent Builder.');
  }
  if (has(a, 'job', 'actions') && id === 'cowork') {
    confirmations.push('Confirm the plugins and permissions required to act across your specific business apps.');
  }
  if (has(a, 'job', 'reasoning') && id === 'standard') {
    confirmations.push('Confirm whether the Standard Harness meets the reasoning, document-processing, and tool-use requirements of this task.');
  }
  if (has(a, 'job', 'reasoning') && id === 'toolkit') {
    confirmations.push('Confirm the chosen Toolkit agent type can support this complex reasoning and document workflow.');
  }
  if (has(a, 'channels', 'web') || hasMultipleChannels(a)) {
    if (['builder', 'cowork', 'toolkit'].includes(id)) blockers.push('This guidance scopes this option to employee Microsoft 365 surfaces. You require website/custom-app embedding or multi-channel delivery.');
    if (isStudio || id === 'sdk') reasons.push(hasMultipleChannels(a)
      ? 'The draft describes publishing this option across multiple channels, subject to channel-specific checks.'
      : 'The draft describes website/custom-client delivery for this option.');
    if (hasMultipleChannels(a) && id === 'studio') confirmations.push('Confirm the GitHub Copilot Harness supports every channel in your proposed combination.');
  }
  if (has(a, 'channels', 'voice')) {
    if (id === 'standard') reasons.push('The draft identifies the Standard Harness for voice; validate the exact channel and integration before deployment.');
    else if (id === 'studio') confirmations.push('Voice support in the GitHub Copilot Harness is explicitly unresolved in the source.');
    else if (id === 'sdk') confirmations.push('Confirm and implement a voice integration; the SDK alone does not supply it.');
    else blockers.push('The draft does not identify a voice-channel solution for this option.');
  }
  if (has(a, 'channels', 'handover')) {
    if (id === 'standard') reasons.push('The draft identifies the Standard Harness for live-human handover.');
    else if (id === 'sdk') confirmations.push('Confirm and implement a live-human handover integration in your own runtime.');
    else blockers.push('Live-human handover is a must-have and is not provided for this option in the draft.');
  }
  if (autonomous) {
    if (id === 'builder' || id === 'toolkit') blockers.push('You need unprompted execution; the draft positions this option as prompted only.');
    if (id === 'standard') confirmations.push('Confirm the Standard Harness supports the required autonomous triggers and execution behavior.');
    if (id === 'sdk') confirmations.push('Your team must supply and validate scheduling/event triggers and autonomous orchestration.');
    if (id === 'cowork') {
      if (has(a, 'autonomy', 'organization')) blockers.push('Cowork is not an organization-designed autonomous process.');
      else confirmations.push('Confirm the required Cowork scheduling or event trigger is available in your environment.');
    }
    if (id === 'studio' && has(a, 'autonomy', 'organization')) reasons.push('The draft positions this harness for organization-owned autonomous work and recovery between steps.');
  }
  if (id === 'toolkit' && has(a, 'integration', 'apis')) {
    reasons.push('You want a Microsoft 365 agent that calls your own APIs or MCP servers.');
    confirmations.push('API/MCP integration and deployment assumptions for Toolkit are explicitly marked for review in the source.');
  }
  if (id === 'studio' && has(a, 'job', 'actions')) reasons.push('Connectors and workflows combine business-system actions with agentic and fixed-rule steps.');
  if (id === 'studio' && has(a, 'job', 'reasoning')) reasons.push('The draft highlights reasoning, multistep tools, and document processing for this harness.');
  if (id === 'standard' && has(a, 'existing', 'standard')) reasons.push('You are extending a Copilot Studio agent that uses the Standard Harness.');
  if (id === 'builder' && has(a, 'job', 'knowledge')) reasons.push('The work includes answering questions or guiding people using Microsoft 365 content.');
  if (id === 'cowork' && has(a, 'ownership', 'user')) reasons.push('The employee directs the work; Cowork provides a ready-made assistant for that operating model.');
  if (id === 'sdk' && has(a, 'architecture', 'managed')) reasons.push('A developer-owned runtime remains an alternative, with additional hosting and orchestration responsibilities.');
  if (id === 'studio' && has(a, 'existing', 'new')) reasons.push('For new Copilot Studio agents, the draft favors the GitHub Copilot Harness, including workflows with fixed-rule steps.');
  return candidate;
}

export function assessCandidates(answers: Answers) {
  const issues = requirementConflicts(answers);
  const candidates = products.map(product => {
    const candidate = evaluate(product, answers);
    candidate.blockers.push(...issues);
    return candidate;
  });
  const active = candidates.filter(candidate => !candidate.blockers.length);
  return {
    candidates,
    active,
    applicable: active.filter(candidate => !candidate.confirmations.length),
    conditional: active.filter(candidate => candidate.confirmations.length > 0),
    excluded: candidates.filter(candidate => candidate.blockers.length > 0),
    issues,
  };
}
