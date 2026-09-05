import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'positive' | 'neutral' | 'warning' | 'critical' }>) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
      tone === 'positive' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
      tone === 'neutral' && 'border-slate-200 bg-slate-50 text-slate-700',
      tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-800',
      tone === 'critical' && 'border-red-200 bg-red-50 text-red-800'
    )}>{children}</span>
  );
}