import { Copy, Printer } from 'lucide-react';
import type { AssessmentResult } from '../../domain/types';
import { formatMoneyRange, formatMonthly, formatRateRange, formatRupees } from '../../lib/currency';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

function emergencyLine(result: AssessmentResult): string {
  const range = result.capacity.emergencyOnlyAmountRange;
  const emi = result.capacity.emergencyOnlyEmiRange;
  if (range && emi) return `Emergency-only ceiling: ${formatMoneyRange(range)} at up to ${formatMonthly(emi.max)}. This is not recommended.`;
  if (result.verdict === 'dont_borrow') return 'If borrowing is unavoidable: no additional loan is currently supportable from the information provided.';
  return '';
}

function summaryText(result: AssessmentResult): string {
  const card = result.negotiationCard;
  return [
    `Borrower Copilot - ${card.borrowerSummary}`,
    `Recommendation: ${card.recommendation}`,
    `Recommended new borrowing: ${formatRupees(card.recommendedAmount)}`,
    emergencyLine(result),
    `Borrower-safe amount: ${formatMoneyRange(card.safeAmountRange)}; lender-likely: ${formatMoneyRange(card.lenderLikelyRange)}`,
    `Borrower-friendly rate: ${formatRateRange(card.fairRate)}; estimated APR: ${formatRateRange(card.apr)}; avoid above ${card.avoidAboveApr.toFixed(1)}% APR`,
    `Likely market rate: ${formatRateRange(card.marketPossibleRate)}; market APR: ${formatRateRange(card.marketPossibleApr)}`,
    `Recommended new EMI: ${formatMonthly(card.maxEmi)}`,
    card.offerComparison ? `Quote verdict: ${card.offerComparison.label}. Offer APR ${card.offerComparison.apr.toFixed(1)}%. ${card.offerComparison.message}` : 'Quote verdict: no lender quote entered.',
    `Stress: ${card.stressLine}`,
    `Next step: ${card.script}`
  ].filter(Boolean).join('\n');
}

function recommendedAmountLabel(result: AssessmentResult): string {
  if (result.verdict === 'dont_borrow') return 'Recommended new borrowing';
  if (result.verdict === 'borrow_less') return 'Recommended reduced amount';
  return 'Recommended amount';
}

