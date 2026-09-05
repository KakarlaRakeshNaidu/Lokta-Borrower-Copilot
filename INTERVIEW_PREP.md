# Interview Prep

## Product Explanation

**What did I build?**
Borrower Copilot is a borrower-side self-assessment for Indian borrowers. It gives a verdict, safe amount, likely lender range, fair rate/APR, EMI ceiling, stress result and a Negotiation Card.

**Who is it for?**
A borrower who wants to know their safe number before speaking to a bank, NBFC or app lender.

**Why are lender-likely and borrower-safe different?**
A lender may focus on policy FOIR and collateral. A borrower also needs rent, essentials, existing EMIs and emergency buffer. So the lender number can be higher than the healthy number.

**Why can it say Don't borrow?**
Because borrower protection is real. If safe EMI is zero, stress fails badly, or fragile income plus high-cost debt plus a recent bounce creates debt-stacking risk, the safest advice is to pause.

## Question Design

Must questions: purpose, amount, product intent, income type, income amount/range, existing EMIs, essential expenses/rent, age, credit score and recent repayment stress.

Adaptive flow:

- Salaried asks salary, tenure and employer stability.
- Self-employed asks income range, ITR, years in business, banked/cash mix, collateral and co-applicant support.
- Informal asks low/high income, dependents, app loans, missed payments and projected productive upside.

Every extra question affects an output or confidence. If it does not move the engine, it should not be asked.

Unknown answers stay unknown. They reduce confidence and widen ranges. Unknown score is not score 0 or 300.

Confidence is weighted by relevant data: income, score, obligations, expenses, repayment behaviour, job/business detail, collateral where relevant, fee/offer detail and savings.

## Lending Reasoning

**FOIR:** Fixed obligations as a percentage of income. If income is ₹1,00,000 and total allowed obligations are 50%, total EMIs should stay around ₹50,000.

**Lender affordability:** assessed income times lender-like FOIR, minus existing monthly EMIs.

**Borrower-safe affordability:** lower of safe FOIR room and actual surplus after essentials, rent, EMIs and buffer.

**EMI:** standard amortising-loan formula using principal, monthly rate and tenure.

**Safe EMI to amount:** inverse EMI formula converts monthly safe EMI into an approximate principal for product tenure and rate.

**Fair rate band:** product base market band plus score, stability, repayment behaviour, documentation, secured route and confidence modifiers.

**APR:** all-in annual cost from cash flows. It is higher than headline rate when upfront fees reduce net disbursal.

**Processing fee:** modeled as upfront fee plus GST. The APR solver uses net disbursal and EMI stream.

**Stress test:** salary/business/informal income is shocked down. The app checks post-EMI surplus. Productive projected income is not counted as guaranteed.

**Variable income:** use lower bound and haircuts. ITR/documented income and cash income are separate evidence.

**Collateral/LTV:** collateral can route Ravi to LAP and cap loan size, but serviceability still matters.

## Three Borrowers

**Priya:** Stable salaried borrower, ₹1.1 lakh income, ₹14k car EMI, ₹28k rent, score 780, wants ₹8 lakh for wedding. Verdict: Borrow less. Lender-likely range is high, but safe EMI is about ₹18.5k and stress is tight. Negotiate around ₹6.3 lakh at safe EMI or insist on a safer structure and challenge expensive APR.

**Ravi:** Kirana owner with ₹40k-₹80k cash income, ₹4.2 lakh ITR, no formal-loan score and ₹45 lakh unencumbered shop. Verdict: Borrow less. LAP-style route is worth comparing because LTV is reasonable, but documented income and stress headroom limit the safe amount. Ask for KFS APR and avoid assuming collateral guarantees approval.

**Anita:** Delivery/tailoring income ₹26k-₹30k, two children, husband unemployed, app debt, one recent bounce, wants scooter loan. Verdict: Don't borrow. Scooter may be productive, but current high-cost debt and zero safe EMI make another loan unsafe. Restructure debt and reassess after payment stability improves.

## Architecture

React + TypeScript + Vite gives a small, fast SPA with strict types. No backend is needed because the core product is a deterministic client-side calculator using voluntary answers.

Rules are in `src/domain/rules`. Engine functions are in `src/domain/engine`. Math is in `src/domain/calculations`. UI reads `AssessmentResult` and formats it.

To change a rule live:

- Salaried safe FOIR: `src/domain/rules/affordabilityRules.ts`, `safeFoirByIncome.salaried`.
- Income stress 20% to 25%: `src/domain/rules/stressRules.ts`.
- Personal-loan rate band: `src/domain/rules/pricingRules.ts`, `baseRateBands.personal_loan`.
- Recent bounce severity: `src/domain/rules/pricingRules.ts` and `src/domain/rules/verdictRules.ts`.
- LAP max LTV: `src/domain/rules/productRules.ts`, `loan_against_property.ltvRange.max`.

Downstream effects move automatically: EMI capacity, safe amount, rate/APR, stress result, verdict, explanations and run-through docs.

Tests protect the formulas and invariants: EMI/inverse consistency, APR fee behaviour, unknown score handling, Priya/Ravi/Anita outcomes, adaptive branches and privacy checks.

## Honesty And Limits

The app does not know the bureau report, verified bank statements, exact lender policy, collateral title/value, KYC, fraud risk or final fees. Outputs are ranges because borrower information and lender pricing are uncertain. This is not a real sanction or credit decision.

## 60-Second Pitch

Borrower Copilot is a borrower-side lending self-assessment for India. Instead of asking what a lender might approve, it first asks what the borrower can safely carry. The app uses deterministic TypeScript rules, not an LLM or backend, so every number is explainable and editable. It separates lender-likely sanction from borrower-safe amount, estimates fair rate and all-in APR including processing fee, gives a safe EMI ceiling, runs a stress case and produces a Negotiation Card. The important design choice is honesty about uncertainty: unknown score does not become bad credit, missing data widens ranges, and productive borrowing is treated with nuance. Priya sees that a lender may offer more than she should carry, Ravi gets routed toward a secured LAP comparison but still has serviceability checks, and Anita is protected from stacking another high-cost loan while her cash flow is stressed.