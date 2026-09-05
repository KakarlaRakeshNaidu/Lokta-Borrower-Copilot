import type { ProductChoice } from '../types';

export type ProductRule = {
  label: string;
  minTenureMonths: number;
  recommendedTenureMonths: number;
  maxTenureMonths: number;
  minimumPracticalPrincipal: number;
  ltvRange: { min: number; max: number } | null;
  ruleIds: string[];
};

export const productRules: Record<ProductChoice, ProductRule> = {
  personal_loan: {
    label: 'Personal loan',
    minTenureMonths: 12,
    recommendedTenureMonths: 48,
    maxTenureMonths: 84,
    minimumPracticalPrincipal: 25_000,
    ltvRange: null,
    ruleIds: ['SBI_PERSONAL_LOAN_ANCHOR', 'PRODUCT_TENURE_LIMITS', 'MINIMUM_PRACTICAL_LOAN_SIZE']
  },
  unsecured_business: {
    label: 'Unsecured business loan',
    minTenureMonths: 12,
    recommendedTenureMonths: 36,
    maxTenureMonths: 60,
    minimumPracticalPrincipal: 50_000,
    ltvRange: null,
    ruleIds: ['PRODUCT_TENURE_LIMITS', 'MINIMUM_PRACTICAL_LOAN_SIZE']
  },
  loan_against_property: {
    label: 'Loan against property / secured business borrowing',
    minTenureMonths: 60,
    recommendedTenureMonths: 120,
    maxTenureMonths: 180,
    minimumPracticalPrincipal: 100_000,
    ltvRange: { min: 0.6, max: 0.65 },
    ruleIds: ['SBI_LAP_LTV_TENURE_ANCHOR', 'LTV_LIMITS', 'PRODUCT_TENURE_LIMITS', 'MINIMUM_PRACTICAL_LOAN_SIZE']
  },
  home_loan: {
    label: 'Home loan',
    minTenureMonths: 60,
    recommendedTenureMonths: 180,
    maxTenureMonths: 300,
    minimumPracticalPrincipal: 100_000,
    ltvRange: { min: 0.75, max: 0.9 },
    ruleIds: ['PRODUCT_TENURE_LIMITS', 'LTV_LIMITS', 'MINIMUM_PRACTICAL_LOAN_SIZE']
  },
  gold_loan: {
    label: 'Gold loan',
    minTenureMonths: 3,
    recommendedTenureMonths: 12,
    maxTenureMonths: 36,
    minimumPracticalPrincipal: 10_000,
    ltvRange: { min: 0.65, max: 0.75 },
    ruleIds: ['SBI_GOLD_LTV_FEE_ANCHOR', 'LTV_LIMITS', 'PRODUCT_TENURE_LIMITS', 'MINIMUM_PRACTICAL_LOAN_SIZE']
  },
  two_wheeler_vehicle: {
    label: 'Two-wheeler / vehicle finance',
    minTenureMonths: 12,
    recommendedTenureMonths: 36,
    maxTenureMonths: 60,
    minimumPracticalPrincipal: 25_000,
    ltvRange: { min: 0.8, max: 0.9 },
    ruleIds: ['ICICI_TWO_WHEELER_RATE_ANCHOR', 'PRODUCT_TENURE_LIMITS', 'LTV_LIMITS', 'MINIMUM_PRACTICAL_LOAN_SIZE']
  }
};

export const productLabels = Object.fromEntries(
  Object.entries(productRules).map(([key, value]) => [key, value.label])
) as Record<ProductChoice, string>;
