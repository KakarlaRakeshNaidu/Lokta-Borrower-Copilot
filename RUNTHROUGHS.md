# Borrower Run-Throughs

Generated from the current engine with `npm run docs:runthroughs`. Do not edit persona numbers here by hand; update fixtures or rules and regenerate.

## Priya

### Questions Asked By Adaptive Path

- Loan need: Purpose, amount and product intent decide the route, tenure and whether projected income should be ignored or only shown as upside.
- Borrower profile: Age and income type decide which affordability and stress rules apply.
- Income detail: Income is assessed differently for salary, business cash flow and informal variable income.
- Current outflow: Existing EMIs, rent and essentials are subtracted before recommending a safe EMI.
- Credit behaviour: Known score can narrow pricing. Unknown or thin-file widens the band but is not treated as bad credit.
- Lender offer: Optional quote details power the fair-band and APR comparison on the Negotiation Card.

### Fixture Answers

- Age/city: 29, Bengaluru
- Requested amount: ₹8,00,000
- Purpose: wedding
- Product intent: personal
- Income type: salaried
- Credit score: 780
- Recent missed payment: no

### Engine Output

- O1 verdict: **Borrow less**. The request needs a lower EMI, lower amount or safer structure because the stress case leaves no surplus.
- O2 lender-likely sanction range: **₹13,70,000-₹31,30,000**.
- O2 borrower-safe carrying range: **₹4,70,000-₹11,10,000**.
- Amount to use in negotiation: **₹6,30,000**.
- O3 fair nominal rate band: **10.0%-17.7%**.
- O3 estimated all-in APR band: **11.0%-20.5%**, using processing fee assumption **1.0%-2.0%** plus GST.
- O4 recommended EMI ceiling: **₹18,500 / month**.
- Product route: **Personal loan**.
- Stress scenario/result: **20% income stress on Personal loan** -> **fails**, post-EMI surplus -₹3,660.
- Confidence: **high** (100%). Unknowns: none material.

### Tenure Trade-Off

| Tenure months | EMI | Approx total interest | Status |
| --- | --- | --- | --- |
| 12 | ₹57,800 | ₹62,200 | Above safe ceiling |
| 48 | ₹18,500 | ₹2,54,200 | Within safe ceiling |
| 84 | ₹13,200 | ₹4,74,200 | Within safe ceiling |

### Full Negotiation Card Content

Borrower summary: Priya, age 29, Bengaluru - Personal loan
Recommendation: Borrow less. I should negotiate around ₹6,30,000 and keep EMI at or below ₹18,455 / month.
Amount to ask for: ₹6,30,000
Safe amount: ₹4,70,000-₹11,10,000
Lender-likely range: ₹13,70,000-₹31,30,000
Fair nominal rate: 10.0%-17.7%
Estimated all-in APR: 11.0%-20.5%
Maximum EMI: ₹18,500 / month
Tenure band: 12-84 months
Evidence:
  - Salary assessed conservatively: Stable salary receives a small haircut for safety; the lender-like view can still use nearly all recurring net income.
  - Wedding is treated as personal borrowing: The purpose can be valid, but it does not add repayment income, so affordability must stand on current cash flow.
  - High confidence: Key inputs are present, so the estimate can stay relatively tight.
  - Credit score affects the fair band: A known CIBIL score changes the rate band without pretending to reproduce a lender pricing model.
Warnings:
  - After a 20% income stress and the safe EMI, monthly surplus is -3660 before discretionary spending.
  - The request needs a lower EMI, lower amount or safer structure because the stress case leaves no surplus.
Stress: 20% income stress on Personal loan: fails, post-EMI surplus -₹3,660.
Quote comparison: Offer APR 23.0%. This quote is above the estimated fair band. Ask the lender to show the KFS APR and improve the rate or fee.
Script: This quote is above the estimated fair band. Ask the lender to show the KFS APR and improve the rate or fee.

## Ravi

