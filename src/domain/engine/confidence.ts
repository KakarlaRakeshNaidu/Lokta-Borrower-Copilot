import type { BorrowerAnswers, Confidence, ConfidenceByOutput, ConfidenceResult, ProductRoutingResult, Reason } from '../types';
import { isKnown } from '../types';
import { confidenceThresholds, confidenceWeights, wideningByConfidence } from '../rules';
import { reason } from './reason';

function scoreToLevel(score: number): Confidence {
  if (score >= confidenceThresholds.high) return 'high';
  if (score >= confidenceThresholds.medium) return 'medium';
  return 'low';
}

function capLevel(level: Confidence, cap: Confidence): Confidence {
  const order: Confidence[] = ['low', 'medium', 'high'];
  return order[Math.min(order.indexOf(level), order.indexOf(cap))]!;
}

function ratio(items: Array<[boolean, number]>): number {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) return 0;
  return items.reduce((sum, [ok, weight]) => sum + (ok ? weight : 0), 0) / total;
}

function hasKnownIncome(answers: BorrowerAnswers): boolean {
  if (answers.incomeType === 'salaried') return isKnown(answers.netMonthlyIncome);
  return isKnown(answers.variableMonthlyIncome);
}

function exactExpenseKnown(answers: BorrowerAnswers): boolean {
  return isKnown(answers.essentialMonthlyExpenses) && isKnown(answers.rentMonthly);
}

function confidenceByOutput(answers: BorrowerAnswers, product: ProductRoutingResult): ConfidenceByOutput {
  const hasCreditScore = answers.creditScore.status === 'known';
  const hasCreditSignal = hasCreditScore || answers.creditScore.status === 'thin_file';
  const hasIncome = hasKnownIncome(answers);
  const hasObligations = isKnown(answers.existingMonthlyEmis);
  const hasExpenses = exactExpenseKnown(answers);
  const hasRepayment = answers.recentMissedPayment !== 'unknown';
  const hasSavings = isKnown(answers.emergencySavingsMonths);
  const hasDependents = isKnown(answers.dependents);
  const hasOffer = answers.lenderOffer !== null;
  const securedRouteNeedsCollateral = product.recommendedProduct === 'loan_against_property' || product.recommendedProduct === 'gold_loan' || product.recommendedProduct === 'home_loan';
  const hasRelevantCollateral = !securedRouteNeedsCollateral || (isKnown(answers.collateral.value) && isKnown(answers.collateral.unencumbered));

  const affordability = scoreToLevel(ratio([
    [hasIncome, 0.28],
    [hasObligations, 0.2],
    [hasExpenses, 0.22],
    [hasRepayment, 0.14],
    [hasSavings, 0.08],
    [hasDependents || answers.incomeType !== 'informal', 0.08]
  ]));

  let lenderSanction = scoreToLevel(ratio([
    [hasIncome, 0.26],
    [hasObligations, 0.18],
    [hasCreditSignal, 0.2],
    [hasRelevantCollateral, 0.18],
    [answers.incomeType !== 'self_employed' || isKnown(answers.itrAnnualIncome), 0.18]
  ]));
  if (!hasCreditScore) lenderSanction = capLevel(lenderSanction, 'medium');

  let pricing = scoreToLevel(ratio([
    [hasCreditScore, 0.38],
    [hasOffer, 0.18],
    [hasRepayment, 0.16],
    [hasIncome, 0.12],
    [answers.recentMissedPayment !== 'yes', 0.08],
    [!(isKnown(answers.highCostDebtOutstanding) && answers.highCostDebtOutstanding.value > 0), 0.08]
  ]));
  if (!hasCreditScore) pricing = capLevel(pricing, answers.recentMissedPayment === 'yes' ? 'low' : 'medium');
  if (answers.recentMissedPayment === 'yes' && isKnown(answers.highCostDebtOutstanding) && answers.highCostDebtOutstanding.value > 0) pricing = 'low';

  const productRouting = scoreToLevel(ratio([
    [answers.productIntent !== 'not_sure' || answers.loanPurpose !== 'other', 0.28],
    [hasRelevantCollateral, 0.32],
    [product.recommendedProduct !== 'loan_against_property' || product.ltv.status === 'known', 0.2],
    [product.recommendedProduct !== 'two_wheeler_vehicle' || answers.loanPurpose === 'vehicle_for_income' || answers.productIntent === 'vehicle', 0.2]
  ]));

  return { affordability, lenderSanction, pricing, productRouting };
}

