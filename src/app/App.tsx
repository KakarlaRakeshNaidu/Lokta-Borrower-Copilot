import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpenText, ClipboardCheck, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import type { AssessmentResult, BorrowerAnswers } from '../domain/types';
import { assessBorrower } from '../domain/engine';
import { blankAnswers, demoPersonas, type DemoPersonaId } from '../domain/fixtures/personas';
import { productLabels } from '../domain/rules';
import { formatMoneyRange, formatMonthly, formatRateRange } from '../lib/currency';
import { Questionnaire } from '../components/questionnaire/Questionnaire';
import { ResultsView } from '../components/results/ResultsView';
import { NegotiationCard } from '../components/negotiation/NegotiationCard';
import { Methodology } from '../components/methodology/Methodology';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

type View = 'welcome' | 'questionnaire' | 'results' | 'card' | 'methodology';

const demoLabels: Record<DemoPersonaId, string> = {
  priya: 'Priya - salaried wedding loan',
  ravi: 'Ravi - business with property',
  anita: 'Anita - scooter with debt stress'
};

function useDemoFromQuery(loadDemo: (id: DemoPersonaId) => void) {
  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (demo === 'priya' || demo === 'ravi' || demo === 'anita') loadDemo(demo);
  }, [loadDemo]);
}

function Welcome({ onStart, onDemo }: { onStart: () => void; onDemo: (id: DemoPersonaId) => void }) {
  const preview = useMemo(() => assessBorrower(demoPersonas.priya), []);
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1.05fr_0.95fr] md:px-6 lg:py-10">
      <section className="flex min-h-[calc(100vh-7rem)] flex-col justify-center rounded-xl border border-[#dce7e2] bg-white p-6 shadow-soft md:p-8">
        <Badge tone="positive">No login. No bureau pull. In-memory answers.</Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-ink md:text-5xl">Know your safe number before a lender gives you theirs.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Borrower Copilot gives an Indian borrower a verdict, likely sanction range, borrower-safe amount, fair rate/APR band, EMI ceiling, stress case and Negotiation Card in about five minutes.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={onStart}>Check my borrowing position <ArrowRight size={18} /></Button>
          <Button variant="secondary" onClick={() => onDemo('priya')}>Try a sample borrower</Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            'Answers stay in this browser session only.',
            'Unknown answers widen ranges instead of becoming zero.',
            'Lender-likely and borrower-safe numbers are shown separately.',
            'APR includes estimated mandatory upfront fees.'
          ].map((item) => <div key={item} className="flex gap-2 rounded-lg bg-[#f4f8f6] p-3 text-sm text-slate-700"><ShieldCheck size={18} className="shrink-0 text-mint" />{item}</div>)}
        </div>
      </section>
      <aside className="grid content-center gap-4">
        <Card className="bg-[#14211f] text-white">
          <p className="text-sm font-semibold text-white/70">Sample result preview</p>
          <h2 className="mt-3 text-2xl font-semibold">{preview.verdictLabel}</h2>
          <div className="mt-5 grid gap-3">
            <div className="rounded-lg bg-white/10 p-3"><p className="text-xs text-white/60">Safe amount</p><p className="text-xl font-semibold">{formatMoneyRange(preview.safe.amountRange)}</p></div>
            <div className="rounded-lg bg-white/10 p-3"><p className="text-xs text-white/60">Fair rate / APR</p><p className="text-xl font-semibold">{formatRateRange(preview.pricing.nominalRate)} / {formatRateRange(preview.pricing.apr)}</p></div>
            <div className="rounded-lg bg-white/10 p-3"><p className="text-xs text-white/60">Safe EMI</p><p className="text-xl font-semibold">{formatMonthly(preview.safeMonthlyEmi)}</p></div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-ink">Load a built-in borrower</p>
          <div className="mt-3 grid gap-2">
            {(Object.keys(demoLabels) as DemoPersonaId[]).map((id) => <Button key={id} variant="secondary" onClick={() => onDemo(id)}>{demoLabels[id]}</Button>)}
          </div>
        </Card>
      </aside>
    </main>
  );
}

function TopNav({ view, setView, result, reset }: { view: View; setView: (view: View) => void; result: AssessmentResult | null; reset: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#dce7e2] bg-paper/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <button type="button" onClick={() => setView(result ? 'results' : 'welcome')} className="flex items-center gap-2 text-left font-semibold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white"><Sparkles size={18} /></span>
          Borrower Copilot
        </button>
        <nav className="flex flex-wrap gap-2" aria-label="Main navigation">
          {result && <Button variant={view === 'results' ? 'primary' : 'secondary'} onClick={() => setView('results')}><BookOpenText size={16} /> Results</Button>}
          {result && <Button variant={view === 'card' ? 'primary' : 'secondary'} onClick={() => setView('card')}><ClipboardCheck size={16} /> Card</Button>}
          <Button variant={view === 'methodology' ? 'primary' : 'secondary'} onClick={() => setView('methodology')}>Methodology</Button>
          <Button variant="ghost" onClick={reset}><RotateCcw size={16} /> Reset</Button>
        </nav>
      </div>
    </header>
  );
}

export function App() {
  const [answers, setAnswers] = useState<BorrowerAnswers>(() => blankAnswers());
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [view, setView] = useState<View>('welcome');

  const loadDemo = useCallback((id: DemoPersonaId) => {
    const nextAnswers = structuredClone(demoPersonas[id]);
    const nextResult = assessBorrower(nextAnswers);
    setAnswers(nextAnswers);
    setResult(nextResult);
    setView('results');
    window.history.replaceState(null, '', `?demo=${id}`);
  }, []);

  useDemoFromQuery(loadDemo);

  const startManual = () => {
    const blank = blankAnswers();
    setAnswers(blank);
    setResult(null);
    setView('questionnaire');
    window.history.replaceState(null, '', window.location.pathname);
  };

  const reset = () => {
    setAnswers(blankAnswers());
    setResult(null);
    setView('welcome');
    window.history.replaceState(null, '', window.location.pathname);
  };

  const complete = (next: BorrowerAnswers) => {
    const nextResult = assessBorrower(next);
    setAnswers(next);
    setResult(nextResult);
    setView('results');
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      {view !== 'welcome' && <TopNav view={view} setView={setView} result={result} reset={reset} />}
      {view === 'welcome' && <Welcome onStart={startManual} onDemo={loadDemo} />}
      {view === 'questionnaire' && <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6"><Questionnaire initialAnswers={answers} onComplete={complete} onCancel={reset} /></main>}
      {view === 'results' && result && <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6"><ResultsView result={result} /></main>}
      {view === 'card' && result && <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6"><NegotiationCard result={result} /></main>}
      {view === 'methodology' && <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6"><Methodology /></main>}
      {result && view !== 'card' && (
        <div className="pointer-events-none fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#cfded8] bg-white p-2 shadow-soft no-print">
          <span className="hidden px-2 text-sm text-slate-600 sm:inline">{productLabels[result.product.recommendedProduct]}</span>
          <Button className="pointer-events-auto" onClick={() => setView('card')}>Open Negotiation Card <ArrowRight size={16} /></Button>
        </div>
      )}
    </div>
  );
}