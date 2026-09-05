import type { ProductChoice, RateRange } from '../types';

export const baseRateBands: Record<ProductChoice, RateRange> = {
  personal_loan: { min: 10.8, max: 18 },
  unsecured_business: { min: 14, max: 24 },
  loan_against_property: { min: 10.8, max: 14 },
  home_loan: { min: 8.4, max: 11.5 },
  gold_loan: { min: 8.8, max: 13 },
  two_wheeler_vehicle: { min: 10.25, max: 22 }
};

export const scoreRateModifiers = {
  superPrime: { minScore: 800, minDelta: -0.7, maxDelta: -0.6, width: -0.4 },
  primePlus: { minScore: 760, minDelta: -0.4, maxDelta: -0.3, width: -0.2 },
  prime: { minScore: 720, minDelta: 0, maxDelta: 0.4, width: 0 },
  nearPrime: { minScore: 680, minDelta: 1, maxDelta: 2, width: 0.5 },
  weak: { minScore: 300, minDelta: 3, maxDelta: 5, width: 1 }
};

export const unknownScoreModifier = { minDelta: 0.6, maxDelta: 2.4, width: 0.8 };
export const thinFileModifier = { minDelta: 0.9, maxDelta: 2.8, width: 1 };
export const recentMissModifier = { minDelta: 2.5, maxDelta: 4.5, width: 0.8 };
export const highCostDebtModifier = { minDelta: 1.5, maxDelta: 3, width: 0.5 };
export const stableSalaryModifier = { minDelta: -0.3, maxDelta: -0.2, width: -0.2 };
export const cashHeavyModifier = { minDelta: 0.7, maxDelta: 1.5, width: 0.3 };

export const borrowerFriendlyUnknownScoreModifier = { minDelta: 0.2, maxDelta: 1.2, width: 0.3 };
export const borrowerFriendlyThinFileModifier = { minDelta: 0.4, maxDelta: 1.6, width: 0.4 };
export const borrowerFriendlyRecentMissModifier = { minDelta: 0.5, maxDelta: 1.2, width: 0.2 };
export const borrowerFriendlyHighCostDebtModifier = { minDelta: 0.4, maxDelta: 1, width: 0.2 };

export const avoidAprPremiumByProduct: Record<ProductChoice, number> = {
  personal_loan: 4,
  unsecured_business: 5,
  loan_against_property: 3,
  home_loan: 2,
  gold_loan: 3,
  two_wheeler_vehicle: 4
};

export const highRiskMarketWidthThreshold = 12;
