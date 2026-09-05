import { describe, expect, it } from 'vitest';
import { assessBorrower } from './assessmentEngine';
import { validateAssessmentConsistency } from './consistency';
import {
  anita, priya, ravi, richSalaried, sparseSalaried, blankAnswers,
  highSalaryHighExpenses, lowIncomeNilDebt, unknownExpenses,
  greatScoreUnstableJob, poorScoreStrongCashflow, emiEndingSoon,
  medicalEmergency, productiveUncertainIncome, strongBorrowerTooMuch,
  strongBorrowerModest, severeDebtStress, highCollateralLowIncome
} from '../fixtures/personas';
import type { BorrowerAnswers } from '../types';
import { known, unknown, notApplicable } from '../types';
import { calculateLtv } from './productRouting';

// ============================
// Persona regression tests
// ============================
describe('assessment engine personas', () => {
  it('keeps Priya high or medium confidence and does not reject wedding purpose automatically', () => {
    const result = assessBorrower(priya);
    expect(result.confidence.level).not.toBe('low');
    expect(result.verdict).not.toBe('dont_borrow');
    expect(result.reasons.some((item) => item.code === 'EXISTING_EMIS_INCLUDED')).toBe(true);
    expect(result.safe.amountRange.max).toBeGreaterThan(0);
    expect(result.lender.amountRange.max).toBeGreaterThan(result.safe.amountRange.max);
    expect(result.negotiationCard.offerComparison?.severity).toBe('warning');
  });

  it('routes Ravi toward secured borrowing and keeps score as thin-file uncertainty', () => {
    const result = assessBorrower(ravi);
    expect(ravi.creditScore.status).toBe('thin_file');
    expect(result.product.recommendedProduct).toBe('loan_against_property');
    expect(result.product.reasons.some((item) => item.code === 'SECURED_ROUTE_CONSIDERED')).toBe(true);
    expect(result.product.ltv.status).toBe('known');
    expect(result.verdict).toBe('borrow_less');
    expect(result.lender.amountRange.max).toBeGreaterThan(result.safe.amountRange.max);
    expect(result.confidence.loweredBy.some((item) => item.includes('credit score'))).toBe(true);
  });

  it('protects Anita from high-cost debt stacking while acknowledging productive upside', () => {
    const result = assessBorrower(anita);
    expect(result.verdict).toBe('dont_borrow');
    expect(result.product.recommendedProduct).toBe('two_wheeler_vehicle');
    expect(result.reasons.some((item) => item.code === 'DEBT_STACKING_STOP')).toBe(true);
    expect(result.reasons.some((item) => item.code === 'UPSIDE_NOT_GUARANTEED')).toBe(true);
    expect(result.stress.status).toBe('fails');
  });
});

// ============================
// Anita-specific regression tests (#40)
// ============================
describe('Anita regression tests', () => {
  const result = assessBorrower(anita);

  it('1. receives DONT_BORROW', () => {
    expect(result.verdict).toBe('dont_borrow');
  });

  it('2. recommended new borrowing is 0', () => {
    expect(result.capacity.recommendedAmount).toBe(0);
  });

  it('3. negotiation card explains what 0 means', () => {
    expect(result.negotiationCard.recommendation).toContain('Do not take a new loan');
  });

  it('4. lender-likely range may still exist', () => {
    expect(result.lender.amountRange.max).toBeGreaterThan(0);
  });

  it('5. lender-likely is never called safe or recommended', () => {
    expect(result.negotiationCard.recommendation).not.toContain('lender');
    expect(result.negotiationCard.script).toContain('should not accept');
  });

  it('6-7. emergency ceiling is null for Anita (severe debt stacking)', () => {
    expect(result.capacity.emergencyOnlyAmountRange).toBeNull();
  });

  it('8. 41.8% APR must NOT be described as positive or acceptable', () => {
    expect(result.negotiationCard.offerComparison?.assessment).toBe('unsafe_regardless_of_rate');
    expect(result.negotiationCard.offerComparison?.label).toBe('Unsafe regardless of price');
    expect(result.negotiationCard.offerComparison?.assessment).not.toBe('good');
    expect(result.negotiationCard.offerComparison?.assessment).not.toBe('acceptable');
  });

  it('9. quote verdict reflects borrower safety', () => {
    expect(result.negotiationCard.offerComparison?.severity).toBe('critical');
    expect(result.negotiationCard.offerComparison?.message).toContain('cash flow');
  });

  it('10. confidence explanation does not contradict confidence label', () => {
    if (result.confidence.level === 'high') {
      expect(result.confidence.loweredBy.some(item => item.includes('unknown'))).toBe(false);
    }
  });

  it('11. stress case influences the recommendation', () => {
    expect(result.stress.status).toBe('fails');
    expect(result.stress.reason.severity).toBe('critical');
  });

  it('12. tenure is not shown as active recommendation when EMI is zero', () => {
    expect(result.tenureOptions.length).toBe(0);
  });
});

