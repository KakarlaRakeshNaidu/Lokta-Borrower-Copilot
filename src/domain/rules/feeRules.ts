import type { ProductChoice, RateRange } from '../types';

export const feeRules: Record<ProductChoice, RateRange> = {
  personal_loan: { min: 1, max: 2 },
  unsecured_business: { min: 1, max: 2.5 },
  loan_against_property: { min: 0.75, max: 1.25 },
  home_loan: { min: 0.3, max: 1 },
  gold_loan: { min: 0.25, max: 0.5 },
  two_wheeler_vehicle: { min: 1, max: 2 }
};

export const gstOnFeesPct = 18;