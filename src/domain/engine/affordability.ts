import type { BorrowerAnswers, CapacityResult, EmergencyCapacityResult, IncomeAssessment, MoneyRange, ProductRoutingResult, RateRange, Reason } from '../types';
import { isKnown } from '../types';
import { principalFromEmi } from '../calculations/loanMath';
import { floorZero, normalizeRange, roundBorrowerMoneyRange, roundMoney, roundMoneyRange, widenMoneyRange } from '../calculations/range';
import { bufferPctByIncome, dependentBuffer, emergencyBufferPctByIncome, emergencyDebtObligationBlockPct, emergencyDependentBuffer, emergencyFoirByIncome, lenderFoirByIncome, lenderProductFoirCap, minimumEmergencyMonthlyBuffer, minimumMonthlyBuffer, productRules, safeFoirByIncome, soonEndingEmiWindowMonths, unknownExpensePctByIncome, unknownObligationPct, verdictRules } from '../rules';
import { reason } from './reason';

export function fixedObligationsRange(answers: BorrowerAnswers, income: MoneyRange): { range: MoneyRange; reasons: Reason[] } {
  const reasons: Reason[] = [];
  const highCostMonthly = isKnown(answers.highCostDebtMonthlyPayment) ? answers.highCostDebtMonthlyPayment.value : 0;
  if (isKnown(answers.existingMonthlyEmis)) {
    const amount = answers.existingMonthlyEmis.value + highCostMonthly;
    if (amount > 0) {
      reasons.push(reason({
        code: 'EXISTING_EMIS_INCLUDED',
        severity: 'neutral',
        title: 'Existing EMIs are included',
        detail: 'Current loan payments are subtracted before estimating room for a new EMI.',
        inputsUsed: ['existingMonthlyEmis', 'highCostDebtMonthlyPayment'],
        rulesUsed: ['LENDER_FOIR_BY_PROFILE', 'SAFE_FOIR_BY_PROFILE'],
        affects: ['lenderAmount', 'safeAmount', 'emi']
      }));
    }
    if (amount > 0 && isKnown(answers.existingEmiEndsInMonths) && answers.existingEmiEndsInMonths.value > 0 && answers.existingEmiEndsInMonths.value <= soonEndingEmiWindowMonths) {
      reasons.push(reason({
        code: 'EMI_ENDING_SOON_NOT_COUNTED_TODAY',
        severity: 'neutral',
        title: 'An EMI ending soon may improve headroom later',
        detail: `An existing EMI is marked as ending in ${Math.round(answers.existingEmiEndsInMonths.value)} month(s). It is still counted in today's safe capacity, but the borrower may reassess after it closes.`,
        inputsUsed: ['existingMonthlyEmis', 'existingEmiEndsInMonths'],
        rulesUsed: ['EXISTING_EMI_ENDING_SOON'],
        affects: ['safeAmount', 'emi', 'confidence']
      }));
    }
    return { range: { min: amount, max: amount }, reasons };
  }
  reasons.push(reason({
    code: 'UNKNOWN_OBLIGATIONS_WIDENED',
    severity: 'warning',
    title: 'Unknown EMIs widen the result',
    detail: 'Unknown obligations are modeled as a range instead of being treated as zero.',
    inputsUsed: ['existingMonthlyEmis'],
    rulesUsed: ['UNKNOWN_OBLIGATION_WIDENING'],
    affects: ['lenderAmount', 'safeAmount', 'confidence']
  }));
  return { range: { min: highCostMonthly, max: highCostMonthly + income.max * unknownObligationPct }, reasons };
}

