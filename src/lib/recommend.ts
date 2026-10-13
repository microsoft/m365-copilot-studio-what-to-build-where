import { has, hasMultipleChannels, type Answers, type ProductId } from '../data/guidance';
import { type Candidate } from './candidates';
import { getFlow } from './flow';

export interface Recommendation {
  status: 'incomplete' | 'recommended' | 'review';
  primary?: Candidate;
  alternatives: Candidate[];
  candidates: Candidate[];
  excluded: Candidate[];
  issues: string[];
}

function preferenceTiers(a: Answers): ProductId[][] {
  const tiers: ProductId[][] = [];
  if (has(a, 'architecture', 'own')) tiers.push(['sdk']);
  if (has(a, 'channels', 'handover') || has(a, 'channels', 'voice') || has(a, 'existing', 'standard')) tiers.push(['standard']);
  if (has(a, 'autonomy', 'organization')) tiers.push(['studio']);
  if (has(a, 'integration', 'apis')) tiers.push(['toolkit']);
  if (has(a, 'ownership', 'organization') || has(a, 'audience', 'customers') || has(a, 'audience', 'both') ||
      has(a, 'channels', 'web') || hasMultipleChannels(a)) tiers.push(['studio']);
  if (has(a, 'autonomy', 'personal')) tiers.push(['cowork']);
  if (has(a, 'job', 'actions') || has(a, 'job', 'reasoning')) tiers.push(['studio']);
  if (has(a, 'job', 'knowledge')) tiers.push(['builder']);
  return tiers;
}

export function recommend(input: Answers): Recommendation {
  const flow = getFlow(input);
  const { candidates, active, excluded } = flow.shortlist;
  const issues = [...flow.shortlist.issues];
  if (!active.length) {
    if (!issues.length) issues.push('No platform meets the current requirements. Review the exclusion reasons and revise the relevant answers.');
    return { status: 'review', alternatives: [], candidates, excluded, issues };
  }
  if (flow.missing.length) {
    return {
      status: 'incomplete', alternatives: active, candidates, excluded,
      issues: flow.missing.map(question => `Answer “${question.title}” to continue.`),
    };
  }
  const tiers = [...preferenceTiers(flow.answers), active.map(candidate => candidate.product.id)];
  const selected = tiers.map(tier => active.filter(candidate => tier.includes(candidate.product.id)))
    .find(matches => matches.length > 0) ?? [];
  const primary = selected.length === 1 ? selected[0] : undefined;
  if (!primary) issues.push('Several platforms meet the current requirements without a distinguishing preference. Review the remaining options and their implementation responsibilities.');
  const alternatives = active.filter(candidate => candidate !== primary)
    .sort((left, right) => Number(left.confirmations.length > 0) - Number(right.confirmations.length > 0));
  return {
    status: !primary || primary.confirmations.length ? 'review' : 'recommended',
    primary, alternatives, candidates, excluded, issues,
  };
}
