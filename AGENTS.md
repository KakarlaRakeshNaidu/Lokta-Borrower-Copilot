# Project Conventions

- Keep every material lending assumption in `src/domain/rules` and document the matching rule id in `RULES.md`.
- React components may format and explain results, but they must not calculate underwriting or affordability decisions.
- Missing borrower information must stay explicit as `unknown`; do not coerce it to zero.
- Use Indian rupee formatting helpers from `src/lib/currency.ts` for all displayed money.
- Run `npm run verify` before submission and regenerate `RUNTHROUGHS.md` with `npm run docs:runthroughs` after engine changes.