import { writeFileSync } from 'node:fs';
import { ruleCatalog } from '../src/domain/rules/ruleCatalog';

const today = 'September 4, 2026';
const esc = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');

const rows = ruleCatalog.map((rule) => {
  const source = rule.sourceUrl ? `[${esc(rule.sourceLabel)}](${rule.sourceUrl})` : esc(rule.sourceLabel);
  return `| ${rule.id}: ${esc(rule.label)} | ${esc(rule.value)} | ${esc(rule.why)} | ${rule.sourceType === 'judgement' ? 'My judgement' : source} | ${esc(rule.usedIn.join(', '))} |`;
});

const md = `# Borrower Copilot Rules

Research/access date for external links: ${today}.

This model is a borrower-side deterministic estimate. It does not claim to reproduce a lender underwriting policy, and it does not claim that RBI mandates a universal FOIR for all retail loans. Public sources are used as anchors; all borrower-protection thresholds that are not directly sourced are marked **My judgement**.

## Rule Catalog

| What / rule | Value or band | Why | Source or My judgement | Where used |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## APR Methodology

APR is computed from cash flows rather than by adding a fee percentage to the nominal rate. The app estimates net disbursal as principal minus upfront mandatory processing fee plus GST on that fee, then solves the monthly internal rate implied by the EMI stream and annualizes it. If a lender quote is entered, the quote comparison uses the quoted rate, fee, tenure and EMI. Late fees and contingent penalties are not included in the normal APR estimate.

## FOIR And Safety Methodology

Lender-like capacity uses an estimated fixed-obligation-to-income range by borrower profile and product. Borrower-safe capacity is separate: it takes the lower of a conservative obligation ratio and actual cash surplus after essential expenses, rent, existing EMIs and a monthly buffer. This is why a lender-likely sanction can be higher than the amount the borrower should safely carry.

## Unknown Data Treatment

Unknown information remains explicit. It lowers confidence and widens money/rate ranges where relevant. Unknown score does not become 0 or 300. Unknown existing EMIs become a bounded uncertainty range rather than silently becoming zero. Missing details from an irrelevant branch are ignored by the confidence model.

## What This Model Does Not Know

- No bureau report or complete repayment history.
- No verified bank statement, payroll, GST, UPI or cash-ledger validation.
- No lender-specific policy, bureau cut-off, internal scorecard or final credit decision.
- No KYC, fraud, collateral-title, valuation or legal verification.
- No exact statutory/stamp/third-party charges unless the borrower enters a quote.
- Market rates and lender fees change over time.
- It estimates education and negotiation posture; it does not approve, sanction, broker or advise as a regulated financial adviser.
`;

writeFileSync('RULES.md', md);
console.log(`Wrote RULES.md with ${ruleCatalog.length} rules.`);