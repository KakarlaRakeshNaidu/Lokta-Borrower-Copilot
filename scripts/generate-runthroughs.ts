import { writeFileSync } from 'node:fs';
import type { AssessmentResult, BorrowerAnswers } from '../src/domain/types';
import { anita, priya, ravi } from '../src/domain/fixtures/personas';
import { assessBorrower } from '../src/domain/engine/assessmentEngine';
import { applicableSteps } from '../src/features/assessment/questions';
import { productLabels } from '../src/domain/rules';
import { formatMoneyRange, formatMonthly, formatRateRange, formatRupees } from '../src/lib/currency';

const personas: Array<[string, BorrowerAnswers]> = [
  ['Priya', priya],
  ['Ravi', ravi],
  ['Anita', anita]
];

function knownText(value: BorrowerAnswers['creditScore']): string {
  if (value.status === 'known') return String(value.value);
  if (value.status === 'thin_file') return 'thin-file / no prior formal loan';
  return 'unknown';
}

function inputSummary(answers: BorrowerAnswers): string[] {
  const rows = [
    `Age/city: ${answers.age}, ${answers.city}`,
    `Requested amount: ${formatRupees(answers.requestedAmount)}`,
    `Purpose: ${answers.loanPurpose}`,
    `Product intent: ${answers.productIntent}`,
    `Income type: ${answers.incomeType}`,
    `Credit score: ${knownText(answers.creditScore)}`,
    `Recent missed payment: ${answers.recentMissedPayment}`
  ];
  return rows;
}

function card(result: AssessmentResult): string {
  const c = result.negotiationCard;
  const warningLines = c.warnings.length ? c.warnings.map((item) => `  - ${item}`).join('\n') : '  - None material beyond standard KFS checks.';
  const offer = c.offerComparison ? `Offer APR ${c.offerComparison.apr.toFixed(1)}%. ${c.offerComparison.message}` : 'No lender quote entered.';
  return `Borrower summary: ${c.borrowerSummary}
Recommendation: ${c.recommendation}
Amount to ask for: ${formatRupees(c.amountToAskFor)}
Safe amount: ${formatMoneyRange(c.safeAmountRange)}
Lender-likely range: ${formatMoneyRange(c.lenderLikelyRange)}
Fair nominal rate: ${formatRateRange(c.fairRate)}
Estimated all-in APR: ${formatRateRange(c.apr)}
Maximum EMI: ${formatMonthly(c.maxEmi)}
Tenure band: ${c.tenureBand.min}-${c.tenureBand.max} months
Evidence:
${c.evidenceBullets.map((item) => `  - ${item}`).join('\n')}
Warnings:
${warningLines}
Stress: ${c.stressLine}
Quote comparison: ${offer}
Script: ${c.script}`;
}

function section(name: string, answers: BorrowerAnswers): string {
  const result = assessBorrower(answers);
  const asked = applicableSteps(answers).map((step) => `- ${step.title}: ${step.helper}`).join('\n');
  const tenureRows = result.tenureOptions.map((option) => `| ${option.months} | ${formatRupees(option.emi)} | ${formatRupees(option.totalInterest)} | ${option.breachesSafeCeiling ? 'Above safe ceiling' : 'Within safe ceiling'} |`).join('\n');
  return `## ${name}

### Questions Asked By Adaptive Path

${asked}

### Fixture Answers

${inputSummary(answers).map((item) => `- ${item}`).join('\n')}

### Engine Output

- O1 verdict: **${result.verdictLabel}**. ${result.topReason}
- O2 lender-likely sanction range: **${formatMoneyRange(result.lender.amountRange)}**.
- O2 borrower-safe carrying range: **${formatMoneyRange(result.safe.amountRange)}**.
- Amount to use in negotiation: **${formatRupees(result.negotiationCard.amountToAskFor)}**.
- O3 fair nominal rate band: **${formatRateRange(result.pricing.nominalRate)}**.
- O3 estimated all-in APR band: **${formatRateRange(result.pricing.apr)}**, using processing fee assumption **${formatRateRange(result.pricing.feePct)}** plus GST.
- O4 recommended EMI ceiling: **${formatMonthly(result.safeMonthlyEmi)}**.
- Product route: **${productLabels[result.product.recommendedProduct]}**.
- Stress scenario/result: **${result.stress.label}** -> **${result.stress.status}**, post-EMI surplus ${formatRupees(result.stress.postEmiSurplus)}.
- Confidence: **${result.confidence.level}** (${Math.round(result.confidence.score * 100)}%). Unknowns: ${result.confidence.loweredBy.length ? result.confidence.loweredBy.join('; ') : 'none material'}.

### Tenure Trade-Off

| Tenure months | EMI | Approx total interest | Status |
| --- | --- | --- | --- |
${tenureRows}

### Full Negotiation Card Content

${card(result)}
`;
}

const md = `# Borrower Run-Throughs

Generated from the current engine with \`npm run docs:runthroughs\`. Do not edit persona numbers here by hand; update fixtures or rules and regenerate.

${personas.map(([name, answers]) => section(name, answers)).join('\n')}
`;

writeFileSync('RUNTHROUGHS.md', md);
console.log('Wrote RUNTHROUGHS.md for Priya, Ravi and Anita.');