// ============================
// Priya regression tests (#41)
// ============================
describe('Priya regression tests', () => {
  const result = assessBorrower(priya);

  it('stable salaried income produces high affordability confidence', () => {
    expect(result.confidence.byOutput.affordability).toBe('high');
  });

  it('known good score produces high pricing confidence', () => {
    expect(result.confidence.byOutput.pricing).toBe('high');
  });

  it('pricing range is narrower than unknown-score borrower', () => {
    const sparse = assessBorrower(sparseSalaried);
    const priyaWidth = result.pricing.borrowerFairRate.max - result.pricing.borrowerFairRate.min;
    const sparseWidth = sparse.pricing.borrowerFairRate.max - sparse.pricing.borrowerFairRate.min;
    expect(priyaWidth).toBeLessThan(sparseWidth);
  });

  it('lender sanction may exceed borrower-safe recommendation', () => {
    expect(result.lender.amountRange.max).toBeGreaterThan(result.capacity.recommendedAmount);
  });

  it('BORROW or BORROW_LESS is explainable', () => {
    expect(['borrow', 'borrow_less']).toContain(result.verdict);
    expect(result.topReason.length).toBeGreaterThan(10);
  });

  it('quote comparison is consistent with verdict', () => {
    expect(result.negotiationCard.offerComparison).not.toBeNull();
    const problems = validateAssessmentConsistency(result);
    expect(problems).toEqual([]);
  });
});

// ============================
// Ravi regression tests (#42)
// ============================
describe('Ravi regression tests', () => {
  const result = assessBorrower(ravi);

  it('thin-file is not treated as poor credit', () => {
    expect(ravi.creditScore.status).toBe('thin_file');
    const poorScoreResult = assessBorrower({ ...ravi, creditScore: { status: 'known', value: 580 } });
    expect(result.pricing.borrowerFairRate.max).toBeLessThan(poorScoreResult.pricing.borrowerFairRate.max);
  });

  it('secured product route is considered with property collateral', () => {
    expect(result.product.recommendedProduct).toBe('loan_against_property');
    expect(result.product.reasons.some(r => r.code === 'SECURED_ROUTE_CONSIDERED')).toBe(true);
  });

  it('collateral does not automatically mean borrow maximum', () => {
    expect(result.capacity.recommendedAmount).toBeLessThan(result.lender.amountRange.max);
  });

  it('spouse income treatment follows explicit rules', () => {
    const withoutCo = assessBorrower({ ...ravi, coApplicantAvailable: false, coApplicantMonthlyIncome: notApplicable() });
    expect(result.income.safeMonthlyIncome.max).toBeGreaterThanOrEqual(withoutCo.income.safeMonthlyIncome.max);
  });
});