### Questions Asked By Adaptive Path

- Loan need: Purpose, amount and product intent decide the route, tenure and whether projected income should be ignored or only shown as upside.
- Borrower profile: Age and income type decide which affordability and stress rules apply.
- Income detail: Income is assessed differently for salary, business cash flow and informal variable income.
- Current outflow: Existing EMIs, rent and essentials are subtracted before recommending a safe EMI.
- Credit behaviour: Known score can narrow pricing. Unknown or thin-file widens the band but is not treated as bad credit.
- Security and support: Collateral or a genuine co-applicant can change product routing, but never replaces serviceability.
- Lender offer: Optional quote details power the fair-band and APR comparison on the Negotiation Card.

### Fixture Answers

- Age/city: 42, Mysuru
- Requested amount: ₹15,00,000
- Purpose: business_expansion
- Product intent: business
- Income type: self_employed
- Credit score: thin-file / no prior formal loan
- Recent missed payment: unknown

### Engine Output

- O1 verdict: **Borrow less**. The request needs a lower EMI, lower amount or safer structure because the stress case leaves no surplus.
- O2 lender-likely sanction range: **₹10,00,000-₹29,30,000**.
- O2 borrower-safe carrying range: **₹0-₹19,00,000**.
- Amount to use in negotiation: **₹11,40,000**.
- O3 fair nominal rate band: **10.3%-18.3%**.
- O3 estimated all-in APR band: **11.3%-20.9%**, using processing fee assumption **0.8%-1.3%** plus GST.
- O4 recommended EMI ceiling: **₹20,800 / month**.
- Product route: **Loan against property / secured business borrowing**.
- Stress scenario/result: **25% income stress on Loan against property / secured business borrowing** -> **fails**, post-EMI surplus -₹17,050.
- Confidence: **medium** (69%). Unknowns: credit score is unknown or thin-file; recent repayment behaviour is unknown; exact lender fee/offer is not entered.

### Tenure Trade-Off

| Tenure months | EMI | Approx total interest | Status |
| --- | --- | --- | --- |
| 60 | ₹29,200 | ₹6,08,900 | Above safe ceiling |
| 120 | ₹20,800 | ₹13,53,300 | Within safe ceiling |
| 180 | ₹18,600 | ₹22,12,000 | Within safe ceiling |

### Full Negotiation Card Content

Borrower summary: Ravi, age 42, Mysuru - Loan against property / secured business borrowing
Recommendation: Borrow less. I should negotiate around ₹11,40,000 and keep EMI at or below ₹20,790 / month.
Amount to ask for: ₹11,40,000
Safe amount: ₹0-₹19,00,000
Lender-likely range: ₹10,00,000-₹29,30,000
Fair nominal rate: 10.3%-18.3%
Estimated all-in APR: 11.3%-20.9%
Maximum EMI: ₹20,800 / month
Tenure band: 60-180 months
Evidence:
  - Co-applicant support counted partly: Half of the available co-applicant income is counted because repayment support was explicitly marked as available.
  - Business income separated from documents: Reported cash flow and ITR income are not treated as identical evidence; documentation supports lender comfort while the safe view keeps volatility haircuts.
  - Secured route is worth comparing: The requested amount is modest relative to unencumbered property value, so a LAP-style route may price better than unsecured business credit while still needing serviceability checks.
  - Collateral checked with LTV: Collateral can improve the product route, but it only caps the possible loan and does not replace cash-flow serviceability.
Warnings:
  - No prior formal-loan history is handled as uncertainty, not as a score of zero.
  - After a 25% income stress and the safe EMI, monthly surplus is -17050 before discretionary spending. The card also reminds the borrower to ask how a floating-rate reset could change EMI or tenure.
  - The request needs a lower EMI, lower amount or safer structure because the stress case leaves no surplus.
