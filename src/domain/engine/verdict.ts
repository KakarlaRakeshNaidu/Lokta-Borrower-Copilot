import type { BorrowerAnswers, CapacityResult, ProductRoutingResult, RateAssessment, Reason, StressResult, Verdict } from '../types';
import { isKnown } from '../types';
import { calculateEmi } from '../calculations/loanMath';
import { productRules, verdictRules } from '../rules';
import { reason } from './reason';

function medicalNextAction(): string {
  return 'If this is urgent, compare lower-cost emergency support, insurance, employer help, family support, or a smaller regulated loan before accepting high-cost debt.';
}

export function determineVerdict(params: {
  answers: BorrowerAnswers;
  safe: CapacityResult;
  lender: CapacityResult;
  product: ProductRoutingResult;
  pricing: RateAssessment;
  stress: StressResult;
}): { verdict: Verdict; reasons: Reason[]; nextAction: string; topReason: string } {
  const { answers, safe, product, pricing, stress } = params;
  const reasons: Reason[] = [];
  const rule = productRules[product.recommendedProduct];
  const requestedEmi = calculateEmi(answers.requestedAmount, pricing.borrowerFairRate.max, rule.recommendedTenureMonths);
  const safeEmi = safe.emiRange.max;
  const highCostDebt = isKnown(answers.highCostDebtOutstanding) ? answers.highCostDebtOutstanding.value : 0;
  const severeDebtStacking = answers.incomeType === 'informal'
    && answers.recentMissedPayment === 'yes'
    && highCostDebt >= verdictRules.severeDebtStackingDebtFloor;

  if (severeDebtStacking) {
    const r = reason({
      code: 'DEBT_STACKING_STOP',
      severity: 'critical',
      title: 'Pause new borrowing',
      detail: 'Variable income, active high-cost debt and a recent bounce make another new EMI unsafe until the current debt is restructured or stabilized.',
      inputsUsed: ['incomeType', 'recentMissedPayment', 'highCostDebtOutstanding'],
      rulesUsed: ['VERDICT_RED_FLAGS', 'REPAYMENT_STRESS_MODIFIERS'],
      affects: ['verdict', 'safeAmount', 'emi']
    });
    reasons.push(r);
    return { verdict: 'dont_borrow', reasons, nextAction: 'First reduce high-cost debt, rebuild repayment headroom, then reassess lower-cost vehicle finance or another safer route.', topReason: r.detail };
  }

  if (safeEmi <= 0) {
    const r = reason({
      code: 'NO_SAFE_EMI_CAPACITY',
      severity: 'critical',
      title: 'No safe monthly room',
      detail: 'After essentials, existing obligations and a buffer, there is no safe room for a new EMI right now.',
      inputsUsed: ['safeMonthlyIncome', 'essentialMonthlyExpenses', 'existingMonthlyEmis'],
      rulesUsed: ['SAFE_FOIR_BY_PROFILE', 'SAFE_BUFFER_RULE', 'VERDICT_RED_FLAGS'],
      affects: ['verdict', 'safeAmount', 'emi']
    });
    reasons.push(r);
    return { verdict: 'dont_borrow', reasons, nextAction: answers.loanPurpose === 'medical' ? medicalNextAction() : 'Reduce or postpone the borrowing and rebuild monthly headroom first.', topReason: r.detail };
  }

  if (safe.amountRange.max < rule.minimumPracticalPrincipal) {
    const r = reason({
      code: 'SAFE_AMOUNT_BELOW_MINIMUM_PRACTICAL_LOAN',
      severity: 'critical',
      title: 'Safe amount is below a practical loan size',
      detail: 'The remaining safe EMI converts to less than a practical loan size for this product, so a new loan would be misleading to recommend.',
      inputsUsed: ['safeAmount', 'recommendedProduct'],
      rulesUsed: ['MINIMUM_PRACTICAL_LOAN_SIZE', 'ROUNDING_PRESENTATION'],
      affects: ['verdict', 'safeAmount', 'emi']
    });
    reasons.push(r);
    return { verdict: 'dont_borrow', reasons, nextAction: answers.loanPurpose === 'medical' ? medicalNextAction() : 'Do not take a new loan until the safe monthly headroom is larger.', topReason: r.detail };
  }

  if (stress.status === 'fails' && requestedEmi > safeEmi && safe.amountRange.max < answers.requestedAmount * 0.4) {
    const r = reason({
      code: 'REQUEST_FAILS_STRESS',
      severity: 'critical',
      title: 'Requested structure fails stress',
      detail: 'The requested amount needs an EMI far above the safe ceiling and fails the income-stress check.',
      inputsUsed: ['requestedAmount', 'safeEmi', 'stress'],
      rulesUsed: ['STRESS_INCOME_DROP', 'VERDICT_RED_FLAGS'],
      affects: ['verdict', 'safeAmount', 'emi']
    });
    reasons.push(r);
    return { verdict: 'dont_borrow', reasons, nextAction: answers.loanPurpose === 'medical' ? medicalNextAction() : 'Reassess with a lower amount, lower EMI product, or verified additional income.', topReason: r.detail };
  }

  if (answers.requestedAmount > safe.amountRange.max * verdictRules.borrowLessRequestedBuffer || requestedEmi > safeEmi * verdictRules.borrowLessRequestedBuffer || stress.status === 'fails') {
    const r = reason({
      code: 'BORROW_LESS_THAN_REQUESTED',
      severity: 'warning',
      title: 'Borrow less than requested',
      detail: stress.status === 'fails' ? 'The request needs a lower EMI, lower amount or safer structure because the stress case leaves no surplus.' : 'The loan purpose may be reasonable, but the requested amount is above the borrower-safe carrying amount.',
      inputsUsed: ['requestedAmount', 'safeAmount', 'requestedEmi'],
      rulesUsed: ['SAFE_FOIR_BY_PROFILE', 'PRODUCT_TENURE_LIMITS'],
      affects: ['verdict', 'safeAmount', 'emi']
    });
    reasons.push(r);
    return { verdict: 'borrow_less', reasons, nextAction: 'Negotiate using the borrower-safe amount, not the highest lender sanction.', topReason: r.detail };
  }

  const r = reason({
    code: 'REQUEST_WITHIN_SAFE_LIMIT',
    severity: 'positive',
    title: 'Request fits the safe ceiling',
    detail: 'The requested amount appears supportable within the borrower-safe EMI ceiling and no major red flag overrides it.',
    inputsUsed: ['requestedAmount', 'safeAmount', 'safeEmi'],
    rulesUsed: ['SAFE_FOIR_BY_PROFILE', 'STRESS_INCOME_DROP'],
    affects: ['verdict', 'safeAmount', 'emi']
  });
  reasons.push(r);
  return { verdict: 'borrow', reasons, nextAction: 'Use the safe EMI and APR band to negotiate the offer.', topReason: r.detail };
}

export function verdictLabel(verdict: Verdict): string {
  if (verdict === 'borrow') return 'Borrow';
  if (verdict === 'borrow_less') return 'Borrow less';
  return "Don't borrow";
}