// ============================
// Edge-case fixtures (#43)
// ============================
describe('edge-case fixture A: high salary + huge expenses', () => {
  it('high income alone does not produce unsafe recommendation', () => {
    const result = assessBorrower(highSalaryHighExpenses);
    // ₹250K income but ₹95K EMI + ₹55K expenses + ₹60K rent = ₹210K outflow
    // Should at most borrow_less or dont_borrow
    expect(result.capacity.recommendedAmount).toBeLessThan(highSalaryHighExpenses.requestedAmount);
  });
});

describe('edge-case fixture B: low income, no debt', () => {
  it('does not automatically reject low-income borrowers with no debt', () => {
    const result = assessBorrower(lowIncomeNilDebt);
    expect(result.verdict).not.toBe('dont_borrow');
    expect(result.safe.amountRange.max).toBeGreaterThan(0);
  });
});

describe('edge-case fixture C: unknown expenses', () => {
  it('unknown expenses are NOT treated as zero', () => {
    const result = assessBorrower(unknownExpenses);
    // Unknown expenses should cause conservative estimate -> less capacity
    expect(result.reasons.some(r => r.code === 'UNKNOWN_EXPENSE_ESTIMATE')).toBe(true);
    expect(result.confidence.level).not.toBe('high');
  });
});

describe('edge-case fixture D: great score, unstable job', () => {
  it('score alone does not make the recommendation aggressive', () => {
    const result = assessBorrower(greatScoreUnstableJob);
    // 820 score + new_or_probation job should be cautious
    expect(result.income.safeMonthlyIncome.max).toBeLessThan(45_000 * 0.95);
  });
});

describe('edge-case fixture E: poor score, strong cash flow', () => {
  it('can still borrow despite poor score because cashflow is strong', () => {
    const result = assessBorrower(poorScoreStrongCashflow);
    expect(result.verdict).not.toBe('dont_borrow');
    expect(result.pricing.borrowerFairRate.max).toBeGreaterThan(result.pricing.borrowerFairRate.min + 2);
  });
});

describe('edge-case fixture F: EMI ending soon', () => {
  it('notes EMI ending soon but does not count freed EMI in today capacity', () => {
    const result = assessBorrower(emiEndingSoon);
    expect(result.reasons.some(r => r.code === 'EMI_ENDING_SOON_NOT_COUNTED_TODAY')).toBe(true);
  });
});

describe('edge-case fixture G: medical emergency', () => {
  it('provides clear emergency framing for medical purpose', () => {
    const result = assessBorrower(medicalEmergency);
    // Should not casually reject; if dont_borrow, nextAction should mention medical-specific alternatives
    if (result.verdict === 'dont_borrow') {
      expect(result.nextAction.toLowerCase()).toContain('emergency');
    }
  });
});

describe('edge-case fixture H: productive business, uncertain projected income', () => {
  it('does not count future income in base affordability', () => {
    const result = assessBorrower(productiveUncertainIncome);
    expect(result.reasons.some(r => r.code === 'UPSIDE_NOT_GUARANTEED')).toBe(true);
  });
});

describe('edge-case fixture I: strong borrower asking too much', () => {
  it('returns BORROW_LESS', () => {
    const result = assessBorrower(strongBorrowerTooMuch);
    expect(result.verdict).toBe('borrow_less');
    expect(result.capacity.recommendedAmount).toBeLessThan(strongBorrowerTooMuch.requestedAmount);
  });
});

describe('edge-case fixture J: strong borrower, modest amount', () => {
  it('returns BORROW', () => {
    const result = assessBorrower(strongBorrowerModest);
    expect(result.verdict).toBe('borrow');
    expect(result.capacity.recommendedAmount).toBeGreaterThan(0);
    expect(result.capacity.recommendedAmount).toBeLessThanOrEqual(strongBorrowerModest.requestedAmount);
  });
});

