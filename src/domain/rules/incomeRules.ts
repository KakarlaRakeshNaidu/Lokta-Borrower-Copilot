import type { EmployerStability } from '../types';

export const salariedIncomeMultipliers: Record<EmployerStability, { lenderMin: number; lenderMax: number; safeMin: number; safeMax: number }> = {
  large_stable: { lenderMin: 0.98, lenderMax: 1, safeMin: 0.93, safeMax: 0.98 },
  stable: { lenderMin: 0.95, lenderMax: 1, safeMin: 0.9, safeMax: 0.96 },
  new_or_probation: { lenderMin: 0.85, lenderMax: 0.95, safeMin: 0.78, safeMax: 0.9 },
  unknown: { lenderMin: 0.9, lenderMax: 1, safeMin: 0.84, safeMax: 0.94 }
};

export const selfEmployedRules = {
  documentedIncomeWeight: 0.9,
  reportedCashLenderMin: 0.45,
  reportedCashLenderMax: 0.7,
  reportedCashSafeMin: 0.65,
  reportedCashSafeMax: 0.85,
  establishedBusinessBoost: 0.05,
  cashHeavyPenalty: 0.1
};

export const informalRules = {
  lenderLowMultiplier: 0.55,
  lenderHighMultiplier: 0.7,
  safeLowMultiplier: 0.7,
  safeHighMultiplier: 0.85
};