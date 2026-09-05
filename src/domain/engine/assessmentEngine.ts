import type { AssessmentResult, BorrowerAnswers, BorrowingCapacity, CapacityResult, IncomeAssessment, OfferComparison, ProductRoutingResult, RateAssessment, Reason, TenureOption, Verdict } from '../types';
import { isKnown } from '../types';
import { calculateApr } from '../calculations/apr';
import { calculateEmi, principalFromEmi, totalInterest } from '../calculations/loanMath';
import { borrowerMoneyRoundingUnit, normalizeRange, roundBorrowerMoneyRange, roundMoney } from '../calculations/range';
import { productLabels, productRules } from '../rules';
import { formatMoneyRange, formatMonthly, formatRateRange, formatRupees } from '../../lib/currency';
import { assessIncome } from './income';
import { routeProduct } from './productRouting';
import { calculateConfidence } from './confidence';
import { estimateRateBand } from './pricing';
import { calculateEmergencyOnlyCapacity, calculateLenderCapacity, calculateSafeCapacity } from './affordability';
import { runStressScenario, upsideScenarioNote } from './stress';
import { determineVerdict, verdictLabel } from './verdict';
import { assertAssessmentConsistency } from './consistency';

function recommendedRangeAtTenure(params: {
  answers: BorrowerAnswers;
  lender: CapacityResult;
  safe: CapacityResult;
  product: ProductRoutingResult;
  pricing: RateAssessment;
}): { range: { min: number; max: number }; amount: number } {
  const { answers, lender, safe, product, pricing } = params;
  const rule = productRules[product.recommendedProduct];
  const ltvCap = isKnown(product.ltvEligibleAmount) ? product.ltvEligibleAmount.value : Number.POSITIVE_INFINITY;
  const hardCap = Math.max(0, Math.min(answers.requestedAmount, safe.amountRange.max, lender.amountRange.max || Number.POSITIVE_INFINITY, ltvCap));
  const minPrincipal = Math.min(principalFromEmi(safe.emiRange.max, pricing.borrowerFairRate.max, rule.recommendedTenureMonths), hardCap);
  const maxPrincipal = Math.min(principalFromEmi(safe.emiRange.max, pricing.borrowerFairRate.min, rule.recommendedTenureMonths), hardCap);
  const range = roundBorrowerMoneyRange(normalizeRange({ min: minPrincipal, max: maxPrincipal }));
  const amount = roundMoney(Math.min(hardCap, range.max), borrowerMoneyRoundingUnit(Math.min(hardCap, range.max)));
  return { range, amount };
}

function buildBorrowingCapacity(params: {
  answers: BorrowerAnswers;
  verdict: Verdict;
  lender: CapacityResult;
  safe: CapacityResult;
  product: ProductRoutingResult;
  pricing: RateAssessment;
  income: IncomeAssessment;
}): BorrowingCapacity {
  const { answers, verdict, lender, safe, product, pricing, income } = params;
  const recommended = recommendedRangeAtTenure({ answers, lender, safe, product, pricing });
  const emergency = verdict === 'dont_borrow' ? calculateEmergencyOnlyCapacity(answers, income, product, pricing.borrowerFairRate) : null;
  const recommendedAmount = verdict === 'dont_borrow' ? 0 : verdict === 'borrow' ? Math.min(answers.requestedAmount, recommended.amount) : Math.min(recommended.amount, answers.requestedAmount - borrowerMoneyRoundingUnit(answers.requestedAmount));
  const recommendedAmountRange = verdict === 'dont_borrow'
    ? null
    : verdict === 'borrow'
      ? { min: recommendedAmount, max: recommendedAmount }
      : recommended.range;

  return {
    recommendedAmount,
    recommendedAmountRange,
    safeAmountRange: verdict === 'dont_borrow' ? null : safe.amountRange,
    emergencyOnlyAmountRange: emergency?.amountRange ?? null,
    emergencyOnlyEmiRange: emergency?.emiRange ?? null,
    lenderLikelyAmountRange: lender.amountRange,
    recommendedEmi: verdict === 'dont_borrow' ? 0 : roundMoney(safe.emiRange.max, 100),
    emergencyOnlyEmi: emergency?.emiRange?.max ?? null,
    reasons: emergency?.reasons ?? []
  };
}

