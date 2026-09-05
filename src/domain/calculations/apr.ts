import { calculateEmi } from './loanMath';

export function calculateApr(params: {
  principal: number;
  nominalRateAnnual: number;
  tenureMonths: number;
  upfrontFeeAmount: number;
  emi?: number;
}): number | null {
  const principal = params.principal;
  const upfrontFeeAmount = Math.max(0, params.upfrontFeeAmount);
  const netDisbursal = principal - upfrontFeeAmount;
  const emi = params.emi ?? calculateEmi(principal, params.nominalRateAnnual, params.tenureMonths);

  if (principal <= 0 || netDisbursal <= 0 || emi <= 0 || params.tenureMonths <= 0) return null;

  const pvAt = (monthlyRate: number): number => {
    if (monthlyRate === 0) return emi * params.tenureMonths;
    return (emi * (1 - (1 + monthlyRate) ** -params.tenureMonths)) / monthlyRate;
  };

  let low = 0;
  let high = 1;
  while (pvAt(high) > netDisbursal && high < 10) high *= 2;
  if (high >= 10) return null;

  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    if (pvAt(mid) > netDisbursal) low = mid;
    else high = mid;
  }

  const monthlyIrr = (low + high) / 2;
  const effectiveAnnual = ((1 + monthlyIrr) ** 12 - 1) * 100;
  return Number.isFinite(effectiveAnnual) ? effectiveAnnual : null;
}