describe('edge-case fixture K: severe debt stress', () => {
  it('returns DONT_BORROW', () => {
    const result = assessBorrower(severeDebtStress);
    expect(result.verdict).toBe('dont_borrow');
    expect(result.capacity.recommendedAmount).toBe(0);
  });
});

describe('edge-case fixture L: high collateral, low documented income', () => {
  it('does not grant unrealistic secured-loan capacity from property value alone', () => {
    const result = assessBorrower(highCollateralLowIncome);
    // Safe capacity should be bounded by income, not just LTV
    expect(result.safe.amountRange.max).toBeLessThan(8_000_000 * 0.65); // less than full LTV
    expect(result.capacity.recommendedAmount).toBeLessThan(highCollateralLowIncome.requestedAmount);
  });
});

// ============================
// General invariants (#37)
// ============================
describe('general invariants', () => {
  it('unknown credit score widens confidence without becoming numeric bad credit', () => {
    const sparse = assessBorrower(sparseSalaried);
    const rich = assessBorrower(richSalaried);
    expect(sparse.answers.creditScore.status).toBe('unknown');
    expect(sparse.confidence.level).toBe('low');
    expect(rich.confidence.score).toBeGreaterThan(sparse.confidence.score);
    expect(rich.pricing.nominalRate.max - rich.pricing.nominalRate.min).toBeLessThan(sparse.pricing.nominalRate.max - sparse.pricing.nominalRate.min);
  });

  it('floors negative EMI capacity at zero and keeps displayed ranges finite', () => {
    const result = assessBorrower(anita);
    expect(result.safe.emiRange.min).toBeGreaterThanOrEqual(0);
    expect(result.safe.emiRange.max).toBeGreaterThanOrEqual(0);
    for (const range of [result.safe.amountRange, result.lender.amountRange]) {
      expect(Number.isFinite(range.min)).toBe(true);
      expect(Number.isFinite(range.max)).toBe(true);
    }
  });

  it('does not let safe amount exceed the implied safe EMI capacity', () => {
    const result = assessBorrower(richSalaried);
    expect(result.negotiationCard.amountToAskFor).toBeLessThanOrEqual(Math.min(richSalaried.requestedAmount, result.safe.amountRange.max));
  });

  it('computes LTV when collateral is known', () => {
    const ltv = calculateLtv(ravi, 'loan_against_property');
    expect(ltv.ltv.status).toBe('known');
    if (ltv.ltv.status === 'known') expect(Math.round(ltv.ltv.value * 100)).toBe(33);
  });

  it('recommendedAmount >= 0 for all personas', () => {
    const personas = [priya, ravi, anita, richSalaried, sparseSalaried, highSalaryHighExpenses, lowIncomeNilDebt, unknownExpenses, greatScoreUnstableJob, poorScoreStrongCashflow, emiEndingSoon, medicalEmergency, productiveUncertainIncome, strongBorrowerTooMuch, strongBorrowerModest, severeDebtStress, highCollateralLowIncome];
    for (const p of personas) {
      const r = assessBorrower(p);
      expect(r.capacity.recommendedAmount).toBeGreaterThanOrEqual(0);
    }
  });

  it('DONT_BORROW => recommendedAmount == 0', () => {
    const personas = [anita, severeDebtStress];
    for (const p of personas) {
      const r = assessBorrower(p);
      if (r.verdict === 'dont_borrow') {
        expect(r.capacity.recommendedAmount).toBe(0);
      }
    }
  });

  it('BORROW => safeMaximum > 0', () => {
    const result = assessBorrower(strongBorrowerModest);
    expect(result.verdict).toBe('borrow');
    expect(result.safe.amountRange.max).toBeGreaterThan(0);
  });

  it('safeMax >= safeMin for all personas', () => {
    const personas = [priya, ravi, anita, richSalaried, sparseSalaried, highSalaryHighExpenses, lowIncomeNilDebt, strongBorrowerTooMuch, strongBorrowerModest, severeDebtStress, highCollateralLowIncome];
    for (const p of personas) {
      const r = assessBorrower(p);
      expect(r.safe.amountRange.max).toBeGreaterThanOrEqual(r.safe.amountRange.min);
      expect(r.lender.amountRange.max).toBeGreaterThanOrEqual(r.lender.amountRange.min);
    }
  });

  it('increasing existing EMI should not increase safe borrowing capacity', () => {
    const base = assessBorrower(richSalaried);
    const more = assessBorrower({ ...richSalaried, existingMonthlyEmis: known(20_000) });
    expect(more.safe.emiRange.max).toBeLessThanOrEqual(base.safe.emiRange.max);
  });

  it('decreasing income should not increase safe borrowing capacity', () => {
    const base = assessBorrower(richSalaried);
    const less = assessBorrower({ ...richSalaried, netMonthlyIncome: known(35_000) });
    expect(less.safe.emiRange.max).toBeLessThanOrEqual(base.safe.emiRange.max);
  });

  it('increasing household expenses should not increase safe borrowing capacity', () => {
    const base = assessBorrower(richSalaried);
    const more = assessBorrower({ ...richSalaried, essentialMonthlyExpenses: known(40_000) });
    expect(more.safe.emiRange.max).toBeLessThanOrEqual(base.safe.emiRange.max);
  });

  it('adding recent delinquency should not improve pricing', () => {
    const base = assessBorrower(richSalaried);
    const bounced = assessBorrower({ ...richSalaried, recentMissedPayment: 'yes' as const });
    expect(bounced.pricing.borrowerFairRate.max).toBeGreaterThanOrEqual(base.pricing.borrowerFairRate.max);
  });
});