function buildTenureOptions(params: {
  answers: BorrowerAnswers;
  product: ProductRoutingResult;
  pricing: RateAssessment;
  safe: CapacityResult;
  verdict: Verdict;
  recommendedAmount: number;
}): TenureOption[] {
  const { product, pricing, safe, verdict, recommendedAmount } = params;
  if (verdict === 'dont_borrow' || safe.emiRange.max <= 0 || recommendedAmount <= 0) return [];
  const rule = productRules[product.recommendedProduct];
  const months = [...new Set([rule.minTenureMonths, rule.recommendedTenureMonths, rule.maxTenureMonths])];
  return months.map((month) => {
    const emi = calculateEmi(recommendedAmount, pricing.borrowerFairRate.max, month);
    return {
      months: month,
      emi: roundMoney(emi, 100),
      totalInterest: roundMoney(totalInterest(recommendedAmount, pricing.borrowerFairRate.max, month), 100),
      breachesSafeCeiling: emi > safe.emiRange.max + 50
    };
  });
}

function calculateOfferApr(answers: BorrowerAnswers): number | null {
  if (!answers.lenderOffer) return null;
  const offer = answers.lenderOffer;
  const feeAmount = answers.requestedAmount * (offer.processingFeePct / 100) * 1.18;
  return calculateApr({
    principal: answers.requestedAmount,
    nominalRateAnnual: offer.nominalRateAnnual,
    tenureMonths: offer.tenureMonths,
    upfrontFeeAmount: feeAmount,
    emi: offer.quotedEmi
  }) ?? offer.nominalRateAnnual;
}

function compareOffer(answers: BorrowerAnswers, pricing: RateAssessment, verdict: Verdict, capacity: BorrowingCapacity, stressStatus: 'passes' | 'tight' | 'fails'): OfferComparison | null {
  if (!answers.lenderOffer) return null;
  const offer = answers.lenderOffer;
  const apr = calculateOfferApr(answers) ?? offer.nominalRateAnnual;

  if (verdict === 'dont_borrow') {
    return {
      apr,
      assessment: 'unsafe_regardless_of_rate',
      label: 'Unsafe regardless of price',
      severity: 'critical',
      message: 'Even if a lender is willing to offer this loan, the bigger issue is that current cash flow does not safely support another EMI.'
    };
  }

  if (verdict === 'borrow_less' && (answers.requestedAmount > capacity.recommendedAmount * 1.05 || stressStatus === 'fails')) {
    const priceAboveAvoid = apr > pricing.avoidAboveApr;
    const priceFarAboveFair = apr > pricing.borrowerFairApr.max + 3;
    const priceIsExtreme = priceAboveAvoid || priceFarAboveFair;
    if (priceIsExtreme) {
      return {
        apr,
        assessment: 'very_expensive',
        label: 'Very expensive',
        severity: 'critical',
        message: stressStatus === 'fails'
          ? 'Both the price and the loan structure are problematic. The APR exceeds the borrower-friendly range and the stress test fails. Negotiate a lower rate, lower amount and shorter tenure.'
          : 'This quote is for more debt than is safe, and the APR exceeds the borrower-friendly range. Negotiate from the reduced amount first, then compare APR and fees.'
      };
    }
    return {
      apr,
      assessment: 'expensive',
      label: 'Not safe as quoted',
      severity: 'warning',
      message: stressStatus === 'fails'
        ? 'The pricing may be within a normal range for this profile, but the loan structure still fails the stress check. Reduce the amount or EMI before comparing price.'
        : 'This quote is for more debt than the borrower-safe recommendation supports. Negotiate from the reduced amount first, then compare APR and fees.'
    };
  }

  const headlineLowButFeesHigh = offer.nominalRateAnnual <= pricing.borrowerFairRate.max + 0.5
    && offer.processingFeePct > pricing.feePct.max + 0.5
    && apr > pricing.borrowerFairApr.max + 0.75;
  const aboveAvoid = apr > pricing.avoidAboveApr;
  const farAboveAvoid = apr > pricing.avoidAboveApr + 5;
  const aboveFairApr = apr > pricing.borrowerFairApr.max + 0.75;
  const aboveFairHeadline = offer.nominalRateAnnual > pricing.borrowerFairRate.max + 0.75;

  if (farAboveAvoid) {
    return {
      apr,
      assessment: 'very_expensive',
      label: 'Very expensive',
      severity: 'critical',
      message: 'This quote is well above the avoid-above APR level. Do not treat it as fair just because high-risk market offers may exist.'
    };
  }

  if (aboveAvoid || aboveFairApr || aboveFairHeadline || headlineLowButFeesHigh) {
    return {
      apr,
      assessment: aboveAvoid ? 'very_expensive' : 'expensive',
      label: aboveAvoid ? 'Very expensive' : 'Expensive',
      severity: aboveAvoid ? 'critical' : 'warning',
      message: headlineLowButFeesHigh
        ? 'The headline rate looks acceptable, but the processing fee pushes the all-in APR above the borrower-friendly range.'
        : 'This quote is above the borrower-friendly pricing range. Ask for the KFS APR and negotiate the rate, fee, amount, or tenure.'
    };
  }

  const comfortablyInside = apr <= pricing.borrowerFairApr.min + (pricing.borrowerFairApr.max - pricing.borrowerFairApr.min) * 0.45
    && offer.processingFeePct <= pricing.feePct.max;
  return {
    apr,
    assessment: comfortablyInside ? 'good' : 'acceptable',
    label: comfortablyInside ? 'Good offer' : 'Reasonable',
    severity: comfortablyInside ? 'positive' : 'neutral',
    message: 'The APR is within the borrower-friendly range, subject to checking the final Key Facts Statement.'
  };
}