export function NegotiationCard({ result }: { result: AssessmentResult }) {
  const card = result.negotiationCard;
  const copy = async () => {
    await navigator.clipboard.writeText(summaryText(result));
  };
  return (
    <section className={`print-card mx-auto max-w-2xl rounded-xl border p-5 shadow-soft print:shadow-none ${result.verdict === 'dont_borrow' ? 'border-red-200 bg-red-50' : 'border-[#cfded8] bg-white'}`} aria-label="Negotiation Card">
      <div className="no-print mb-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={copy}><Copy size={17} /> Copy summary</Button>
        <Button type="button" onClick={() => window.print()}><Printer size={17} /> Print / Save as PDF</Button>
      </div>
      <div className={`rounded-lg border p-4 ${result.verdict === 'dont_borrow' ? 'border-red-200 bg-white' : 'border-[#dce7e2] bg-[#f8fbfa]'}`}>
        <p className={`text-sm font-semibold uppercase tracking-[0.08em] ${result.verdict === 'dont_borrow' ? 'text-red-700' : 'text-mint'}`}>Negotiation Card</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">{card.borrowerSummary}</h2>
        <p className="mt-3 text-sm font-semibold text-slate-600">Recommendation</p>
        <p className="mt-1 text-2xl font-semibold text-ink">{result.verdict === 'dont_borrow' ? "Don't borrow now" : result.verdictLabel}</p>
        <p className="mt-2 text-base leading-7 text-slate-700">{result.verdict === 'dont_borrow' ? result.topReason : card.recommendation}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {result.verdict === 'borrow_less' && (
          <div className="rounded-lg border border-[#dce7e2] bg-white p-4">
            <p className="text-sm font-semibold text-slate-600">You asked for</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatRupees(result.answers.requestedAmount)}</p>
            <p className="mt-1 text-sm text-slate-600">The safer amount is lower.</p>
          </div>
        )}
        <div className="rounded-lg border border-[#dce7e2] bg-white p-4">
          <p className="text-sm font-semibold text-slate-600">{recommendedAmountLabel(result)}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{formatRupees(card.recommendedAmount)}</p>
          <p className="mt-1 text-sm text-slate-600">{result.verdict === 'dont_borrow' ? 'This means no new loan is recommended right now.' : `Borrower-safe range ${formatMoneyRange(card.safeAmountRange)}.`}</p>
        </div>
        {result.verdict === 'dont_borrow' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-slate-700">If borrowing is unavoidable</p>
            {card.emergencyOnlyAmountRange && card.emergencyOnlyEmiRange ? (
              <>
                <p className="mt-1 text-xl font-semibold text-ink">{formatMoneyRange(card.emergencyOnlyAmountRange)}</p>
                <p className="mt-1 text-sm text-slate-700">Emergency EMI up to {formatMonthly(card.emergencyOnlyEmiRange.max)}. Not a recommended target.</p>
              </>
            ) : (
              <p className="mt-1 text-sm leading-6 text-slate-700">No additional loan is currently supportable from the information provided.</p>
            )}
          </div>
        )}
        <div className="rounded-lg border border-[#dce7e2] bg-white p-4">
          <p className="text-sm font-semibold text-slate-600">Likely lender sanction</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{formatMoneyRange(card.lenderLikelyRange)}</p>
          <p className="mt-1 text-sm text-slate-600">A lender may still approve this. Do not use it as your comfort number.</p>
        </div>
        <div className="rounded-lg border border-[#dce7e2] bg-white p-4">
          <p className="text-sm font-semibold text-slate-600">Recommended new EMI</p>
          <p className="mt-1 text-xl font-semibold text-ink">{result.verdict === 'dont_borrow' ? 'No new EMI' : formatMonthly(card.maxEmi)}</p>
          <p className="mt-1 text-sm text-slate-600">{result.verdict === 'dont_borrow' ? 'Current cash flow does not support another recurring EMI. Focus on clearing existing obligations first.' : `Tenure window ${card.tenureBand.min}-${card.tenureBand.max} months.`}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-lg border border-[#dce7e2] bg-white p-4">
          <p className="text-sm font-semibold text-ink">Pricing</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div><p className="text-xs font-semibold text-slate-500">Borrower-friendly</p><p className="mt-1 text-sm font-semibold text-ink">{formatRateRange(card.fairRate)}</p><p className="text-xs text-slate-600">APR {formatRateRange(card.apr)}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">Likely market</p><p className="mt-1 text-sm font-semibold text-ink">{formatRateRange(card.marketPossibleRate)}</p><p className="text-xs text-slate-600">APR {formatRateRange(card.marketPossibleApr)}</p></div>
            <div><p className="text-xs font-semibold text-slate-500">Avoid above</p><p className="mt-1 text-sm font-semibold text-ink">{card.avoidAboveApr.toFixed(1)}% APR</p><p className="text-xs text-slate-600">Fees can make APR high.</p></div>
          </div>
          {result.verdict === 'dont_borrow' && <p className="mt-3 text-sm leading-6 text-red-900">Pricing is not approval to borrow. The safety issue comes first.</p>}
        </div>

        {card.offerComparison && (
          <div className="rounded-lg border border-[#dce7e2] bg-white p-4">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-ink">Quote comparison</p><Badge tone={card.offerComparison.severity}>{card.offerComparison.label}</Badge></div>
            <p className="mt-1 text-sm leading-6 text-slate-700">Offer APR: {card.offerComparison.apr.toFixed(1)}%. {card.offerComparison.message}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-ink">Why</p>
          <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-700">
            {card.evidenceBullets.slice(0, 5).map((item) => <li key={item} className="rounded-lg bg-white p-3">{item}</li>)}
          </ul>
        </div>
        {card.warnings.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-ink">Watch-outs</p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-700">
              {card.warnings.slice(0, 4).map((item) => <li key={item} className="rounded-lg border border-amber-200 bg-amber-50 p-3">{item}</li>)}
            </ul>
          </div>
        )}
        <div className="rounded-lg border border-[#dce7e2] bg-white p-4">
          <p className="text-sm font-semibold text-ink">Stress test</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{card.stressLine}</p>
        </div>
        <div className="rounded-lg bg-ink p-4 text-white">
          <p className="text-sm font-semibold">Next step</p>
          <p className="mt-1 text-sm leading-6 text-white/90">{card.script}</p>
        </div>
      </div>
    </section>
  );
}
