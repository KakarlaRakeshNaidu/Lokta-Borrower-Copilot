# Five-Minute Walkthrough Script

## 1. Problem

Borrowers often hear the lender's number first: sanctioned amount, rate, fee and EMI. Borrower Copilot flips that. It gives the borrower a safe number before a lender gives theirs.

## 2. Demo Flow

Start on the welcome screen. Point out: no login, no bureau pull, no backend, answers stay in current browser memory.

Click `Try a sample borrower`, then Priya. The first screen shows four outputs: verdict, lender-likely versus borrower-safe amount, fair rate/APR and safe EMI.

Open the Negotiation Card. This is what the borrower can use during a lender call: amount to ask for, fair band, APR band, max EMI, reasons, warnings, stress result and a short script.

## 3. Architecture / Rules

Open `src/domain/rules`. Explain that all material numbers live there: income haircuts, FOIR assumptions, safe buffers, rate bands, fees, LTV, stress and verdict red flags.

Open `src/domain/engine/assessmentEngine.ts`. It composes pure functions. React does not calculate the loan decision.

## 4. Borrower Example

Priya has strong salary and score, so lender-likely amount is high. But rent, existing car EMI, wedding purpose and stress headroom make the borrower-safe negotiation amount lower. The quote comparison warns her if a lender offer is above the fair APR band.

Ravi has business income and unencumbered shop property. The route changes toward LAP-style secured borrowing, but serviceability and documentation still limit the safe amount.

Anita has a productive scooter idea, but current app debt, a recent bounce and fragile household cash flow make new borrowing unsafe now. The app says Don't borrow and explains what would need to improve before reassessment.

## 5. Uncertainty And Explainability

Unknown data does not become zero. It lowers confidence and widens ranges. Every major number has an explanation with rule ids and inputs used.

## 6. What I Would Build Next

- Consent-based bank-statement ingestion to verify cash flow.
- Bureau integration with explicit borrower consent.
- Lender-specific policy packs for FOIR/rate/fee calibration.
- Richer market-rate data refresh.
- Hindi/Kannada and other Indian-language support.
- Optional encrypted saved assessments with explicit consent.
- Calibration against real offers and outcomes.

## 7. What I Intentionally Cut

- ML credit model.
- Login/database.
- Fake lender integrations.
- Runtime LLM dependency.
- KYC or bureau pull.
- Twenty-plus loan products.
- Pixel-perfect marketing pages.

The controlled scope is the point: deterministic, explainable, editable borrower-side guidance.