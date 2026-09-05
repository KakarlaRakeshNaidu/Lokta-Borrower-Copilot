import { describe, expect, it } from 'vitest';
import { calculateApr } from './apr';

describe('APR solver', () => {
  it('returns APR above nominal rate when upfront fee is deducted', () => {
    const noFee = calculateApr({ principal: 500_000, nominalRateAnnual: 12, tenureMonths: 36, upfrontFeeAmount: 0 });
    const withFee = calculateApr({ principal: 500_000, nominalRateAnnual: 12, tenureMonths: 36, upfrontFeeAmount: 10_000 });
    expect(noFee).not.toBeNull();
    expect(withFee).not.toBeNull();
    expect(withFee!).toBeGreaterThan(noFee!);
    expect(withFee!).toBeGreaterThan(12);
  });

  it('fails safely when fees exceed disbursal', () => {
    expect(calculateApr({ principal: 10_000, nominalRateAnnual: 12, tenureMonths: 12, upfrontFeeAmount: 12_000 })).toBeNull();
  });
});