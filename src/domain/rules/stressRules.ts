import type { IncomeType } from '../types';

export const incomeStressDropByType: Record<IncomeType, number> = {
  salaried: 0.2,
  self_employed: 0.25,
  informal: 0.3
};

export const floatingRateStressBps = 150;