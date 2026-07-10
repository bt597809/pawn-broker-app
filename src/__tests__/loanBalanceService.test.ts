import { describe, expect, it } from "vitest";
import { buildLoanSummary } from "@/services/loanBalanceService";
import { Payment } from "@prisma/client";

function makePayment(overrides: Partial<Payment>): Payment {
  return {
    id: 1,
    loanId: 1,
    voucherNo: "RC-20260101-001",
    paymentDate: new Date("2026-02-01"),
    amountPaise: 5000,
    interestPortionPaise: 2000,
    principalPortionPaise: 3000,
    createdAt: new Date("2026-02-01"),
    ...overrides,
  };
}

describe("buildLoanSummary", () => {
  const loanDate = new Date("2026-01-01");
  const loanAmount = 100000;

  it("shows full principal and accrued interest with no payments", () => {
    const asOf = new Date("2026-01-31");
    const summary = buildLoanSummary(loanAmount, 2, loanDate, [], asOf);

    expect(summary.principalPaidPaise).toBe(0);
    expect(summary.balancePrincipalPaise).toBe(100000);
    expect(summary.interestTillDatePaise).toBe(2000);
    expect(summary.totalPayablePaise).toBe(102000);
  });

  it("reduces principal after a payment", () => {
    const payments = [
      makePayment({
        principalPortionPaise: 30000,
        interestPortionPaise: 2000,
        amountPaise: 32000,
      }),
    ];

    const asOf = new Date("2026-03-01");
    const summary = buildLoanSummary(loanAmount, 2, loanDate, payments, asOf);

    expect(summary.principalPaidPaise).toBe(30000);
    expect(summary.balancePrincipalPaise).toBe(70000);
    expect(summary.interestPaidPaise).toBe(2000);
  });
});