// ============================
// Consistency validation (#36)
// ============================
describe('consistency validation catches contradictions', () => {
  it('passes for all personas', () => {
    const personas = [priya, ravi, anita, richSalaried, sparseSalaried, highSalaryHighExpenses, lowIncomeNilDebt, unknownExpenses, greatScoreUnstableJob, poorScoreStrongCashflow, emiEndingSoon, medicalEmergency, productiveUncertainIncome, strongBorrowerTooMuch, strongBorrowerModest, severeDebtStress, highCollateralLowIncome];
    for (const p of personas) {
      expect(() => assessBorrower(p)).not.toThrow();
    }
  });
});

// ============================
// Boundary tests (#38)
// ============================
describe('boundary tests', () => {
  it('credit score just below and above a tier boundary', () => {
    const below = assessBorrower({ ...richSalaried, creditScore: { status: 'known' as const, value: 759 } });
    const above = assessBorrower({ ...richSalaried, creditScore: { status: 'known' as const, value: 761 } });
    expect(above.pricing.borrowerFairRate.max).toBeLessThanOrEqual(below.pricing.borrowerFairRate.max);
  });

  it('very small requested loan size', () => {
    const result = assessBorrower({ ...richSalaried, requestedAmount: 10_000 });
    expect(result.capacity.recommendedAmount).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.capacity.recommendedAmount)).toBe(true);
  });

  it('requested amount equal to safe maximum should not crash', () => {
    const initial = assessBorrower(richSalaried);
    const atMax = assessBorrower({ ...richSalaried, requestedAmount: initial.safe.amountRange.max });
    expect(Number.isFinite(atMax.capacity.recommendedAmount)).toBe(true);
  });
});