function topEvidence(reasons: Reason[]): string[] {
  return reasons
    .filter((item) => item.affects.includes('verdict') || item.affects.includes('safeAmount') || item.affects.includes('emergencyAmount') || item.affects.includes('rate'))
    .slice(0, 5)
    .map((item) => `${item.title}: ${item.detail}`);
}

function buildStressLine(stress: ReturnType<typeof runStressScenario>): string {
  const statusLabel = stress.status === 'passes' ? 'Passes' : stress.status === 'tight' ? 'Tight' : 'Fails';
  return `Stress test: ${statusLabel}. ${stress.reason.detail}`;
}

function buildNegotiationCard(params: {
  answers: BorrowerAnswers;
  lender: CapacityResult;
  safe: CapacityResult;
  capacity: BorrowingCapacity;
  product: ProductRoutingResult;
  pricing: RateAssessment;
  stressLine: string;
  verdict: AssessmentResult['verdict'];
  reasons: Reason[];
  offerComparison: OfferComparison | null;
}): AssessmentResult['negotiationCard'] {
  const { answers, lender, safe, capacity, product, pricing, verdict, reasons, offerComparison } = params;
  const rule = productRules[product.recommendedProduct];
  const warnings = reasons.filter((item) => item.severity === 'warning' || item.severity === 'critical').slice(0, 5).map((item) => item.detail);
  const recommendedPhrase = verdict === 'dont_borrow'
    ? 'Recommended now: Do not take a new loan.'
    : verdict === 'borrow_less'
      ? `You asked for ${formatRupees(answers.requestedAmount)}. Recommended reduced amount: ${formatRupees(capacity.recommendedAmount)}.`
      : `Recommended amount: ${formatRupees(capacity.recommendedAmount)}.`;
  const script = verdict === 'dont_borrow'
    ? 'I should not accept a new loan now. I should first reduce high-cost debt, rebuild repayment headroom, and then reassess a lower-cost route.'
    : verdict === 'borrow_less'
      ? `I should negotiate around ${formatRupees(capacity.recommendedAmount)} and keep EMI at or below ${formatMonthly(capacity.recommendedEmi)}. Please show me the KFS APR, processing fee, tenure and EMI.`
      : `I can compare offers up to ${formatRupees(capacity.recommendedAmount)}, but I should avoid APR above ${pricing.avoidAboveApr.toFixed(1)}% unless there is a clear reason in the KFS.`;

  return {
    borrowerSummary: `${answers.name || 'Borrower'}, age ${answers.age}, ${answers.city || 'India'} - ${productLabels[product.recommendedProduct]}`,
    recommendation: `${verdictLabel(verdict)}. ${recommendedPhrase}`,
    amountToAskFor: capacity.recommendedAmount,
    recommendedAmount: capacity.recommendedAmount,
    recommendedAmountRange: capacity.recommendedAmountRange,
    emergencyOnlyAmountRange: capacity.emergencyOnlyAmountRange,
    emergencyOnlyEmiRange: capacity.emergencyOnlyEmiRange,
    lenderLikelyRange: lender.amountRange,
    safeAmountRange: safe.amountRange,
    fairRate: pricing.borrowerFairRate,
    apr: pricing.borrowerFairApr,
    marketPossibleRate: pricing.marketPossibleRate,
    marketPossibleApr: pricing.marketPossibleApr,
    avoidAboveApr: pricing.avoidAboveApr,
    maxEmi: capacity.recommendedEmi,
    tenureBand: { min: rule.minTenureMonths, max: rule.maxTenureMonths },
    evidenceBullets: topEvidence(reasons),
    warnings,
    stressLine: params.stressLine,
    script,
    offerComparison
  };
}

