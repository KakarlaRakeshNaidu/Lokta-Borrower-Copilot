import type { BorrowerAnswers, ProductChoice, ProductRoutingResult, Reason } from '../types';
import { isKnown, known, unknown } from '../types';
import { productRules } from '../rules';
import { reason } from './reason';

function intentToProduct(intent: BorrowerAnswers['productIntent']): ProductChoice | null {
  switch (intent) {
    case 'personal': return 'personal_loan';
    case 'business': return 'unsecured_business';
    case 'lap': return 'loan_against_property';
    case 'home': return 'home_loan';
    case 'gold': return 'gold_loan';
    case 'vehicle': return 'two_wheeler_vehicle';
    case 'not_sure': return null;
  }
}

function purposeProduct(answers: BorrowerAnswers): ProductChoice {
  if (answers.loanPurpose === 'home') return 'home_loan';
  if (answers.loanPurpose === 'vehicle_for_income') return 'two_wheeler_vehicle';
  if (answers.loanPurpose === 'business_expansion') return 'unsecured_business';
  return 'personal_loan';
}

export function calculateLtv(answers: BorrowerAnswers, product: ProductChoice) {
  const rule = productRules[product];
  if (!rule.ltvRange || !isKnown(answers.collateral.value) || answers.collateral.value.value <= 0) {
    return { ltv: unknown<number>(), ltvEligibleAmount: unknown<number>() };
  }
  return {
    ltv: known(answers.requestedAmount / answers.collateral.value.value),
    ltvEligibleAmount: known(answers.collateral.value.value * rule.ltvRange.max)
  };
}

export function routeProduct(answers: BorrowerAnswers): ProductRoutingResult {
  const reasons: Reason[] = [];
  let product = intentToProduct(answers.productIntent) ?? purposeProduct(answers);
  const alternatives: ProductChoice[] = [];
  const collateralValue = isKnown(answers.collateral.value) ? answers.collateral.value.value : null;
  const hasUsableProperty = answers.collateral.kind === 'property' && collateralValue !== null && collateralValue > 0 && isKnown(answers.collateral.unencumbered) && answers.collateral.unencumbered.value;
  const requestedLtv = hasUsableProperty && collateralValue !== null ? answers.requestedAmount / collateralValue : null;

  if (answers.loanPurpose === 'business_expansion' && hasUsableProperty && requestedLtv !== null && requestedLtv <= productRules.loan_against_property.ltvRange!.max) {
    if (product !== 'loan_against_property') alternatives.push(product);
    product = 'loan_against_property';
    reasons.push(reason({
      code: 'SECURED_ROUTE_CONSIDERED',
      severity: 'positive',
      title: 'Secured route is worth comparing',
      detail: 'The requested amount is modest relative to unencumbered property value, so a LAP-style route may price better than unsecured business credit while still needing serviceability checks.',
      inputsUsed: ['loanPurpose', 'collateral.value', 'collateral.unencumbered', 'requestedAmount'],
      rulesUsed: ['SBI_LAP_LTV_TENURE_ANCHOR', 'LTV_LIMITS'],
      affects: ['rate', 'lenderAmount', 'safeAmount', 'verdict']
    }));
  } else if (answers.loanPurpose === 'vehicle_for_income') {
    product = 'two_wheeler_vehicle';
    alternatives.push('personal_loan');
    reasons.push(reason({
      code: 'VEHICLE_ROUTE_FOR_PRODUCTIVE_USE',
      severity: 'neutral',
      title: 'Vehicle finance before unsecured debt',
      detail: 'Because the scooter could support income, the app compares a vehicle route instead of assuming high-cost unsecured borrowing is the only choice.',
      inputsUsed: ['loanPurpose', 'productIntent'],
      rulesUsed: ['ICICI_TWO_WHEELER_RATE_ANCHOR', 'PROJECTED_INCOME_NOT_GUARANTEED'],
      affects: ['rate', 'verdict']
    }));
  } else if (answers.loanPurpose === 'wedding') {
    reasons.push(reason({
      code: 'DISCRETIONARY_PERSONAL_ROUTE',
      severity: 'neutral',
      title: 'Wedding is treated as personal borrowing',
      detail: 'The purpose can be valid, but it does not add repayment income, so affordability must stand on current cash flow.',
      inputsUsed: ['loanPurpose'],
      rulesUsed: ['PROJECTED_INCOME_NOT_GUARANTEED'],
      affects: ['safeAmount', 'verdict']
    }));
  }

  const ltv = calculateLtv(answers, product);
  if (isKnown(ltv.ltv)) {
    reasons.push(reason({
      code: 'LTV_COMPUTED',
      severity: ltv.ltv.value <= (productRules[product].ltvRange?.max ?? 1) ? 'positive' : 'warning',
      title: 'Collateral checked with LTV',
      detail: 'Collateral can improve the product route, but it only caps the possible loan and does not replace cash-flow serviceability.',
      inputsUsed: ['requestedAmount', 'collateral.value'],
      rulesUsed: ['LTV_LIMITS'],
      affects: ['lenderAmount', 'rate', 'confidence']
    }));
  }

  return { recommendedProduct: product, alternatives: [...new Set(alternatives)], ...ltv, reasons };
}