import type { BorrowerAnswers, ConfidenceResult, ProductRoutingResult, RateAssessment, RateRange, Reason } from '../types';
import { isKnown } from '../types';
import { calculateApr } from '../calculations/apr';
import { normalizeRateRange, roundMoneyRange, roundRate, roundRateRange } from '../calculations/range';
import { avoidAprPremiumByProduct, baseRateBands, borrowerFriendlyHighCostDebtModifier, borrowerFriendlyRecentMissModifier, borrowerFriendlyThinFileModifier, borrowerFriendlyUnknownScoreModifier, cashHeavyModifier, feeRules, gstOnFeesPct, highCostDebtModifier, highRiskMarketWidthThreshold, productRules, recentMissModifier, scoreRateModifiers, stableSalaryModifier, thinFileModifier, unknownScoreModifier, verdictRules } from '../rules';
import { reason } from './reason';

function addModifier(range: RateRange, modifier: { minDelta: number; maxDelta: number; width?: number }): RateRange {
  const width = modifier.width ?? 0;
  const min = Math.max(0, range.min + modifier.minDelta - Math.max(0, width));
  const max = range.max + modifier.maxDelta + Math.max(0, width);
  return normalizeRateRange({ min, max: Math.max(min, max) });
}

function scoreModifier(score: number) {
  if (score >= scoreRateModifiers.superPrime.minScore) return scoreRateModifiers.superPrime;
  if (score >= scoreRateModifiers.primePlus.minScore) return scoreRateModifiers.primePlus;
  if (score >= scoreRateModifiers.prime.minScore) return scoreRateModifiers.prime;
  if (score >= scoreRateModifiers.nearPrime.minScore) return scoreRateModifiers.nearPrime;
  return scoreRateModifiers.weak;
}

function aprRangeFor(params: { amount: number; rate: RateRange; feeAmount: { min: number; max: number }; tenureMonths: number }): RateRange {
  const aprMin = calculateApr({ principal: params.amount, nominalRateAnnual: params.rate.min, tenureMonths: params.tenureMonths, upfrontFeeAmount: params.feeAmount.min }) ?? params.rate.min;
  const aprMax = calculateApr({ principal: params.amount, nominalRateAnnual: params.rate.max, tenureMonths: params.tenureMonths, upfrontFeeAmount: params.feeAmount.max }) ?? params.rate.max;
  return roundRateRange({ min: Math.max(params.rate.min, aprMin), max: Math.max(params.rate.max, aprMax) }, 1);
}

function isUnsecuredOrSmallTicket(product: ProductRoutingResult): boolean {
  return product.recommendedProduct === 'personal_loan' || product.recommendedProduct === 'unsecured_business' || product.recommendedProduct === 'two_wheeler_vehicle';
}

