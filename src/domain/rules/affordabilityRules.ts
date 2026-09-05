import type { IncomeType, ProductChoice } from '../types';

export type FoirBand = { min: number; max: number };

export const lenderFoirByIncome: Record<IncomeType, FoirBand> = {
  salaried: { min: 0.5, max: 0.6 },
  self_employed: { min: 0.45, max: 0.58 },
  informal: { min: 0.3, max: 0.45 }
};

export const lenderProductFoirCap: Record<ProductChoice, number> = {
  personal_loan: 0.6,
  unsecured_business: 0.55,
  loan_against_property: 0.6,
  home_loan: 0.55,
  gold_loan: 0.5,
  two_wheeler_vehicle: 0.45
};

export const safeFoirByIncome: Record<IncomeType, number> = {
  salaried: 0.32,
  self_employed: 0.28,
  informal: 0.22
};

export const emergencyFoirByIncome: Record<IncomeType, number> = {
  salaried: 0.24,
  self_employed: 0.2,
  informal: 0.14
};

export const bufferPctByIncome: Record<IncomeType, number> = {
  salaried: 0.2,
  self_employed: 0.25,
  informal: 0.18
};

export const emergencyBufferPctByIncome: Record<IncomeType, number> = {
  salaried: 0.12,
  self_employed: 0.14,
  informal: 0.16
};

export const minimumMonthlyBuffer = 5_000;
export const minimumEmergencyMonthlyBuffer = 3_000;
export const dependentBuffer = 1_500;
export const emergencyDependentBuffer = 1_250;
export const unknownObligationPct = 0.1;
export const unknownExpensePctByIncome: Record<IncomeType, number> = {
  salaried: 0.32,
  self_employed: 0.38,
  informal: 0.45
};
export const emergencyDebtObligationBlockPct = 0.5;
export const soonEndingEmiWindowMonths = 3;