Stress: 25% income stress on Loan against property / secured business borrowing: fails, post-EMI surplus -₹17,050.
Quote comparison: No lender quote entered.
Script: Please show me the Key Facts Statement with all-in APR, processing fee, tenure and EMI before I accept this offer.

## Anita

### Questions Asked By Adaptive Path

- Loan need: Purpose, amount and product intent decide the route, tenure and whether projected income should be ignored or only shown as upside.
- Borrower profile: Age and income type decide which affordability and stress rules apply.
- Income detail: Income is assessed differently for salary, business cash flow and informal variable income.
- Current outflow: Existing EMIs, rent and essentials are subtracted before recommending a safe EMI.
- Credit behaviour: Known score can narrow pricing. Unknown or thin-file widens the band but is not treated as bad credit.
- Lender offer: Optional quote details power the fair-band and APR comparison on the Negotiation Card.

### Fixture Answers

- Age/city: 35, Hubballi
- Requested amount: ₹1,50,000
- Purpose: vehicle_for_income
- Product intent: not_sure
- Income type: informal
- Credit score: unknown
- Recent missed payment: yes

### Engine Output

- O1 verdict: **Don't borrow**. Variable income, active high-cost debt and a recent bounce make another unsecured commitment unsafe until the current debt is restructured or stabilized.
- O2 lender-likely sanction range: **₹0-₹1,50,000**.
- O2 borrower-safe carrying range: **₹0**.
- Amount to use in negotiation: **₹0**.
- O3 fair nominal rate band: **12.6%-34.2%**.
- O3 estimated all-in APR band: **14.7%-43.7%**, using processing fee assumption **1.0%-2.0%** plus GST.
- O4 recommended EMI ceiling: **₹0 / month**.
- Product route: **Two-wheeler / vehicle finance**.
- Stress scenario/result: **30% income stress on Two-wheeler / vehicle finance** -> **fails**, post-EMI surplus -₹13,260.
- Confidence: **high** (86%). Unknowns: credit score is unknown or thin-file.

### Tenure Trade-Off

| Tenure months | EMI | Approx total interest | Status |
| --- | --- | --- | --- |
| 12 | ₹14,900 | ₹29,200 | Above safe ceiling |
| 36 | ₹6,700 | ₹91,800 | Above safe ceiling |
| 60 | ₹5,200 | ₹1,64,800 | Above safe ceiling |

### Full Negotiation Card Content

Borrower summary: Anita, age 35, Hubballi - Two-wheeler / vehicle finance
Recommendation: Don't borrow. I should not take a new loan until monthly headroom improves.
Amount to ask for: ₹0
Safe amount: ₹0
Lender-likely range: ₹0-₹1,50,000
Fair nominal rate: 12.6%-34.2%
Estimated all-in APR: 14.7%-43.7%
Maximum EMI: ₹0 / month
Tenure band: 12-60 months
Evidence:
  - Variable income uses the lower end: The safe view leans on the recent low-income month instead of assuming the best month repeats.
  - Vehicle finance before unsecured debt: Because the scooter could support income, the app compares a vehicle route instead of assuming high-cost unsecured borrowing is the only choice.
  - High confidence: The estimate is wider because credit score is unknown or thin-file.
  - Unknown score widens the band: Because the score is unknown, the estimate uses a wider range instead of treating the borrower as bad credit.
Warnings:
  - The safe view leans on the recent low-income month instead of assuming the best month repeats.
  - Because the score is unknown, the estimate uses a wider range instead of treating the borrower as bad credit.
  - A recent bounce can increase pricing and, more importantly, can make another loan unsafe.
  - Existing short-term debt at high rates widens pricing and pushes the recommendation toward debt repair first.
Stress: 30% income stress on Two-wheeler / vehicle finance: fails, post-EMI surplus -₹13,260.
Quote comparison: Offer APR 41.8%. This quote is broadly within the estimated fair band, subject to final KFS checks.
Script: I should not accept a new loan now. I should first reduce high-cost debt, rebuild payment headroom and then reassess the scooter finance.

