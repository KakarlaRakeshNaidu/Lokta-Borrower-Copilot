import type { MoneyRange, RateRange } from '../types';

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
export const floorZero = (value: number): number => (Number.isFinite(value) ? Math.max(0, value) : 0);

export function normalizeRange(range: MoneyRange): MoneyRange {
  const min = Number.isFinite(range.min) ? range.min : 0;
  const max = Number.isFinite(range.max) ? range.max : min;
  return min <= max ? { min, max } : { min: max, max: min };
}

export function normalizeRateRange(range: RateRange): RateRange {
  const min = Number.isFinite(range.min) ? Math.max(0, range.min) : 0;
  const max = Number.isFinite(range.max) ? Math.max(0, range.max) : min;
  return min <= max ? { min, max } : { min: max, max: min };
}

export function widenMoneyRange(range: MoneyRange, factor: number): MoneyRange {
  const clean = normalizeRange(range);
  const mid = (clean.min + clean.max) / 2;
  const half = Math.max(0, (clean.max - clean.min) / 2) * factor;
  return { min: floorZero(mid - half), max: floorZero(mid + half) };
}

export function widenRateRange(range: RateRange, points: number): RateRange {
  const clean = normalizeRateRange(range);
  return { min: Math.max(0, clean.min - points), max: Math.max(clean.min, clean.max + points) };
}

export function roundMoney(value: number, nearest = 100): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value / nearest) * nearest;
}

export function borrowerMoneyRoundingUnit(maxValue: number): number {
  if (maxValue < 100_000) return 5_000;
  if (maxValue < 1_000_000) return 10_000;
  if (maxValue < 5_000_000) return 50_000;
  return 100_000;
}

export function roundMoneyRange(range: MoneyRange, nearest = 10_000): MoneyRange {
  const clean = normalizeRange(range);
  return { min: roundMoney(clean.min, nearest), max: Math.max(roundMoney(clean.max, nearest), roundMoney(clean.min, nearest)) };
}

export function roundBorrowerMoneyRange(range: MoneyRange): MoneyRange {
  const clean = normalizeRange(range);
  return roundMoneyRange(clean, borrowerMoneyRoundingUnit(clean.max));
}

export function roundRate(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function roundRateRange(range: RateRange, decimals = 1): RateRange {
  const clean = normalizeRateRange(range);
  const rounded = { min: roundRate(clean.min, decimals), max: roundRate(clean.max, decimals) };
  return normalizeRateRange(rounded);
}