// ============================
// Property-based / fuzz-like tests (#39)
// ============================
describe('fuzz-like tests: generated borrower profiles', () => {
  function randomIncome(): number { return 15000 + Math.floor(Math.random() * 200000); }
  function randomAmount(): number { return 25000 + Math.floor(Math.random() * 5000000); }

  const fuzzCases: BorrowerAnswers[] = Array.from({ length: 30 }, (_, i) => ({
    ...blankAnswers(),
    id: `fuzz-${i}`,
    name: `Fuzz ${i}`,
    age: 22 + Math.floor(Math.random() * 40),
    requestedAmount: randomAmount(),
    incomeType: (['salaried', 'self_employed', 'informal'] as const)[i % 3]!,
    netMonthlyIncome: i % 3 === 0 ? known(randomIncome()) : notApplicable(),
    variableMonthlyIncome: i % 3 !== 0 ? known({ min: randomIncome() * 0.6, max: randomIncome() }) : notApplicable(),
    existingMonthlyEmis: Math.random() > 0.3 ? known(Math.floor(Math.random() * 30000)) : unknown(),
    essentialMonthlyExpenses: Math.random() > 0.3 ? known(5000 + Math.floor(Math.random() * 40000)) : unknown(),
    rentMonthly: Math.random() > 0.4 ? known(Math.floor(Math.random() * 25000)) : unknown(),
    creditScore: Math.random() > 0.5 ? { status: 'known' as const, value: 550 + Math.floor(Math.random() * 300) } : { status: 'unknown' as const },
    recentMissedPayment: (['yes', 'no', 'unknown'] as const)[Math.floor(Math.random() * 3)]!,
    dependents: Math.random() > 0.3 ? known(Math.floor(Math.random() * 4)) : unknown(),
  }));

  it('never crashes for any generated profile', () => {
    for (const p of fuzzCases) {
      expect(() => assessBorrower(p)).not.toThrow();
    }
  });

  it('no NaN or Infinity in any output', () => {
    for (const p of fuzzCases) {
      const r = assessBorrower(p);
      expect(Number.isFinite(r.capacity.recommendedAmount)).toBe(true);
      expect(Number.isFinite(r.safe.amountRange.min)).toBe(true);
      expect(Number.isFinite(r.safe.amountRange.max)).toBe(true);
      expect(Number.isFinite(r.lender.amountRange.min)).toBe(true);
      expect(Number.isFinite(r.lender.amountRange.max)).toBe(true);
      expect(Number.isFinite(r.pricing.borrowerFairRate.min)).toBe(true);
      expect(Number.isFinite(r.pricing.borrowerFairRate.max)).toBe(true);
      expect(Number.isFinite(r.safeMonthlyEmi)).toBe(true);
    }
  });

  it('no negative loan amounts', () => {
    for (const p of fuzzCases) {
      const r = assessBorrower(p);
      expect(r.capacity.recommendedAmount).toBeGreaterThanOrEqual(0);
      expect(r.safe.amountRange.min).toBeGreaterThanOrEqual(0);
      expect(r.safe.amountRange.max).toBeGreaterThanOrEqual(0);
      expect(r.lender.amountRange.min).toBeGreaterThanOrEqual(0);
    }
  });

  it('ranges remain ordered', () => {
    for (const p of fuzzCases) {
      const r = assessBorrower(p);
      expect(r.safe.amountRange.max).toBeGreaterThanOrEqual(r.safe.amountRange.min);
      expect(r.lender.amountRange.max).toBeGreaterThanOrEqual(r.lender.amountRange.min);
      expect(r.pricing.borrowerFairRate.max).toBeGreaterThanOrEqual(r.pricing.borrowerFairRate.min);
    }
  });

  it('verdict is always valid', () => {
    for (const p of fuzzCases) {
      const r = assessBorrower(p);
      expect(['borrow', 'borrow_less', 'dont_borrow']).toContain(r.verdict);
    }
  });

  it('result always contains explanation', () => {
    for (const p of fuzzCases) {
      const r = assessBorrower(p);
      expect(r.topReason.length).toBeGreaterThan(0);
      expect(r.reasons.length).toBeGreaterThan(0);
    }
  });

  it('consistency validation passes for all generated profiles', () => {
    for (const p of fuzzCases) {
      const r = assessBorrower(p);
      const problems = validateAssessmentConsistency(r);
      expect(problems).toEqual([]);
    }
  });
});
