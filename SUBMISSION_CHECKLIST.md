# Submission Checklist

## Product Outcomes

- [x] O1 verdict supports Borrow, Borrow less and Don't borrow.
- [x] Don't borrow is reachable through Anita's real debt-stacking/safe-EMI rules.
- [x] O2 lender-likely sanction range is separate from borrower-safe carrying range.
- [x] O3 fair nominal rate band and all-in APR band are shown.
- [x] O4 safe EMI ceiling, tenure trade-off and stress case are shown.
- [x] Negotiation Card includes recommendation, amount, APR, EMI, reasons, warnings, stress and lender quote comparison.

## Question Design

- [x] Mobile-first welcome and adaptive assessment flow.
- [x] Roughly 8-10 logical question groups on the common path.
- [x] Salaried, self-employed and informal branches differ.
- [x] Unknown answers are explicit and tested.
- [x] Additional/adaptive steps declare affected outputs.

## India And Domain

- [x] Indian rupee formatting and digit grouping.
- [x] FOIR-style affordability.
- [x] APR/KFS concept grounded in RBI source.
- [x] Product routing for personal, business, LAP, home, gold and vehicle routes.
- [x] Ravi routes to a secured/LAP-style comparison when property collateral is usable.
- [x] Anita's productive scooter idea is acknowledged without counting projected income as guaranteed.

## Engineering

- [x] React + TypeScript + Vite.
- [x] Tailwind CSS and small accessible UI primitives.
- [x] React Hook Form + Zod validation.
- [x] Deterministic rules separated from UI.
- [x] EMI, inverse principal and APR calculations are pure and tested.
- [x] No backend, database, login, bureau pull, analytics or borrower data storage.

## Root Deliverables

- [x] `README.md`
- [x] `RULES.md`
- [x] `RUNTHROUGHS.md`
- [x] `WALKTHROUGH.md`
- [x] `INTERVIEW_PREP.md`
- [x] `SUBMISSION_CHECKLIST.md`
- [x] `AGENTS.md`
- [x] `package.json`

## Verification Commands

- [x] `npm run docs:rules`
- [x] `npm run docs:runthroughs`
- [x] `npm run validate:rules`
- [x] `npm run privacy:check`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run build`
- [x] `npm run test:e2e`

## Final Audit

- [x] No placeholder/lorem ipsum copy.
- [x] No production console logging in `src/`.
- [x] No `localStorage` or `sessionStorage` usage in `src/`.
- [x] Rule IDs in code are covered by `RULES.md`.
- [x] Run-through numbers are generated from the current engine.