export function essentialOutflow(answers: BorrowerAnswers, income: MoneyRange): { amount: number; reasons: Reason[] } {
  const reasons: Reason[] = [];
  let amount = 0;
  const expensesWereEstimated = !isKnown(answers.essentialMonthlyExpenses);
  if (isKnown(answers.essentialMonthlyExpenses)) amount += answers.essentialMonthlyExpenses.value;
  else {
    amount += income.min * unknownExpensePctByIncome[answers.incomeType];
    reasons.push(reason({
      code: 'UNKNOWN_EXPENSE_ESTIMATE',
      severity: 'warning',
      title: 'Expenses are estimated',
      detail: 'Missing essential expenses are not treated as zero. The app uses a conservative estimate and lowers confidence.',
      inputsUsed: ['essentialMonthlyExpenses'],
      rulesUsed: ['UNKNOWN_EXPENSE_TREATMENT', 'SAFE_BUFFER_RULE'],
      affects: ['safeAmount', 'confidence']
    }));
  }
  if (isKnown(answers.rentMonthly)) amount += answers.rentMonthly.value;
  else if (expensesWereEstimated) {
    reasons.push(reason({
      code: 'UNKNOWN_RENT_INCLUDED_IN_EXPENSE_ESTIMATE',
      severity: 'warning',
      title: 'Housing cost is part of the estimate',
      detail: 'Because rent is unknown too, the conservative expense estimate is used for the whole household outflow.',
      inputsUsed: ['rentMonthly'],
      rulesUsed: ['UNKNOWN_EXPENSE_TREATMENT'],
      affects: ['safeAmount', 'confidence']
    }));
  }
  return { amount, reasons };
}

function amountFromEmi(emiRange: MoneyRange, rate: RateRange, product: ProductRoutingResult): MoneyRange {
  const rule = productRules[product.recommendedProduct];
  const minPrincipal = principalFromEmi(emiRange.min, rate.max, rule.recommendedTenureMonths);
  const maxPrincipal = principalFromEmi(emiRange.max, rate.min, rule.maxTenureMonths);
  const ltvCap = isKnown(product.ltvEligibleAmount) ? product.ltvEligibleAmount.value : Number.POSITIVE_INFINITY;
  return roundMoneyRange({ min: Math.min(minPrincipal, ltvCap), max: Math.min(maxPrincipal, ltvCap) }, 10_000);
}

function amountAtRecommendedTenure(emi: number, rate: RateRange, product: ProductRoutingResult, requestedAmount: number): MoneyRange {
  const rule = productRules[product.recommendedProduct];
  const ltvCap = isKnown(product.ltvEligibleAmount) ? product.ltvEligibleAmount.value : Number.POSITIVE_INFINITY;
  const minPrincipal = Math.min(principalFromEmi(emi, rate.max, rule.recommendedTenureMonths), ltvCap, requestedAmount);
  const maxPrincipal = Math.min(principalFromEmi(emi, rate.min, rule.recommendedTenureMonths), ltvCap, requestedAmount);
  return roundBorrowerMoneyRange({ min: minPrincipal, max: maxPrincipal });
}

export function calculateLenderCapacity(answers: BorrowerAnswers, income: IncomeAssessment, product: ProductRoutingResult, rate: RateRange): CapacityResult {
  const obligations = fixedObligationsRange(answers, income.lenderMonthlyIncome);
  const baseFoir = lenderFoirByIncome[answers.incomeType];
  const maxFoir = Math.min(baseFoir.max, lenderProductFoirCap[product.recommendedProduct]);
  const emiRange = normalizeRange({
    min: floorZero(income.lenderMonthlyIncome.min * baseFoir.min - obligations.range.max),
    max: floorZero(income.lenderMonthlyIncome.max * maxFoir - obligations.range.min)
  });
  const amountRange = amountFromEmi(emiRange, rate, product);
  const reasons = [
    ...obligations.reasons,
    reason({
      code: 'LENDER_FOIR_CAPACITY',
      severity: 'neutral',
      title: 'Lender-like EMI room estimated',
      detail: 'A lender may look at fixed obligations as a share of assessed income, then convert the remaining EMI room into a loan amount.',
      inputsUsed: ['lenderMonthlyIncome', 'existingMonthlyEmis', 'recommendedProduct'],
      rulesUsed: ['LENDER_FOIR_BY_PROFILE', 'PRODUCT_TENURE_LIMITS'],
      affects: ['lenderAmount', 'emi']
    })
  ];
  return { emiRange, amountRange, reasons };
}

