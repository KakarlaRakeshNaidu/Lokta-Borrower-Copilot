import type { AssessmentResult, MoneyRange, RateRange } from '../types';

function rangeProblems(label: string, range: MoneyRange | RateRange | null): string[] {
  if (!range) return [];
  const problems: string[] = [];
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) problems.push(`${label} contains a non-finite value`);
  if (range.min < 0 || range.max < 0) problems.push(`${label} contains a negative value`);
  if (range.min > range.max) problems.push(`${label} is not ordered`);
  return problems;
}

export function validateAssessmentConsistency(result: AssessmentResult): string[] {
  const problems: string[] = [];
  problems.push(...rangeProblems('safe amount', result.safe.amountRange));
  problems.push(...rangeProblems('lender amount', result.lender.amountRange));
  problems.push(...rangeProblems('safe EMI', result.safe.emiRange));
  problems.push(...rangeProblems('lender EMI', result.lender.emiRange));
  problems.push(...rangeProblems('borrower fair rate', result.pricing.borrowerFairRate));
  problems.push(...rangeProblems('borrower fair APR', result.pricing.borrowerFairApr));
  problems.push(...rangeProblems('market APR', result.pricing.marketPossibleApr));
  problems.push(...rangeProblems('emergency amount', result.capacity.emergencyOnlyAmountRange));
  problems.push(...rangeProblems('emergency EMI', result.capacity.emergencyOnlyEmiRange));

  if (result.verdict === 'dont_borrow' && result.capacity.recommendedAmount !== 0) problems.push("Don't borrow cannot have a positive recommended amount");
  if (result.verdict === 'dont_borrow' && result.negotiationCard.amountToAskFor !== 0) problems.push("Don't borrow card cannot ask for a positive amount");
  if (result.verdict === 'dont_borrow' && result.tenureOptions.length > 0) problems.push("Don't borrow cannot show active tenure options");
  if (result.verdict === 'dont_borrow' && result.negotiationCard.offerComparison && result.negotiationCard.offerComparison.assessment !== 'unsafe_regardless_of_rate') problems.push("Don't borrow quote must be unsafe regardless of price");
  if (result.verdict === 'borrow' && result.safe.amountRange.max <= 0) problems.push('Borrow verdict requires positive safe amount');
  if (result.verdict === 'borrow_less' && result.capacity.recommendedAmount >= result.answers.requestedAmount) problems.push('Borrow-less verdict must recommend less than requested');
  if (result.safeMonthlyEmi < 0 || !Number.isFinite(result.safeMonthlyEmi)) problems.push('Safe monthly EMI is invalid');
  if (result.pricing.borrowerFairApr.min + 0.05 < result.pricing.borrowerFairRate.min) problems.push('APR should not be below nominal rate when fees are present');
  if (result.pricing.borrowerFairApr.max > result.pricing.avoidAboveApr && !result.pricing.tooWideForSingleFairBand) problems.push('Fair APR cannot exceed avoid-above APR without an uncertainty warning');
  if ((result.negotiationCard.offerComparison?.assessment === 'good' || result.negotiationCard.offerComparison?.assessment === 'acceptable') && result.verdict !== 'borrow' && result.stress.status === 'fails') problems.push('A failing stress case cannot have a positive quote verdict');
  if (result.confidence.level === 'high' && result.confidence.loweredBy.some((item) => item.includes('unknown'))) problems.push('High confidence cannot cite unknown data as widening the estimate');
  if (result.stress.status === 'fails' && result.verdict === 'borrow') problems.push('Borrow verdict cannot ignore a failed stress test');
  return problems;
}

export function assertAssessmentConsistency(result: AssessmentResult): void {
  const problems = validateAssessmentConsistency(result);
  if (problems.length > 0) throw new Error(`Assessment consistency failed:\n${problems.join('\n')}`);
}