export function estimateRateBand(answers: BorrowerAnswers, product: ProductRoutingResult, confidence: ConfidenceResult): RateAssessment {
  const reasons: Reason[] = [];
  let marketBand = { ...baseRateBands[product.recommendedProduct] };
  let borrowerFairBand = { ...baseRateBands[product.recommendedProduct] };

  if (answers.creditScore.status === 'known') {
    const modifier = scoreModifier(answers.creditScore.value);
    marketBand = addModifier(marketBand, modifier);
    borrowerFairBand = addModifier(borrowerFairBand, modifier);
    reasons.push(reason({
      code: 'CREDIT_SCORE_PRICED',
      severity: answers.creditScore.value >= 760 ? 'positive' : answers.creditScore.value < 680 ? 'warning' : 'neutral',
      title: 'Credit score affects pricing',
      detail: 'A known CIBIL score changes pricing without pretending to reproduce a lender scorecard.',
      inputsUsed: ['creditScore'],
      rulesUsed: ['CIBIL_SCORE_RANGE', 'SCORE_RATE_MODIFIERS'],
      affects: ['rate', 'confidence']
    }));
  } else if (answers.creditScore.status === 'thin_file') {
    marketBand = addModifier(marketBand, thinFileModifier);
    borrowerFairBand = addModifier(borrowerFairBand, borrowerFriendlyThinFileModifier);
    reasons.push(reason({
      code: 'THIN_FILE_WIDENS_RATE',
      severity: 'warning',
      title: 'Thin credit file widens pricing',
      detail: 'No prior formal-loan history is handled as uncertainty, not as poor known credit.',
      inputsUsed: ['creditScore'],
      rulesUsed: ['CIBIL_SCORE_RANGE', 'SCORE_RATE_MODIFIERS', 'MARKET_VS_FAIR_PRICING'],
      affects: ['rate', 'confidence']
    }));
  } else {
    marketBand = addModifier(marketBand, unknownScoreModifier);
    borrowerFairBand = addModifier(borrowerFairBand, borrowerFriendlyUnknownScoreModifier);
    reasons.push(reason({
      code: 'UNKNOWN_SCORE_WIDENS_RATE',
      severity: 'warning',
      title: 'Unknown score widens pricing',
      detail: 'Because the score is unknown, pricing confidence falls and market pricing is shown separately from the borrower-friendly target.',
      inputsUsed: ['creditScore'],
      rulesUsed: ['CIBIL_SCORE_RANGE', 'SCORE_RATE_MODIFIERS', 'MARKET_VS_FAIR_PRICING'],
      affects: ['rate', 'confidence']
    }));
  }

  if (answers.recentMissedPayment === 'yes') {
    marketBand = addModifier(marketBand, recentMissModifier);
    borrowerFairBand = addModifier(borrowerFairBand, borrowerFriendlyRecentMissModifier);
    reasons.push(reason({
      code: 'RECENT_BOUNCE_PRICED',
      severity: 'critical',
      title: 'Recent missed payment raises risk',
      detail: 'A recent bounce can make lender pricing expensive, but an expensive market offer is not automatically borrower-friendly.',
      inputsUsed: ['recentMissedPayment'],
      rulesUsed: ['REPAYMENT_STRESS_MODIFIERS', 'VERDICT_RED_FLAGS', 'MARKET_VS_FAIR_PRICING'],
      affects: ['rate', 'verdict', 'confidence']
    }));
  }

  if (isKnown(answers.highCostDebtOutstanding) && answers.highCostDebtOutstanding.value > 0) {
    marketBand = addModifier(marketBand, highCostDebtModifier);
    borrowerFairBand = addModifier(borrowerFairBand, borrowerFriendlyHighCostDebtModifier);
    reasons.push(reason({
      code: 'HIGH_COST_DEBT_PRICED',
      severity: 'warning',
      title: 'High-cost debt adds caution',
      detail: 'Existing short-term debt can make new quotes costly; the app should not call another high-cost loan fair just because the market may offer one.',
      inputsUsed: ['highCostDebtOutstanding'],
      rulesUsed: ['REPAYMENT_STRESS_MODIFIERS', 'HIGH_COST_QUOTE_ASSESSMENT'],
      affects: ['rate', 'verdict']
    }));
  }

  if (answers.incomeType === 'salaried' && answers.employerStability === 'large_stable') {
    marketBand = addModifier(marketBand, stableSalaryModifier);
    borrowerFairBand = addModifier(borrowerFairBand, stableSalaryModifier);
  }
  if (answers.incomeType === 'self_employed' && answers.bankedIncomeShare === 'cash_heavy') {
    marketBand = addModifier(marketBand, cashHeavyModifier);
    borrowerFairBand = addModifier(borrowerFairBand, { minDelta: 0.4, maxDelta: 0.9, width: 0.2 });
  }

  const marketWidenPoints = confidence.byOutput.pricing === 'low' ? 1.1 : confidence.byOutput.pricing === 'medium' ? 0.45 : 0.15;
  const fairWidenPoints = confidence.byOutput.pricing === 'low' ? 0.5 : confidence.byOutput.pricing === 'medium' ? 0.25 : 0.1;
  marketBand = normalizeRateRange({ min: Math.max(0, marketBand.min - marketWidenPoints), max: marketBand.max + marketWidenPoints });
  borrowerFairBand = normalizeRateRange({ min: Math.max(0, borrowerFairBand.min - fairWidenPoints), max: borrowerFairBand.max + fairWidenPoints });

  const marketPossibleRate = roundRateRange(marketBand, 1);
  const borrowerFairRate = roundRateRange(borrowerFairBand, 1);
  const feePct = feeRules[product.recommendedProduct];
  const feeAmount = roundMoneyRange({
    min: answers.requestedAmount * (feePct.min / 100) * (1 + gstOnFeesPct / 100),
    max: answers.requestedAmount * (feePct.max / 100) * (1 + gstOnFeesPct / 100)
  }, 100);
  const tenureRule = productRules[product.recommendedProduct];
  const tenureMonths = Math.max(12, Math.min(tenureRule.maxTenureMonths, answers.lenderOffer?.tenureMonths ?? tenureRule.recommendedTenureMonths));
  const borrowerFairApr = aprRangeFor({ amount: answers.requestedAmount, rate: borrowerFairRate, feeAmount, tenureMonths });
  const marketPossibleApr = aprRangeFor({ amount: answers.requestedAmount, rate: marketPossibleRate, feeAmount, tenureMonths });
  const avoidCap = isUnsecuredOrSmallTicket(product) ? Math.max(verdictRules.highCostDebtAprThreshold, borrowerFairApr.max + 1) : Number.POSITIVE_INFINITY;
  const avoidAboveApr = roundRate(Math.max(borrowerFairApr.max + 0.5, Math.min(borrowerFairApr.max + avoidAprPremiumByProduct[product.recommendedProduct], avoidCap)), 1);
  const tooWideForSingleFairBand = (marketPossibleApr.max - marketPossibleApr.min) >= highRiskMarketWidthThreshold || confidence.byOutput.pricing === 'low';

  reasons.push(reason({
    code: 'APR_FROM_CASHFLOWS',
    severity: 'neutral',
    title: 'APR includes upfront mandatory charges',
    detail: 'APR is estimated from the net disbursal after processing fee and the monthly EMI cash flows.',
    inputsUsed: ['requestedAmount', 'nominalRateAnnual', 'processingFeePct'],
    rulesUsed: ['RBI_KFS_APR_DISCLOSURE', 'FEE_ASSUMPTION_BANDS'],
    affects: ['rate']
  }));

  if (tooWideForSingleFairBand) {
    reasons.push(reason({
      code: 'WIDE_MARKET_RANGE_NOT_FAIR',
      severity: 'warning',
      title: 'Market range is uncertain',
      detail: 'The likely market range is wide, so the app separates borrower-friendly pricing from expensive offers that may still exist in the market.',
      inputsUsed: ['creditScore', 'recentMissedPayment', 'highCostDebtOutstanding'],
      rulesUsed: ['MARKET_VS_FAIR_PRICING', 'HIGH_COST_QUOTE_ASSESSMENT'],
      affects: ['rate', 'confidence']
    }));
  }

  return {
    nominalRate: borrowerFairRate,
    apr: borrowerFairApr,
    borrowerFairRate,
    borrowerFairApr,
    marketPossibleRate,
    marketPossibleApr,
    avoidAboveApr,
    pricingConfidence: confidence.byOutput.pricing,
    tooWideForSingleFairBand,
    feePct,
    feeAmount,
    reasons
  };
}