export function calculateSafeCapacity(answers: BorrowerAnswers, income: IncomeAssessment, product: ProductRoutingResult, rate: RateRange, widenFactor = 1): CapacityResult {
  const obligations = fixedObligationsRange(answers, income.safeMonthlyIncome);
  const essentials = essentialOutflow(answers, income.safeMonthlyIncome);
  const dependents = isKnown(answers.dependents) ? answers.dependents.value : 0;
  const productiveNudge = answers.loanPurpose === 'business_expansion' || answers.loanPurpose === 'vehicle_for_income' ? 0.02 : 0;
  const discretionaryNudge = answers.loanPurpose === 'wedding' || answers.loanPurpose === 'other' ? -0.02 : 0;
  const safeRatio = Math.max(0.12, safeFoirByIncome[answers.incomeType] + productiveNudge + discretionaryNudge);
  const bufferMin = Math.max(minimumMonthlyBuffer, income.safeMonthlyIncome.min * bufferPctByIncome[answers.incomeType]) + dependents * dependentBuffer;
  const bufferMax = Math.max(minimumMonthlyBuffer, income.safeMonthlyIncome.max * bufferPctByIncome[answers.incomeType]) + dependents * dependentBuffer;
  const byRatio = {
    min: floorZero(income.safeMonthlyIncome.min * safeRatio - obligations.range.max),
    max: floorZero(income.safeMonthlyIncome.max * safeRatio - obligations.range.min)
  };
  const byCash = {
    min: floorZero(income.safeMonthlyIncome.min - essentials.amount - obligations.range.max - bufferMax),
    max: floorZero(income.safeMonthlyIncome.max - essentials.amount - obligations.range.min - bufferMin)
  };
  const emiRange = normalizeRange({ min: Math.min(byRatio.min, byCash.min), max: Math.min(byRatio.max, byCash.max) });
  const widened = widenMoneyRange(emiRange, widenFactor);
  const safeEmiRange = normalizeRange({ min: floorZero(widened.min), max: floorZero(widened.max) });
  const amountRange = amountFromEmi(safeEmiRange, rate, product);
  const reasons = [
    ...obligations.reasons,
    ...essentials.reasons,
    reason({
      code: 'SAFE_CASHFLOW_CAPACITY',
      severity: safeEmiRange.max <= 0 ? 'critical' : 'positive',
      title: 'Safe EMI keeps a buffer',
      detail: 'The borrower-safe ceiling is the lower of a conservative obligation ratio and actual surplus after essentials, existing EMIs and a monthly buffer.',
      inputsUsed: ['safeMonthlyIncome', 'essentialMonthlyExpenses', 'rentMonthly', 'existingMonthlyEmis', 'dependents'],
      rulesUsed: ['SAFE_FOIR_BY_PROFILE', 'SAFE_BUFFER_RULE'],
      affects: ['safeAmount', 'emi', 'verdict']
    })
  ];
  return { emiRange: safeEmiRange, amountRange, reasons };
}

