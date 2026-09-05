export type Known<T> =
  | { status: 'known'; value: T }
  | { status: 'unknown' }
  | { status: 'not_applicable' };

export const known = <T>(value: T): Known<T> => ({ status: 'known', value });
export const unknown = <T>(): Known<T> => ({ status: 'unknown' });
export const notApplicable = <T>(): Known<T> => ({ status: 'not_applicable' });
export const isKnown = <T>(item: Known<T>): item is { status: 'known'; value: T } => item.status === 'known';

export type CreditScoreAnswer = { status: 'known'; value: number } | { status: 'unknown' } | { status: 'thin_file' };
export type IncomeType = 'salaried' | 'self_employed' | 'informal';
export type Verdict = 'borrow' | 'borrow_less' | 'dont_borrow';
export type Confidence = 'low' | 'medium' | 'high';
export type LoanPurpose = 'wedding' | 'business_expansion' | 'vehicle_for_income' | 'home' | 'education' | 'medical' | 'refinance' | 'other';
export type ProductIntent = 'personal' | 'business' | 'lap' | 'home' | 'gold' | 'vehicle' | 'not_sure';
export type ProductChoice = 'personal_loan' | 'unsecured_business' | 'loan_against_property' | 'home_loan' | 'gold_loan' | 'two_wheeler_vehicle';
export type BehaviorAnswer = 'yes' | 'no' | 'unknown';
export type EmployerStability = 'large_stable' | 'stable' | 'new_or_probation' | 'unknown';
export type BankedIncomeShare = 'mostly_banked' | 'mixed' | 'cash_heavy' | 'unknown';
export type CollateralKind = 'none' | 'property' | 'gold' | 'vehicle';
export type Severity = 'positive' | 'neutral' | 'warning' | 'critical';
export type OutputArea = 'verdict' | 'lenderAmount' | 'safeAmount' | 'emergencyAmount' | 'rate' | 'emi' | 'confidence';
export type QuoteAssessment = 'good' | 'acceptable' | 'expensive' | 'very_expensive' | 'unsafe_regardless_of_rate' | 'insufficient_information';

export type MoneyRange = { min: number; max: number };
export type RateRange = { min: number; max: number };

export type CollateralAnswer = {
  kind: CollateralKind;
  value: Known<number>;
  unencumbered: Known<boolean>;
};

export type LenderOffer = {
  nominalRateAnnual: number;
  tenureMonths: number;
  processingFeePct: number;
  quotedEmi: number;
};

export type BorrowerAnswers = {
  id: string;
  name: string;
  city: string;
  age: number;
  loanPurpose: LoanPurpose;
  requestedAmount: number;
  productIntent: ProductIntent;
  incomeType: IncomeType;
  netMonthlyIncome: Known<number>;
  variableMonthlyIncome: Known<MoneyRange>;
  itrAnnualIncome: Known<number>;
  employmentYears: Known<number>;
  employerStability: EmployerStability;
  yearsInBusiness: Known<number>;
  bankedIncomeShare: BankedIncomeShare;
  existingMonthlyEmis: Known<number>;
  existingEmiEndsInMonths: Known<number>;
  essentialMonthlyExpenses: Known<number>;
  rentMonthly: Known<number>;
  creditScore: CreditScoreAnswer;
  recentMissedPayment: BehaviorAnswer;
  highCostDebtOutstanding: Known<number>;
  highCostDebtMonthlyPayment: Known<number>;
  dependents: Known<number>;
  emergencySavingsMonths: Known<number>;
  collateral: CollateralAnswer;
  coApplicantMonthlyIncome: Known<number>;
  coApplicantAvailable: boolean;
  expectedIncrementalIncome: Known<number>;
  lenderOffer: LenderOffer | null;
};

export type Reason = {
  code: string;
  severity: Severity;
  title: string;
  detail: string;
  inputsUsed: string[];
  rulesUsed: string[];
  affects: OutputArea[];
};

