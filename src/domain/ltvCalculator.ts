// Indian shop LTV: net grams × rate/gram × (karat/24) × LTV%

export function calculateGoldValuePaise(
  netWeightGm: number,
  ratePerGramPaise: number,
  purityKarat: number
): number {
  if (netWeightGm <= 0 || ratePerGramPaise <= 0 || purityKarat <= 0) {
    return 0;
  }
  const purityFactor = Math.min(purityKarat, 24) / 24;
  return Math.round(netWeightGm * ratePerGramPaise * purityFactor);
}

export function calculateMaxEligiblePaise(
  estimatedValuePaise: number,
  maxLtvPercent: number
): number {
  if (estimatedValuePaise <= 0 || maxLtvPercent <= 0) {
    return 0;
  }
  return Math.round(estimatedValuePaise * (maxLtvPercent / 100));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
