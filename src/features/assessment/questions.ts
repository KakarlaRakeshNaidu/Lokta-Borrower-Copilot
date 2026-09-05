import { z } from 'zod';
import type { BorrowerAnswers, IncomeType } from '../../domain/types';
import { isKnown } from '../../domain/types';

export type QuestionStep = {
  id: string;
  title: string;
  helper: string;
  affects: Array<'verdict' | 'lenderAmount' | 'safeAmount' | 'rate' | 'emi' | 'confidence'>;
  applicable?: (answers: BorrowerAnswers) => boolean;
};

export const questionSteps: QuestionStep[] = [
  {
    id: 'loan',
    title: 'Loan need',
    helper: 'Purpose, amount and product intent decide the route, tenure and whether projected income should be ignored or only shown as upside.',
    affects: ['verdict', 'lenderAmount', 'safeAmount', 'rate', 'emi']
  },
  {
    id: 'profile',
    title: 'Borrower profile',
    helper: 'Age and income type decide which affordability and stress rules apply.',
    affects: ['verdict', 'safeAmount', 'lenderAmount', 'confidence']
  },
  {
    id: 'income',
    title: 'Income detail',
    helper: 'Income is assessed differently for salary, business cash flow and informal variable income.',
    affects: ['lenderAmount', 'safeAmount', 'confidence', 'emi']
  },
  {
    id: 'cashflow',
    title: 'Current outflow',
    helper: 'Existing EMIs, rent and essentials are subtracted before recommending a safe EMI.',
    affects: ['lenderAmount', 'safeAmount', 'emi', 'verdict', 'confidence']
  },
  {
    id: 'credit',
    title: 'Credit behaviour',
    helper: 'Known score can narrow pricing. Unknown or thin-file widens the band but is not treated as bad credit.',
    affects: ['rate', 'confidence', 'verdict']
  },
  {
    id: 'secured',
    title: 'Security and support',
    helper: 'Collateral or a genuine co-applicant can change product routing, but never replaces serviceability.',
    affects: ['lenderAmount', 'safeAmount', 'rate', 'confidence'],
    applicable: (answers) => answers.incomeType === 'self_employed' || answers.productIntent === 'lap' || answers.productIntent === 'gold' || answers.loanPurpose === 'business_expansion'
  },
  {
    id: 'offer',
    title: 'Lender offer',
    helper: 'Optional quote details power the fair-band and APR comparison on the Negotiation Card.',
    affects: ['rate', 'emi', 'confidence']
  }
];

export function applicableSteps(answers: BorrowerAnswers): QuestionStep[] {
  return questionSteps.filter((step) => !step.applicable || step.applicable(answers));
}

const knownNumber = z.object({ status: z.literal('known'), value: z.number().finite().nonnegative() });
const unknownLike = z.union([z.object({ status: z.literal('unknown') }), z.object({ status: z.literal('not_applicable') })]);
const knownMoney = z.union([knownNumber, unknownLike]);
const knownRange = z.union([
  z.object({ status: z.literal('known'), value: z.object({ min: z.number().finite().nonnegative(), max: z.number().finite().nonnegative() }) }),
  unknownLike
]);

export const borrowerSchema = z.object({
  id: z.string(),
  name: z.string().max(80),
  city: z.string().max(80),
  age: z.number().int().min(18, 'Age should be at least 18.').max(70, 'This prototype supports borrowers up to age 70.'),
  loanPurpose: z.enum(['wedding', 'business_expansion', 'vehicle_for_income', 'home', 'education', 'medical', 'refinance', 'other']),
  requestedAmount: z.number().finite().positive('Enter an amount greater than zero.').max(100_000_000, 'Use a smaller amount for this self-assessment.'),
  productIntent: z.enum(['personal', 'business', 'lap', 'home', 'gold', 'vehicle', 'not_sure']),
  incomeType: z.enum(['salaried', 'self_employed', 'informal']),
  netMonthlyIncome: knownMoney,
  variableMonthlyIncome: knownRange,
  itrAnnualIncome: knownMoney,
  employmentYears: knownMoney,
  employerStability: z.enum(['large_stable', 'stable', 'new_or_probation', 'unknown']),
  yearsInBusiness: knownMoney,
  bankedIncomeShare: z.enum(['mostly_banked', 'mixed', 'cash_heavy', 'unknown']),
  existingMonthlyEmis: knownMoney,
  existingEmiEndsInMonths: knownMoney,
  essentialMonthlyExpenses: knownMoney,
  rentMonthly: knownMoney,
  creditScore: z.union([knownNumber.extend({ value: z.number().int().min(300).max(900) }), z.object({ status: z.literal('unknown') }), z.object({ status: z.literal('thin_file') })]),
  recentMissedPayment: z.enum(['yes', 'no', 'unknown']),
  highCostDebtOutstanding: knownMoney,
  highCostDebtMonthlyPayment: knownMoney,
  dependents: knownMoney,
  emergencySavingsMonths: knownMoney,
  collateral: z.object({
    kind: z.enum(['none', 'property', 'gold', 'vehicle']),
    value: knownMoney,
    unencumbered: z.union([z.object({ status: z.literal('known'), value: z.boolean() }), unknownLike])
  }),
  coApplicantMonthlyIncome: knownMoney,
  coApplicantAvailable: z.boolean(),
  expectedIncrementalIncome: knownMoney,
  lenderOffer: z.union([
    z.object({
      nominalRateAnnual: z.number().finite().min(0).max(60),
      tenureMonths: z.number().int().min(1).max(360),
      processingFeePct: z.number().finite().min(0).max(20),
      quotedEmi: z.number().finite().nonnegative()
    }),
    z.null()
  ])
}).superRefine((answers, ctx) => {
  const incomeType = answers.incomeType as IncomeType;
  if (incomeType === 'salaried' && !isKnown(answers.netMonthlyIncome)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['netMonthlyIncome'], message: 'Add net monthly salary or choose another income type.' });
  }
  if ((incomeType === 'self_employed' || incomeType === 'informal') && !isKnown(answers.variableMonthlyIncome)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['variableMonthlyIncome'], message: 'Add a recent monthly income range.' });
  }
  if (isKnown(answers.variableMonthlyIncome) && answers.variableMonthlyIncome.value.min > answers.variableMonthlyIncome.value.max) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['variableMonthlyIncome'], message: 'Income low point cannot be above high point.' });
  }
  if (isKnown(answers.existingMonthlyEmis) && isKnown(answers.netMonthlyIncome) && answers.existingMonthlyEmis.value > answers.netMonthlyIncome.value * 1.5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['existingMonthlyEmis'], message: 'Check this EMI amount; it is unusually high versus income.' });
  }
});

export function validateBorrowerAnswers(answers: BorrowerAnswers) {
  return borrowerSchema.safeParse(answers);
}