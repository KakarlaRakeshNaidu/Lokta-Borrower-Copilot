export type RuleSourceType = 'source' | 'judgement';

export type RuleEntry = {
  id: string;
  label: string;
  value: string;
  why: string;
  sourceType: RuleSourceType;
  sourceLabel: string;
  sourceUrl?: string;
  usedIn: string[];
};

export const ruleCatalog: RuleEntry[] = [
  {
    id: 'RBI_KFS_APR_DISCLOSURE',
    label: 'KFS and APR disclosure anchor',
    value: 'APR is all-in annual cost including interest and charges associated with the credit facility.',
    why: 'The app asks borrowers to compare all-in APR, not only headline nominal rate.',
    sourceType: 'source',
    sourceLabel: 'RBI Key Facts Statement for Loans and Advances, April 15, 2024',
    sourceUrl: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12663&Mode=0',
    usedIn: ['calculateApr', 'buildNegotiationCard', 'RULES.md']
  },
  {
    id: 'RBI_FLOATING_RATE_HEADROOM',
    label: 'Floating-rate EMI headroom',
    value: 'Borrowers should understand EMI/tenor impact when rates reset; negative amortisation should not result.',
    why: 'The stress test shows headroom instead of presenting the cheapest-looking EMI as safe.',
    sourceType: 'source',
    sourceLabel: 'RBI Reset of Floating Interest Rate on EMI based Personal Loans, August 18, 2023 and FAQ January 10, 2025',
    sourceUrl: 'https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12529',
    usedIn: ['runStressScenario', 'buildTenureOptions']
  },
  {
    id: 'RBI_MICROFINANCE_50_OBLIGATION_CAP',
    label: 'Low-income repayment obligation cap reference',
    value: '50% of monthly household income is the maximum repayment-obligation cap in the RBI microfinance framework.',
    why: 'Used as a borrower-protection reference for low-income/informal cases, not as a universal retail FOIR rule.',
    sourceType: 'source',
    sourceLabel: 'RBI Regulatory Framework for Microfinance Loans, updated January 30, 2025',
    sourceUrl: 'https://www.rbi.org.in/commonperson/English/Scripts/FAQs.aspx?Id=3366',
    usedIn: ['calculateSafeCapacity', 'determineVerdict']
  },
  {
    id: 'CIBIL_SCORE_RANGE',
    label: 'CIBIL score range',
    value: '300-900 for active credit history; thin/no-file should remain explicit.',
    why: 'Known score affects pricing and confidence, while unknown/thin-file widens estimates instead of becoming zero.',
    sourceType: 'source',
    sourceLabel: 'TransUnion CIBIL FAQ and Stay Credit Ready pages',
    sourceUrl: 'https://www.cibil.com/faq-brochure',
    usedIn: ['estimateRateBand', 'calculateConfidence']
  },
  {
    id: 'SBI_PERSONAL_LOAN_ANCHOR',
    label: 'Personal loan public anchor',
    value: 'SBI personal loan starts near 10.05%, up to 84 months, processing fee up to 1.50% plus GST.',
    why: 'Provides a first-party public anchor for personal-loan rate, fee and tenure ranges.',
    sourceType: 'source',
    sourceLabel: 'SBI Personal Loan page, accessed September 4, 2026',
    sourceUrl: 'https://sbi.co.in/web/personal-banking/loans/personal-loans/sbi-personal-loan',
    usedIn: ['productRules', 'pricingRules', 'feeRules']
  },
  {
    id: 'HDFC_PERSONAL_RATE_ANCHOR',
    label: 'Personal loan wide market anchor',
    value: 'HDFC personal loan rack range published as 10.90%-24%, with fixed service charge schedule.',
    why: 'Shows public lender bands can be wide, supporting range-based fair-rate display.',
    sourceType: 'source',
    sourceLabel: 'HDFC Bank personal loan interest rates and charges, accessed September 4, 2026',
    sourceUrl: 'https://www.hdfcbank.com/personal/borrow/popular-loans/personal-loan/interest-rates-and-charges',
    usedIn: ['pricingRules']
  },
  {
    id: 'ICICI_PERSONAL_RATE_ANCHOR',
    label: 'Personal loan rate and fee anchor',
    value: 'ICICI personal loan rates are published around 10.80%-16.65%; processing fee up to 2% plus taxes.',
    why: 'Second first-party lender anchor for fair-rate and APR fee assumptions.',
    sourceType: 'source',
    sourceLabel: 'ICICI personal loan interest rates, accessed September 4, 2026',
    sourceUrl: 'https://www.icicibank.com/Personal-Banking/loans/personal-loan/personal-loan-interest-rates.page',
    usedIn: ['pricingRules', 'feeRules']
  },
  {
    id: 'SBI_LAP_LTV_TENURE_ANCHOR',
    label: 'Loan against property LTV and tenure anchor',
    value: 'SBI LAP publishes 60%-65% LTV bands, 5-15 year tenure and EMI/NMI ratios by income.',
    why: 'Ravi-style collateral recommendations must still check LTV and serviceability.',
    sourceType: 'source',
    sourceLabel: 'SBI Loans Against Property page, accessed September 4, 2026',
    sourceUrl: 'https://sbi.co.in/web/personal-banking/loans/loans-against-property/loans-against-property',
    usedIn: ['routeProduct', 'calculateLtv', 'productRules']
  },
  {
    id: 'SBI_PROCESSING_FEE_ANCHOR',
    label: 'Processing fee public schedule',
    value: 'SBI publishes processing fee examples for personal, vehicle, gold and LAP products.',
    why: 'Supports transparent APR fee ranges when the borrower has not entered exact charges.',
    sourceType: 'source',
    sourceLabel: 'SBI processing fees page, last updated April 2, 2025',
    sourceUrl: 'https://sbi.co.in/web/interest-rates/interest-rates/processing-fees',
    usedIn: ['feeRules', 'calculateApr']
  },
  {
    id: 'SBI_GOLD_LTV_FEE_ANCHOR',
    label: 'Gold loan margin and fee anchor',
    value: 'SBI gold loan publishes margins around 25%-35% and low processing fees for EMI/bullet structures.',
    why: 'Gold loan route can be safer than high-cost unsecured debt only when collateral exists and cash flow works.',
    sourceType: 'source',
    sourceLabel: 'SBI Personal Gold Loan page, accessed September 4, 2026',
    sourceUrl: 'https://sbi.co.in/web/personal-banking/loans/gold-loan/personal-gold-loans',
    usedIn: ['productRules', 'pricingRules', 'feeRules']
  },
  {
    id: 'ICICI_TWO_WHEELER_RATE_ANCHOR',
    label: 'Two-wheeler finance anchor',
    value: 'ICICI public page lists two-wheeler rates around 10.25%-26.10% depending on borrower and loan terms.',
    why: 'Anita scooter logic compares vehicle finance to high-cost unsecured app-loan stacking.',
    sourceType: 'source',
    sourceLabel: 'ICICI two-wheeler loan review page, accessed September 4, 2026',
    sourceUrl: 'https://www.icicibank.com/personal-banking/loans/two-wheeler-loan/review',
    usedIn: ['pricingRules', 'routeProduct']
  },
  {
    id: 'SALARIED_INCOME_HAIRCUT',
    label: 'Stable salary income haircut',
    value: 'Lender 95%-100%; borrower-safe 90%-96% of net monthly salary, adjusted by job stability.',
    why: 'Salary is relatively stable, but the safe model keeps a small margin for variable pay and job shocks.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['assessIncome']
  },
  {
    id: 'SELF_EMPLOYED_INCOME_HAIRCUT',
    label: 'Self-employed income haircut',
    value: 'Lender leans on ITR/banked income; borrower-safe uses 65%-85% of sustainable low-to-average cash income.',
    why: 'Cash-heavy and seasonal businesses need a wider range than salaried income.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['assessIncome']
  },
  {
    id: 'INFORMAL_INCOME_HAIRCUT',
    label: 'Informal/gig income haircut',
    value: 'Lender 55%-70%; borrower-safe 70%-85% of the low end of recent monthly income.',
    why: 'The lower bound is more useful than a best month for deciding if an EMI is safe.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['assessIncome']
  },
  {
    id: 'COAPPLICANT_COUNTING_RULE',
    label: 'Co-applicant income counting',
    value: 'Count 50% of known co-applicant income only when marked genuinely available for repayment.',
    why: 'Household support can help, but it should not be assumed by default.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['assessIncome', 'calculateConfidence']
  },
  {
    id: 'LENDER_FOIR_BY_PROFILE',
    label: 'Lender-like FOIR assumptions',
    value: 'Approximate total fixed-obligation ratio ranges: salaried 50%-60%, self-employed 45%-58%, informal 30%-45%; product-specific caps also apply.',
    why: 'Public lender policy varies; this is a transparent estimate, not a claim of an RBI mandate.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement informed by public lender examples',
    usedIn: ['calculateLenderCapacity']
  },
  {
    id: 'SAFE_FOIR_BY_PROFILE',
    label: 'Borrower-safe FOIR assumptions',
    value: 'Safe incremental EMI uses lower ratios: salaried 32%, self-employed 28%, informal 22%, modified by purpose and stress flags.',
    why: 'Borrower safety should preserve cash-flow headroom below what a lender may sanction.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['calculateSafeCapacity', 'determineVerdict']
  },
  {
    id: 'SAFE_BUFFER_RULE',
    label: 'Required monthly buffer',
    value: 'Keep at least the greater of ₹5,000 or 18%-25% of safe income, plus dependent buffer where relevant.',
    why: 'A borrower-side ceiling should leave room for shocks and non-EMI essentials.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['calculateSafeCapacity', 'runStressScenario']
  },
  {
    id: 'UNKNOWN_OBLIGATION_WIDENING',
    label: 'Unknown obligation treatment',
    value: 'Unknown EMIs become an uncertainty band from zero to 10% of assessed income; confidence falls.',
    why: 'Unknown is not zero, but also should not create fake precision.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['calculateLenderCapacity', 'calculateSafeCapacity', 'calculateConfidence']
  },
  {
    id: 'PRODUCT_TENURE_LIMITS',
    label: 'Product tenure assumptions',
    value: 'Personal 12-84m, business 12-60m, LAP 60-180m, home 60-300m, gold 3-36m, vehicle 12-60m.',
    why: 'Keeps EMI/principal conversion realistic for the broad product route.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement using public lender examples where available',
    usedIn: ['productRules', 'buildTenureOptions']
  },
  {
    id: 'BASE_RATE_BANDS',
    label: 'Base product rate bands',
    value: 'Personal 10.8%-18%, unsecured business 14%-24%, LAP 10.8%-14%, home 8.4%-11.5%, gold 8.8%-13%, vehicle 10.25%-22%.',
    why: 'A public-market anchor before borrower-specific risk adjustments.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement anchored to public lender pages',
    usedIn: ['estimateRateBand']
  },
  {
    id: 'SCORE_RATE_MODIFIERS',
    label: 'Credit-score pricing modifiers',
    value: 'Strong known scores narrow/lower the band; weak known scores raise it; unknown/thin-file widens it without becoming score 0.',
    why: 'Credit history affects pricing but missing data is uncertainty, not automatic default.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement using CIBIL score interpretation',
    usedIn: ['estimateRateBand', 'calculateConfidence']
  },
  {
    id: 'REPAYMENT_STRESS_MODIFIERS',
    label: 'Repayment behavior modifiers',
    value: 'Recent missed/bounced payment and active high-cost short-term debt add rate pressure and red-flag reasons.',
    why: 'Recent repayment stress materially changes borrower safety and lender availability.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['estimateRateBand', 'determineVerdict']
  },
  {
    id: 'FEE_ASSUMPTION_BANDS',
    label: 'Processing fee assumption bands',
    value: 'Personal 1%-2%, business 1%-2.5%, LAP 0.75%-1.25%, home 0.3%-1%, gold 0.25%-0.5%, vehicle 1%-2%; GST modeled at 18% on fee.',
    why: 'APR must include mandatory upfront charges when exact quote details are unknown.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement anchored to public lender fee pages',
    usedIn: ['feeRules', 'calculateApr']
  },
  {
    id: 'LTV_LIMITS',
    label: 'LTV assumptions',
    value: 'LAP 60%-65%, gold 65%-75%, vehicle 80%-90%, home 75%-90% by ticket size; collateral does not override serviceability.',
    why: 'Secured products need both collateral and repayable cash flow.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement anchored to SBI LAP/gold examples',
    usedIn: ['routeProduct', 'calculateLtv']
  },
  {
    id: 'STRESS_INCOME_DROP',
    label: 'Income stress assumptions',
    value: 'Salaried income drop 20%, self-employed lower-bound stress 25%, informal lower-bound stress 30%; floating-rate products may add 150 bps.',
    why: 'The app should show whether the EMI survives a plausible shock.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['runStressScenario']
  },
  {
    id: 'PROJECTED_INCOME_NOT_GUARANTEED',
    label: 'Projected income separation',
    value: 'Expected income from a financed asset is shown as upside only and not used as guaranteed affordability.',
    why: 'Productive borrowing deserves nuance, but current repayment capacity must stand alone.',
    sourceType: 'source',
    sourceLabel: 'RBI microfinance FAQ says expected financed-activity income is not included for household-income indebtedness tests',
    sourceUrl: 'https://www.rbi.org.in/commonperson/English/Scripts/FAQs.aspx?Id=3366',
    usedIn: ['assessIncome', 'runStressScenario', 'determineVerdict']
  },
  {
    id: 'VERDICT_RED_FLAGS',
    label: 'Protective verdict triggers',
    value: 'Do not borrow if safe EMI is zero, stress fails badly, or fragile income plus high-cost debt plus recent bounce creates debt-stacking risk.',
    why: 'Borrower protection must be a real branch, not decorative copy.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['determineVerdict']
  },
  {
    id: 'CONFIDENCE_MODEL',
    label: 'Confidence and widening',
    value: 'Relevant known data raises confidence; missing relevant data lowers it and widens money/rate ranges; irrelevant branch data is ignored.',
    why: 'The estimate should get sharper only when the borrower provides information that actually affects it.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['calculateConfidence']
  },
  {
    id: 'ROUNDING_PRESENTATION',
    label: 'Rounding and presentation',
    value: 'Internal math uses floating-point rupees; displayed money rounds to sensible rupee or ₹10,000 bands and Indian digit grouping.',
    why: 'Borrowers need clarity, not false precision.',
    sourceType: 'judgement',
    sourceLabel: 'My judgement',
    usedIn: ['formatRupees', 'roundMoneyRange']
  }
 ];

export const ruleIds = ruleCatalog.map((rule) => rule.id);

export function getRule(id: string): RuleEntry {
  const rule = ruleCatalog.find((entry) => entry.id === id);
  if (!rule) throw new Error(`Unknown rule id: ${id}`);
  return rule;
}