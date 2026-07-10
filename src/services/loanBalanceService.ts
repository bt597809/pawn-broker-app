import { Payment } from "@prisma/client";
import { calculateAccruedInterest } from "@/domain/interestCalculator";
import { LoanSummary } from "@/domain/types";

export function getPrincipalPaid(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.principalPortionPaise, 0);
}

export function getInterestPaid(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.interestPortionPaise, 0);
}

export function getBalancePrincipal(loanAmountPaise: number, payments: Payment[]): number {
  return loanAmountPaise - getPrincipalPaid(payments);
}

export function getLastEventDate(loanDate: Date, payments: Payment[]): Date {
  if (payments.length === 0) {
    return loanDate;
  }
  return payments[payments.length - 1].paymentDate;
}

export function buildLoanSummary(
  loanAmountPaise: number,
  interestRateMonthly: number,
  loanDate: Date,
  payments: Payment[],
  asOfDate: Date = new Date()
): LoanSummary {
  const principalPaidPaise = getPrincipalPaid(payments);
  const interestPaidPaise = getInterestPaid(payments);
  const balancePrincipalPaise = loanAmountPaise - principalPaidPaise;
  const lastEventDate = getLastEventDate(loanDate, payments);

  const interestTillDatePaise = calculateAccruedInterest(
    balancePrincipalPaise,
    interestRateMonthly,
    lastEventDate,
    asOfDate
  );

  return {
    loanAmountPaise,
    interestTillDatePaise,
    principalPaidPaise,
    interestPaidPaise,
    balancePrincipalPaise,
    totalPayablePaise: balancePrincipalPaise + interestTillDatePaise,
  };
}