export type IncomeAssessment = {
  lenderMonthlyIncome: MoneyRange;
  safeMonthlyIncome: MoneyRange;
  documentedMonthlyIncome: Known<number>;
  reasons: Reason[];
};

export type CapacityResult = {
  emiRange: MoneyRange;
  amountRange: MoneyRange;
  reasons: Reason[];
};

export type EmergencyCapacityResult = {
  amountRange: MoneyRange | null;
  emiRange: MoneyRange | null;
  reasons: Reason[];
};

export type BorrowingCapacity = {
  recommendedAmount: number;
  recommendedAmountRange: MoneyRange | null;
  safeAmountRange: MoneyRange | null;
  emergencyOnlyAmountRange: MoneyRange | null;
  emergencyOnlyEmiRange: MoneyRange | null;
  lenderLikelyAmountRange: MoneyRange | null;
  recommendedEmi: number;
  emergencyOnlyEmi: number | null;
  reasons: Reason[];
};

export type ProductRoutingResult = {
  recommendedProduct: ProductChoice;
  alternatives: ProductChoice[];
  ltv: Known<number>;
  ltvEligibleAmount: Known<number>;
  reasons: Reason[];
};

export type RateAssessment = {
  nominalRate: RateRange;
  apr: RateRange;
  borrowerFairRate: RateRange;
  borrowerFairApr: RateRange;
  marketPossibleRate: RateRange;
  marketPossibleApr: RateRange;
  avoidAboveApr: number;
  pricingConfidence: Confidence;
  tooWideForSingleFairBand: boolean;
  feePct: RateRange;
  feeAmount: MoneyRange;
  reasons: Reason[];
};

export type TenureOption = {
  months: number;
  emi: number;
  totalInterest: number;
  breachesSafeCeiling: boolean;
};

export type StressResult = {
  label: string;
  stressedIncome: number;
  postEmiSurplus: number;
  status: 'passes' | 'tight' | 'fails';
  reason: Reason;
};

export type ConfidenceByOutput = {
  affordability: Confidence;
  lenderSanction: Confidence;
  pricing: Confidence;
  productRouting: Confidence;
};

export type ConfidenceResult = {
  level: Confidence;
  score: number;
  widenFactor: number;
  loweredBy: string[];
  tightenQuestions: string[];
  byOutput: ConfidenceByOutput;
  reasons: Reason[];
};

export type OfferComparison = {
  apr: number;
  assessment: QuoteAssessment;
  label: string;
  message: string;
  severity: Severity;
};

export type NegotiationCardModel = {
  borrowerSummary: string;
  recommendation: string;
  amountToAskFor: number;
  recommendedAmount: number;
  recommendedAmountRange: MoneyRange | null;
  emergencyOnlyAmountRange: MoneyRange | null;
  emergencyOnlyEmiRange: MoneyRange | null;
  lenderLikelyRange: MoneyRange;
  safeAmountRange: MoneyRange;
  fairRate: RateRange;
  apr: RateRange;
  marketPossibleRate: RateRange;
  marketPossibleApr: RateRange;
  avoidAboveApr: number;
  maxEmi: number;
  tenureBand: MoneyRange;
  evidenceBullets: string[];
  warnings: string[];
  stressLine: string;
  script: string;
  offerComparison: OfferComparison | null;
};

export type AssessmentResult = {
  answers: BorrowerAnswers;
  verdict: Verdict;
  verdictLabel: string;
  topReason: string;
  lender: CapacityResult;
  safe: CapacityResult;
  capacity: BorrowingCapacity;
  income: IncomeAssessment;
  product: ProductRoutingResult;
  pricing: RateAssessment;
  tenureOptions: TenureOption[];
  recommendedTenureMonths: number;
  safeMonthlyEmi: number;
  stress: StressResult;
  confidence: ConfidenceResult;
  reasons: Reason[];
  nextAction: string;
  negotiationCard: NegotiationCardModel;
};