export function calculateConfidence(answers: BorrowerAnswers, product: ProductRoutingResult): ConfidenceResult {
  const loweredBy: string[] = [];
  const tightenQuestions: string[] = [];
  let total = 0;
  let earned = 0;

  const add = (weight: number, ok: boolean, missingLabel: string, tightenQuestion: string) => {
    total += weight;
    if (ok) earned += weight;
    else {
      loweredBy.push(missingLabel);
      tightenQuestions.push(tightenQuestion);
    }
  };

  add(confidenceWeights.creditScore, answers.creditScore.status === 'known', 'credit score is unknown or thin-file', 'Add a recent CIBIL score if you know it.');
  add(confidenceWeights.obligations, isKnown(answers.existingMonthlyEmis), 'existing EMI obligations are not exact', 'Confirm total monthly EMIs, including app loans.');
  add(confidenceWeights.expenses, exactExpenseKnown(answers), 'household expenses are partly unknown', 'Add rent and essential monthly expenses.');
  add(confidenceWeights.repaymentBehavior, answers.recentMissedPayment !== 'unknown', 'recent repayment behaviour is unknown', 'Say whether any EMI bounced recently.');
  add(confidenceWeights.savings, isKnown(answers.emergencySavingsMonths), 'emergency savings are unknown', 'Add emergency savings in months.');

  if (answers.incomeType === 'salaried') {
    add(confidenceWeights.income, isKnown(answers.netMonthlyIncome), 'salary income is missing', 'Add net monthly income.');
    add(confidenceWeights.employmentOrBusiness, isKnown(answers.employmentYears) && answers.employerStability !== 'unknown', 'job stability details are incomplete', 'Add employment tenure and employer stability.');
  } else if (answers.incomeType === 'self_employed') {
    add(confidenceWeights.income, isKnown(answers.variableMonthlyIncome) && isKnown(answers.itrAnnualIncome), 'business cash income and ITR are not both known', 'Add recent monthly income range and ITR income.');
    add(confidenceWeights.employmentOrBusiness, isKnown(answers.yearsInBusiness) && answers.bankedIncomeShare !== 'unknown', 'business vintage/banked income detail is incomplete', 'Add years in business and banked-income share.');
  } else {
    add(confidenceWeights.income, isKnown(answers.variableMonthlyIncome), 'variable income range is missing', 'Add recent low and high monthly income.');
    add(confidenceWeights.employmentOrBusiness, isKnown(answers.dependents), 'household-dependency detail is incomplete', 'Add number of dependents.');
  }

  if (product.recommendedProduct === 'loan_against_property' || product.recommendedProduct === 'gold_loan' || product.recommendedProduct === 'home_loan') {
    add(confidenceWeights.collateralWhenRelevant, isKnown(answers.collateral.value) && isKnown(answers.collateral.unencumbered), 'collateral/value information is incomplete', 'Add collateral value and encumbrance if using a secured route.');
  } else if (product.recommendedProduct === 'two_wheeler_vehicle') {
    add(confidenceWeights.collateralWhenRelevant, true, 'vehicle value is not needed for this early route check', 'No extra collateral answer needed for the route check.');
  }

  add(confidenceWeights.feeOrOffer, answers.lenderOffer !== null, 'exact lender fee/offer is not entered', 'Enter a lender quote to compare APR precisely.');

  const score = total === 0 ? 0 : earned / total;
  let level: Confidence = scoreToLevel(score);
  if (answers.creditScore.status !== 'known') level = capLevel(level, 'medium');
  if (answers.recentMissedPayment === 'yes') level = capLevel(level, 'medium');
  if (level === 'high' && loweredBy.some(item => item.includes('unknown') || item.includes('missing') || item.includes('incomplete'))) level = capLevel(level, 'medium');

  const reasons: Reason[] = [reason({
    code: 'CONFIDENCE_CALCULATED',
    severity: level === 'high' ? 'positive' : level === 'medium' ? 'neutral' : 'warning',
    title: `${level[0]!.toUpperCase()}${level.slice(1)} confidence`,
    detail: loweredBy.length === 0 ? 'Key inputs are present, so the estimate can stay relatively tight.' : `The estimate is wider because ${loweredBy.slice(0, 3).join(', ')}.`,
    inputsUsed: ['creditScore', 'income', 'obligations', 'expenses', 'repaymentBehavior', 'offer'],
    rulesUsed: ['CONFIDENCE_MODEL', 'OUTPUT_SPECIFIC_CONFIDENCE'],
    affects: ['confidence', 'lenderAmount', 'safeAmount', 'rate']
  })];

  return { level, score, widenFactor: wideningByConfidence[level], loweredBy, tightenQuestions: [...new Set(tightenQuestions)].slice(0, 2), byOutput: confidenceByOutput(answers, product), reasons };
}
