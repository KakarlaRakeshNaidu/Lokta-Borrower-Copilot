import type { MoneyRange, RateRange } from '../domain/types';

const rupee = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

export function formatRupees(value: number): string {
  return rupee.format(Math.round(Number.isFinite(value) ? value : 0));
}

export function formatMonthly(value: number): string {
  return `${formatRupees(value)} / month`;
}

export function formatMoneyRange(range: MoneyRange): string {
  if (Math.round(range.min) === Math.round(range.max)) return formatRupees(range.max);
  return `${formatRupees(range.min)}-${formatRupees(range.max)}`;
}

export function formatLakh(value: number): string {
  const lakh = value / 100_000;
  if (lakh >= 1) return `₹${lakh.toFixed(lakh >= 10 ? 1 : 2)} lakh`;
  return formatRupees(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatRateRange(range: RateRange): string {
  if (range.min.toFixed(1) === range.max.toFixed(1)) return formatPercent(range.max);
  return `${formatPercent(range.min)}-${formatPercent(range.max)}`;
}