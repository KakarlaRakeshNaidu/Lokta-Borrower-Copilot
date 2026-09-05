import type { BorrowerAnswers, IncomeAssessment, ProductRoutingResult, StressResult } from '../types';
import { incomeStressDropByType, productRules } from '../rules';
import { formatRupees } from '../../lib/currency';
import { fixedObligationsRange, essentialOutflow } from './affordability';
import { reason } from './reason';

export function runStressScenario(answers: BorrowerAnswers, income: IncomeAssessment, product: ProductRoutingResult, safeEmi: number): StressResult {
  const drop = incomeStressDropByType[answers.incomeType];
  const baseIncome = income.safeMonthlyIncome.min;
  const stressedIncome = Math.max(0, baseIncome * (1 - drop));
  const obligations = fixedObligationsRange(answers, income.safeMonthlyIncome).range.max;
  const essentials = essentialOutflow(answers, income.safeMonthlyIncome).amount;
  const postEmiSurplus = stressedIncome - obligations - essentials - safeEmi;
  const status = postEmiSurplus < 0 ? 'fails' : postEmiSurplus < Math.max(3_000, stressedIncome * 0.08) ? 'tight' : 'passes';
  const rateNote = product.recommendedProduct === 'home_loan' || product.recommendedProduct === 'loan_against_property'
    ? ' Ask how a floating-rate reset could change EMI or tenure.'
    : '';
  const detail = postEmiSurplus < 0
    ? `Under a ${Math.round(drop * 100)}% income drop, monthly expenses and debt payments would exceed income by about ${formatRupees(Math.abs(postEmiSurplus))}.${rateNote}`
    : `Under a ${Math.round(drop * 100)}% income drop, about ${formatRupees(postEmiSurplus)} remains after essentials, existing debt and the new EMI.${rateNote}`;

  return {
    label: `${Math.round(drop * 100)}% income stress on ${productRules[product.recommendedProduct].label}`,
    stressedIncome,
    postEmiSurplus,
    status,
    reason: reason({
      code: 'INCOME_STRESS_TESTED',
      severity: status === 'fails' ? 'critical' : status === 'tight' ? 'warning' : 'positive',
      title: status === 'passes' ? 'Stress test leaves headroom' : status === 'tight' ? 'Stress test is tight' : 'Stress test fails',
      detail,
      inputsUsed: ['safeMonthlyIncome', 'existingMonthlyEmis', 'essentialMonthlyExpenses', 'safeEmi'],
      rulesUsed: ['STRESS_INCOME_DROP', 'RBI_FLOATING_RATE_HEADROOM'],
      affects: ['emi', 'safeAmount', 'verdict']
    })
  };
}

export function upsideScenarioNote(answers: BorrowerAnswers): string | null {
  if (answers.expectedIncrementalIncome.status !== 'known' || answers.expectedIncrementalIncome.value <= 0) return null;
  return `Projected upside of ₹${Math.round(answers.expectedIncrementalIncome.value).toLocaleString('en-IN')} per month is shown only as upside. It is not counted as guaranteed income.`;
}
