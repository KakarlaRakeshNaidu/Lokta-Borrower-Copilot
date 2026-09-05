import type { BorrowerAnswers, IncomeAssessment, Reason } from '../types';
import { isKnown, known, unknown } from '../types';
import { informalRules, salariedIncomeMultipliers, selfEmployedRules } from '../rules';
import { floorZero, normalizeRange } from '../calculations/range';
import { reason } from './reason';

function coApplicantContribution(answers: BorrowerAnswers): { amount: number; reason: Reason | null } {
  if (answers.coApplicantAvailable && isKnown(answers.coApplicantMonthlyIncome)) {
    return {
      amount: answers.coApplicantMonthlyIncome.value * 0.5,
      reason: reason({
        code: 'COAPPLICANT_COUNTED',
        severity: 'neutral',
        title: 'Co-applicant support counted partly',
        detail: 'Half of the available co-applicant income is counted because repayment support was explicitly marked as available.',
        inputsUsed: ['coApplicantMonthlyIncome', 'coApplicantAvailable'],
        rulesUsed: ['COAPPLICANT_COUNTING_RULE'],
        affects: ['lenderAmount', 'safeAmount', 'confidence']
      })
    };
  }
  return { amount: 0, reason: null };
}

export function assessIncome(answers: BorrowerAnswers): IncomeAssessment {
  const reasons: Reason[] = [];
  const coApplicant = coApplicantContribution(answers);
  if (coApplicant.reason) reasons.push(coApplicant.reason);

  if (answers.incomeType === 'salaried') {
    if (!isKnown(answers.netMonthlyIncome)) {
      reasons.push(reason({
        code: 'SALARY_UNKNOWN',
        severity: 'warning',
        title: 'Income is missing',
        detail: 'Without monthly income, the app keeps capacity at zero and asks for the missing answer instead of inventing a number.',
        inputsUsed: ['netMonthlyIncome'],
        rulesUsed: ['SALARIED_INCOME_HAIRCUT', 'CONFIDENCE_MODEL'],
        affects: ['safeAmount', 'lenderAmount', 'confidence']
      }));
      return { lenderMonthlyIncome: { min: 0, max: 0 }, safeMonthlyIncome: { min: 0, max: 0 }, documentedMonthlyIncome: unknown(), reasons };
    }

    const base = answers.netMonthlyIncome.value;
    const multipliers = salariedIncomeMultipliers[answers.employerStability];
    const lenderMonthlyIncome = normalizeRange({
      min: base * multipliers.lenderMin + coApplicant.amount,
      max: base * multipliers.lenderMax + coApplicant.amount
    });
    const safeMonthlyIncome = normalizeRange({
      min: base * multipliers.safeMin + coApplicant.amount,
      max: base * multipliers.safeMax + coApplicant.amount
    });
    reasons.push(reason({
      code: 'SALARIED_ASSESSED',
      severity: answers.employerStability === 'new_or_probation' ? 'warning' : 'positive',
      title: 'Salary assessed conservatively',
      detail: 'Stable salary receives a small haircut for safety; the lender-like view can still use nearly all recurring net income.',
      inputsUsed: ['netMonthlyIncome', 'employerStability', 'employmentYears'],
      rulesUsed: ['SALARIED_INCOME_HAIRCUT'],
      affects: ['lenderAmount', 'safeAmount', 'confidence']
    }));
    return { lenderMonthlyIncome, safeMonthlyIncome, documentedMonthlyIncome: known(base), reasons };
  }

  if (answers.incomeType === 'self_employed') {
    const cash = isKnown(answers.variableMonthlyIncome) ? normalizeRange(answers.variableMonthlyIncome.value) : { min: 0, max: 0 };
    const documented = isKnown(answers.itrAnnualIncome) ? known(answers.itrAnnualIncome.value / 12) : unknown<number>();
    const yearsBoost = isKnown(answers.yearsInBusiness) && answers.yearsInBusiness.value >= 5 ? selfEmployedRules.establishedBusinessBoost : 0;
    const cashPenalty = answers.bankedIncomeShare === 'cash_heavy' ? selfEmployedRules.cashHeavyPenalty : 0;
    const docMonthly = isKnown(documented) ? documented.value : 0;

    const lenderMin = Math.max(docMonthly * selfEmployedRules.documentedIncomeWeight, cash.min * (selfEmployedRules.reportedCashLenderMin - cashPenalty));
    const lenderMax = Math.max(docMonthly * 1.1, cash.max * (selfEmployedRules.reportedCashLenderMax + yearsBoost - cashPenalty));
    const safeMin = cash.min * Math.max(0.5, selfEmployedRules.reportedCashSafeMin + yearsBoost - cashPenalty);
    const safeMax = ((cash.min + cash.max) / 2) * Math.max(0.55, selfEmployedRules.reportedCashSafeMax + yearsBoost - cashPenalty);

    reasons.push(reason({
      code: 'SELF_EMPLOYED_ASSESSED',
      severity: isKnown(documented) ? 'neutral' : 'warning',
      title: 'Business income separated from documents',
      detail: 'Reported cash flow and ITR income are not treated as identical evidence; documentation supports lender comfort while the safe view keeps volatility haircuts.',
      inputsUsed: ['variableMonthlyIncome', 'itrAnnualIncome', 'yearsInBusiness', 'bankedIncomeShare'],
      rulesUsed: ['SELF_EMPLOYED_INCOME_HAIRCUT'],
      affects: ['lenderAmount', 'safeAmount', 'confidence']
    }));

    return {
      lenderMonthlyIncome: normalizeRange({ min: floorZero(lenderMin + coApplicant.amount), max: floorZero(lenderMax + coApplicant.amount) }),
      safeMonthlyIncome: normalizeRange({ min: floorZero(safeMin + coApplicant.amount), max: floorZero(safeMax + coApplicant.amount) }),
      documentedMonthlyIncome: documented,
      reasons
    };
  }

  const informalCash = isKnown(answers.variableMonthlyIncome) ? normalizeRange(answers.variableMonthlyIncome.value) : { min: 0, max: 0 };
  reasons.push(reason({
    code: 'INFORMAL_ASSESSED',
    severity: 'warning',
    title: 'Variable income uses the lower end',
    detail: 'The safe view leans on the recent low-income month instead of assuming the best month repeats.',
    inputsUsed: ['variableMonthlyIncome'],
    rulesUsed: ['INFORMAL_INCOME_HAIRCUT'],
    affects: ['lenderAmount', 'safeAmount', 'confidence']
  }));

  return {
    lenderMonthlyIncome: normalizeRange({
      min: informalCash.min * informalRules.lenderLowMultiplier + coApplicant.amount,
      max: informalCash.max * informalRules.lenderHighMultiplier + coApplicant.amount
    }),
    safeMonthlyIncome: normalizeRange({
      min: informalCash.min * informalRules.safeLowMultiplier + coApplicant.amount,
      max: informalCash.min * informalRules.safeHighMultiplier + coApplicant.amount
    }),
    documentedMonthlyIncome: isKnown(answers.itrAnnualIncome) ? known(answers.itrAnnualIncome.value / 12) : unknown(),
    reasons
  };
}