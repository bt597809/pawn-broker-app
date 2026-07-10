// Simple interest: principal * (rate/100) * (days/30)

export function daysBetween(from: Date, to: Date): number {
  const start = startOfDay(from);
  const end = startOfDay(to);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function calculateAccruedInterest(
  principalPaise: number,
  monthlyRate: number,
  fromDate: Date,
  toDate: Date
): number {
  if (principalPaise <= 0 || monthlyRate <= 0) {
    return 0;
  }

  const days = daysBetween(fromDate, toDate);
  if (days === 0) {
    return 0;
  }

  const interest = principalPaise * (monthlyRate / 100) * (days / 30);
  return Math.round(interest);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
