import { ExternalLink } from 'lucide-react';
import { ruleCatalog } from '../../domain/rules';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function Methodology() {
  return (
    <div className="grid gap-5">
      <Card>
        <h2 className="text-2xl font-semibold text-ink">Assumptions and methodology</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Borrower Copilot is a deterministic borrower-side estimate. It uses voluntary answers, public anchors and judgement rules. It does not pull a bureau report, verify bank statements, promise sanction or store personal answers.</p>
      </Card>
      <div className="grid gap-3">
        {ruleCatalog.map((rule) => (
          <details key={rule.id} className="rounded-lg border border-[#dce7e2] bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink">{rule.label}</span>
              <Badge tone={rule.sourceType === 'source' ? 'positive' : 'neutral'}>{rule.sourceType === 'source' ? 'source' : 'My judgement'}</Badge>
            </summary>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
              <p><strong>Value:</strong> {rule.value}</p>
              <p><strong>Why:</strong> {rule.why}</p>
              <p><strong>Where used:</strong> {rule.usedIn.join(', ')}</p>
              {rule.sourceUrl && <a className="inline-flex items-center gap-1 font-semibold text-river underline" href={rule.sourceUrl} target="_blank" rel="noreferrer">{rule.sourceLabel}<ExternalLink size={14} /></a>}
              {!rule.sourceUrl && <p><strong>Source:</strong> {rule.sourceLabel}</p>}
              <p className="text-xs text-slate-500">Rule id: {rule.id}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}