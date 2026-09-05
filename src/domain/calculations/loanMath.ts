export function calculateEmi(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (!Number.isFinite(principal) || principal < 0) throw new Error('Principal must be a non-negative finite number.');
  if (!Number.isFinite(annualRatePct) || annualRatePct < 0) throw new Error('Rate must be a non-negative finite number.');
  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) throw new Error('Tenure must be a positive month count.');
  if (principal === 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  if (monthlyRate === 0) return principal / tenureMonths;
  const factor = (1 + monthlyRate) ** tenureMonths;
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function principalFromEmi(emi: number, annualRatePct: number, tenureMonths: number): number {
  if (!Number.isFinite(emi) || emi < 0) throw new Error('EMI must be a non-negative finite number.');
  if (!Number.isFinite(annualRatePct) || annualRatePct < 0) throw new Error('Rate must be a non-negative finite number.');
  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) throw new Error('Tenure must be a positive month count.');
  if (emi === 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  if (monthlyRate === 0) return emi * tenureMonths;
  const factor = (1 + monthlyRate) ** tenureMonths;
  return (emi * (factor - 1)) / (monthlyRate * factor);
}

export function totalInterest(principal: number, annualRatePct: number, tenureMonths: number): number {
  const emi = calculateEmi(principal, annualRatePct, tenureMonths);
  return Math.max(0, emi * tenureMonths - principal);
}