export function assessBorrower(answers: BorrowerAnswers): AssessmentResult {
  const income = assessIncome(answers);
  const product = routeProduct(answers);
  const confidence = calculateConfidence(answers, product);
  const pricing = estimateRateBand(answers, product, confidence);
  const lender = calculateLenderCapacity(answers, income, product, pricing.marketPossibleRate);
  const safe = calculateSafeCapacity(answers, income, product, pricing.borrowerFairRate, confidence.widenFactor);
  const safeMonthlyEmi = roundMoney(safe.emiRange.max, 100);
  const stress = runStressScenario(answers, income, product, safeMonthlyEmi);
  const verdictParts = determineVerdict({ answers, safe, lender, product, pricing, stress });
  const capacity = buildBorrowingCapacity({ answers, verdict: verdictParts.verdict, lender, safe, product, pricing, income });
  const availabilityReason: Reason[] = safe.amountRange.max > lender.amountRange.max && lender.amountRange.max > 0
    ? [{
      code: 'LENDER_LIMIT_CAN_CAP_AVAILABLE_AMOUNT',
      severity: 'neutral',
      title: 'Lender approval can be lower than safe capacity',
      detail: 'The borrower may be able to carry more than a lender is likely to sanction, so the recommended amount is still capped by likely availability.',
      inputsUsed: ['lenderAmount', 'safeAmount'],
      rulesUsed: ['LENDER_FOIR_BY_PROFILE', 'SAFE_FOIR_BY_PROFILE'],
      affects: ['lenderAmount', 'safeAmount', 'verdict']
    }]
    : [];
  const upside = upsideScenarioNote(answers);
  const upsideReason: Reason[] = upside ? [{
    code: 'UPSIDE_NOT_GUARANTEED',
    severity: 'neutral',
    title: 'Projected income is upside only',
    detail: upside,
    inputsUsed: ['expectedIncrementalIncome'],
    rulesUsed: ['PROJECTED_INCOME_NOT_GUARANTEED'],
    affects: ['verdict', 'confidence']
  }] : [];
  const reasons = [
    ...income.reasons,
    ...product.reasons,
    ...confidence.reasons,
    ...pricing.reasons,
    ...lender.reasons,
    ...safe.reasons,
    stress.reason,
    ...verdictParts.reasons,
    ...capacity.reasons,
    ...availabilityReason,
    ...upsideReason
  ];
  const offerComparison = compareOffer(answers, pricing, verdictParts.verdict, capacity, stress.status);
  const tenureOptions = buildTenureOptions({ answers, product, pricing, safe, verdict: verdictParts.verdict, recommendedAmount: capacity.recommendedAmount });
  const negotiationCard = buildNegotiationCard({ answers, lender, safe, capacity, product, pricing, stressLine: buildStressLine(stress), verdict: verdictParts.verdict, reasons, offerComparison });

  const result: AssessmentResult = {
    answers,
    verdict: verdictParts.verdict,
    verdictLabel: verdictLabel(verdictParts.verdict),
    topReason: verdictParts.topReason,
    lender,
    safe,
    capacity,
    income,
    product,
    pricing,
    tenureOptions,
    recommendedTenureMonths: productRules[product.recommendedProduct].recommendedTenureMonths,
    safeMonthlyEmi,
    stress,
    confidence,
    reasons,
    nextAction: verdictParts.nextAction,
    negotiationCard
  };
  assertAssessmentConsistency(result);
  return result;
}

export function resultSummary(result: AssessmentResult): string {
  const ltv = isKnown(result.product.ltv) ? ` LTV ${Math.round(result.product.ltv.value * 100)}%.` : '';
  return `${result.verdictLabel}: recommended ${formatRupees(result.capacity.recommendedAmount)}, lender-likely ${formatMoneyRange(result.lender.amountRange)}, target APR ${formatRateRange(result.pricing.borrowerFairApr)}.${ltv}`;
}
