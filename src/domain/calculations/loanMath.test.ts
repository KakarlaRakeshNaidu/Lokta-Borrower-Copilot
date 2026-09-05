import { describe, expect, it } from 'vitest';
import { calculateEmi, principalFromEmi, totalInterest } from './loanMath';

const closeTo = (actual: number, expected: number, tolerance = 2) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);

describe('loan math', () => {
  it('calculates ordinary amortizing EMI and inverse principal consistently', () => {
    const emi = calculateEmi(800_000, 12, 48);
    closeTo(emi, 21_067, 20);
    closeTo(principalFromEmi(emi, 12, 48), 800_000, 1);
    expect(totalInterest(800_000, 12, 48)).toBeGreaterThan(200_000);
  });

  it('handles zero-interest loans without division errors', () => {
    expect(calculateEmi(120_000, 0, 12)).toBe(10_000);
    expect(principalFromEmi(10_000, 0, 12)).toBe(120_000);
  });

  it('rejects invalid values instead of producing NaN', () => {
    expect(() => calculateEmi(-1, 10, 12)).toThrow();
    expect(() => principalFromEmi(1_000, -1, 12)).toThrow();
    expect(() => calculateEmi(1_000, 10, 0)).toThrow();
  });
});