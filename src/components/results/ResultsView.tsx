import type { ReactNode } from 'react';
import { AlertTriangle, BadgeIndianRupee, CheckCircle2, Gauge, ShieldCheck, TrendingUp } from 'lucide-react';
import type { AssessmentResult, Confidence, Reason, Severity } from '../../domain/types';
import { productLabels } from '../../domain/rules';
import { formatMoneyRange, formatMonthly, formatRateRange, formatRupees } from '../../lib/currency';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

function toneForVerdict(result: AssessmentResult): 'positive' | 'warning' | 'critical' {
  if (result.verdict === 'borrow') return 'positive';
  if (result.verdict === 'borrow_less') return 'warning';
  return 'critical';
}

function severityLabel(severity: Severity): string {
  if (severity === 'positive') return 'Helpful';
  if (severity === 'neutral') return 'Note';
  if (severity === 'warning') return 'Caution';
  return 'Important';
}

function confidenceTone(level: Confidence): 'positive' | 'neutral' | 'warning' {
  if (level === 'high') return 'positive';
  if (level === 'medium') return 'neutral';
  return 'warning';
}

function OutcomeCard({ title, value, helper, icon, tone = 'default' }: { title: string; value: string; helper: string; icon: ReactNode; tone?: 'default' | 'critical' }) {
  return (
    <Card className={`min-h-[160px] ${tone === 'critical' ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7f3ef] text-mint">{icon}</div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-ink">{value}</p>
      <p className="mt-2 text-sm leading-5 text-slate-600">{helper}</p>
    </Card>
  );
}

function ReasonsList({ reasons }: { reasons: Reason[] }) {
  return (
    <div className="grid gap-3">
      {reasons.slice(0, 12).map((item) => (
        <details key={`${item.code}-${item.title}`} className="rounded-lg border border-[#dce7e2] bg-white p-4 open:shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
            <span>{item.title}</span>
            <Badge tone={item.severity}>{severityLabel(item.severity)}</Badge>
          </summary>
          <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
          <p className="mt-2 text-xs text-slate-500">Rules: {item.rulesUsed.join(', ')}</p>
        </details>
      ))}
    </div>
  );
}

function recommendedOutput(result: AssessmentResult): { value: string; helper: string; tone?: 'critical' } {
  if (result.verdict === 'dont_borrow') {
    return {
      value: `${formatRupees(0)} recommended`,
      helper: 'Recommended now: do not take a new loan. Current cash flow does not support a new recurring EMI safely.',
      tone: 'critical'
    };
  }
  if (result.verdict === 'borrow_less') {
    return {
      value: result.capacity.recommendedAmountRange ? formatMoneyRange(result.capacity.recommendedAmountRange) : formatRupees(result.capacity.recommendedAmount),
      helper: `You asked for ${formatRupees(result.answers.requestedAmount)}. Use the reduced borrower-safe amount in negotiation.`
    };
  }
  return {
    value: formatRupees(result.capacity.recommendedAmount),
    helper: 'The requested amount fits the borrower-safe checks, subject to final lender terms.'
  };
}

function safeEmiText(result: AssessmentResult): { value: string; helper: string; tone?: 'critical' } {
  if (result.verdict === 'dont_borrow') {
    return {
      value: 'No new EMI',
      helper: 'Your current income and obligations do not safely support another recurring EMI right now.',
      tone: 'critical'
    };
  }
  return {
    value: formatMonthly(result.capacity.recommendedEmi),
    helper: result.negotiationCard.stressLine
  };
}

function EmergencyOnlyPanel({ result }: { result: AssessmentResult }) {
  if (result.verdict !== 'dont_borrow') return null;
  const amount = result.capacity.emergencyOnlyAmountRange;
  const emi = result.capacity.emergencyOnlyEmiRange;
  return (
    <Card className="border-amber-200 bg-amber-50">
      <h3 className="text-xl font-semibold text-ink">If borrowing is unavoidable</h3>
      {amount && emi ? (
        <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
          <p><strong>Emergency-only ceiling:</strong> {formatMoneyRange(amount)}</p>
          <p><strong>Emergency-only EMI:</strong> {formatMonthly(emi.max)}</p>
          <p>This is not a recommended loan amount. It is only a strict ceiling if the borrower has no safer alternative and can access a lower-cost product.</p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-700">No additional loan is currently supportable from the information provided.</p>
      )}
    </Card>
  );
}

function PricingPanel({ result }: { result: AssessmentResult }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <TrendingUp className="mt-1 text-mint" aria-hidden />
        <div>
          <h3 className="text-xl font-semibold text-ink">Pricing view</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">Interest rate is the lender's stated rate. Estimated APR is the all-in annual cost after upfront fees.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-[#dce7e2] p-4">
          <p className="text-sm font-semibold text-slate-600">Borrower-friendly target</p>
          <p className="mt-1 text-lg font-semibold text-ink">{formatRateRange(result.pricing.borrowerFairRate)}</p>
          <p className="mt-1 text-sm text-slate-600">Estimated APR {formatRateRange(result.pricing.borrowerFairApr)}</p>
        </div>
        <div className="rounded-lg border border-[#dce7e2] p-4">
          <p className="text-sm font-semibold text-slate-600">Likely market range</p>
          <p className="mt-1 text-lg font-semibold text-ink">{formatRateRange(result.pricing.marketPossibleRate)}</p>
          <p className="mt-1 text-sm text-slate-600">Estimated APR {formatRateRange(result.pricing.marketPossibleApr)}</p>
        </div>
        <div className="rounded-lg border border-[#dce7e2] p-4">
          <p className="text-sm font-semibold text-slate-600">Avoid above</p>
          <p className="mt-1 text-lg font-semibold text-ink">{result.pricing.avoidAboveApr.toFixed(1)}% APR</p>
          <p className="mt-1 text-sm text-slate-600">A high market quote is not automatically fair for the borrower.</p>
        </div>
      </div>
      {result.verdict === 'dont_borrow' && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-900">Pricing is not an endorsement to borrow. The main recommendation is still no new loan right now.</p>
      )}
    </Card>
  );
}

export function ResultsView({ result }: { result: AssessmentResult }) {
  const topReasons = result.reasons.filter((item) => item.affects.includes('verdict')).slice(0, 4);
  const upsideReason = result.reasons.find((item) => item.code === 'UPSIDE_NOT_GUARANTEED');
  const recommended = recommendedOutput(result);
  const emi = safeEmiText(result);
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-xl border border-[#dce7e2] bg-white p-5 shadow-soft md:grid-cols-[1.4fr_1fr]">
        <div>
          <Badge tone={toneForVerdict(result)}>{result.verdictLabel}</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-normal text-ink">{result.verdict === 'dont_borrow' ? 'Recommended now: do not take a new loan.' : result.topReason}</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{result.verdict === 'dont_borrow' ? result.topReason : 'Use the borrower-safe number in negotiation. The lender-likely range estimates what may be sanctioned; it is not automatically what is healthy to carry.'}</p>
        </div>
        <div className="rounded-lg bg-[#f3f8f6] p-4">
          <p className="text-sm font-semibold text-slate-600">Recommended product route</p>
          <p className="mt-2 text-xl font-semibold text-ink">{productLabels[result.product.recommendedProduct]}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{result.product.reasons[0]?.detail ?? 'The route follows the chosen product and borrower profile.'}</p>
        </div>
      </section>

      {upsideReason && (
        <Card className="border-river/25 bg-[#f2f7fb]">
          <p className="text-sm font-semibold text-river">{upsideReason.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{upsideReason.detail}</p>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Outcome cards">
        <OutcomeCard title="Borrowing decision" value={result.verdictLabel} helper={result.nextAction} icon={result.verdict === 'borrow' ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />} tone={result.verdict === 'dont_borrow' ? 'critical' : 'default'} />
        <OutcomeCard title="Recommended new borrowing" value={recommended.value} helper={recommended.helper} icon={<BadgeIndianRupee size={22} />} tone={recommended.tone ?? 'default'} />
        <OutcomeCard title="Likely lender sanction" value={formatMoneyRange(result.lender.amountRange)} helper={result.verdict === 'dont_borrow' ? 'A lender may still approve this. Approval does not mean the repayment is safe.' : `Borrower-safe range: ${formatMoneyRange(result.safe.amountRange)}.`} icon={<ShieldCheck size={22} />} />
        <OutcomeCard title="Recommended new EMI" value={emi.value} helper={emi.helper} icon={<Gauge size={22} />} tone={emi.tone ?? 'default'} />
      </section>

      <EmergencyOnlyPanel result={result} />
      <PricingPanel result={result} />

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-mint" aria-hidden />
            <div>
              <h3 className="text-xl font-semibold text-ink">Confidence: {result.confidence.level}</h3>
              <p className="text-sm text-slate-600">Score {Math.round(result.confidence.score * 100)}%. Lower confidence widens money and rate bands.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {Object.entries(result.confidence.byOutput).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-[#dce7e2] p-3 text-sm">
                <span className="capitalize text-slate-600">{key.replace(/([A-Z])/g, ' $1')}</span>
                <Badge tone={confidenceTone(value)}>{value}</Badge>
              </div>
            ))}
          </div>
          {result.confidence.loweredBy.length > 0 && (
            <div className="mt-4 rounded-lg bg-[#f8fbfa] p-4">
              <p className="text-sm font-semibold text-ink">What lowered confidence</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {result.confidence.loweredBy.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
          {result.confidence.tightenQuestions.length > 0 && (
            <div className="mt-4 rounded-lg border border-[#dce7e2] p-4">
              <p className="text-sm font-semibold text-ink">Answer these to tighten the estimate</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {result.confidence.tightenQuestions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-ink">Top reasons</h3>
          <div className="mt-4 grid gap-3">
            {topReasons.map((item) => (
              <div key={item.code} className="rounded-lg bg-[#f8fbfa] p-4">
                <div className="flex items-center justify-between gap-3"><p className="font-semibold text-ink">{item.title}</p><Badge tone={item.severity}>{severityLabel(item.severity)}</Badge></div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <h3 className="text-xl font-semibold text-ink">Tenure trade-off</h3>
        {result.tenureOptions.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">No tenure is recommended while the borrowing decision is "Don't borrow." If an emergency-only ceiling appears, treat it as a strict fallback, not a target.</p>
        ) : (
          <>
            <p className="mt-1 text-sm leading-6 text-slate-600">Longer tenure lowers EMI but increases total interest. Breach is checked against your recommended new EMI ceiling.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-[#dce7e2] text-slate-600"><tr><th className="py-2">Tenure</th><th>EMI</th><th>Total interest</th><th>Status</th></tr></thead>
                <tbody>
                  {result.tenureOptions.map((option) => (
                    <tr key={option.months} className="border-b border-[#eef4f1]">
                      <td className="py-3 font-semibold text-ink">{option.months} months</td>
                      <td>{formatRupees(option.emi)}</td>
                      <td>{formatRupees(option.totalInterest)}</td>
                      <td><Badge tone={option.breachesSafeCeiling ? 'warning' : 'positive'}>{option.breachesSafeCeiling ? 'Above ceiling' : 'Within ceiling'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card>
        <h3 className="text-xl font-semibold text-ink">Explain the numbers</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">Each explanation points to the inputs and rule IDs behind material outputs.</p>
        <div className="mt-4"><ReasonsList reasons={result.reasons} /></div>
      </Card>
    </div>
  );
}