export function calculateEmergencyOnlyCapacity(answers: BorrowerAnswers, income: IncomeAssessment, product: ProductRoutingResult, rate: RateRange): EmergencyCapacityResult {
  const obligations = fixedObligationsRange(answers, income.safeMonthlyIncome);
  const essentials = essentialOutflow(answers, income.safeMonthlyIncome);
  const dependents = isKnown(answers.dependents) ? answers.dependents.value : 0;
  const rule = productRules[product.recommendedProduct];
  const reasons: Reason[] = [...obligations.reasons, ...essentials.reasons];
  const lowIncome = income.safeMonthlyIncome.min;
  const obligationsMax = obligations.range.max;
  const debtRatio = lowIncome > 0 ? obligationsMax / lowIncome : 1;
  const currentSurplusBeforeNewEmi = lowIncome - essentials.amount - obligationsMax;
  const stressedIncome = lowIncome * 0.9;
  const emergencyBuffer = Math.max(minimumEmergencyMonthlyBuffer, lowIncome * emergencyBufferPctByIncome[answers.incomeType]) + dependents * emergencyDependentBuffer;
  const severeDebtStacking = answers.incomeType === 'informal'
    && answers.recentMissedPayment === 'yes'
    && isKnown(answers.highCostDebtOutstanding)
    && answers.highCostDebtOutstanding.value >= verdictRules.severeDebtStackingDebtFloor;
  const repaymentStressBlock = answers.recentMissedPayment === 'yes' && (currentSurplusBeforeNewEmi <= emergencyBuffer || debtRatio >= emergencyDebtObligationBlockPct);

  if (lowIncome <= 0 || currentSurplusBeforeNewEmi <= 0 || debtRatio >= emergencyDebtObligationBlockPct || severeDebtStacking || repaymentStressBlock) {
    reasons.push(reason({
      code: 'NO_EMERGENCY_CAPACITY',
      severity: 'critical',
      title: 'No emergency-only borrowing capacity',
      detail: 'Current cash flow does not safely support any additional loan, even as an emergency-only ceiling.',
      inputsUsed: ['safeMonthlyIncome', 'essentialMonthlyExpenses', 'existingMonthlyEmis', 'recentMissedPayment', 'highCostDebtOutstanding'],
      rulesUsed: ['EMERGENCY_ONLY_CAPACITY', 'VERDICT_RED_FLAGS'],
      affects: ['emergencyAmount', 'verdict', 'emi']
    }));
    return { amountRange: null, emiRange: null, reasons };
  }

  const byRatio = floorZero(stressedIncome * emergencyFoirByIncome[answers.incomeType] - obligationsMax);
  const byCash = floorZero(stressedIncome - essentials.amount - obligationsMax - emergencyBuffer);
  const emergencyEmi = roundMoney(Math.min(byRatio, byCash), 100);
  const amountRange = amountAtRecommendedTenure(emergencyEmi, rate, product, answers.requestedAmount);

  if (emergencyEmi <= 0 || amountRange.max < rule.minimumPracticalPrincipal) {
    reasons.push(reason({
      code: 'BELOW_MIN_PRACTICAL_LOAN',
      severity: 'critical',
      title: 'Emergency capacity is below a practical loan size',
      detail: 'The remaining EMI room converts to less than the minimum practical loan size for this product, so the app does not show a misleading tiny loan amount.',
      inputsUsed: ['safeMonthlyIncome', 'requestedAmount', 'recommendedProduct'],
      rulesUsed: ['MINIMUM_PRACTICAL_LOAN_SIZE', 'ROUNDING_PRESENTATION'],
      affects: ['emergencyAmount', 'verdict', 'emi']
    }));
    return { amountRange: null, emiRange: null, reasons };
  }

  const practicalRange = normalizeRange({ min: Math.min(Math.max(amountRange.min, rule.minimumPracticalPrincipal), amountRange.max), max: amountRange.max });
  reasons.push(reason({
    code: 'EMERGENCY_ONLY_CAPACITY',
    severity: 'warning',
    title: 'Emergency-only ceiling is not a recommendation',
    detail: 'This is a strict maximum based on stressed income, existing debt, essential costs and a smaller emergency buffer. It is not a normal borrowing target.',
    inputsUsed: ['safeMonthlyIncome', 'essentialMonthlyExpenses', 'existingMonthlyEmis', 'dependents', 'recommendedProduct'],
    rulesUsed: ['EMERGENCY_ONLY_CAPACITY', 'MINIMUM_PRACTICAL_LOAN_SIZE'],
    affects: ['emergencyAmount', 'emi', 'verdict']
  }));

  return { amountRange: practicalRange, emiRange: { min: emergencyEmi, max: emergencyEmi }, reasons };
}
