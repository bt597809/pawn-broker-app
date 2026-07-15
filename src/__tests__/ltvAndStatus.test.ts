import { describe, expect, it } from "vitest";
import {
  calculateGoldValuePaise,
  calculateMaxEligiblePaise,
  addDays,
} from "@/domain/ltvCalculator";
import { displayLoanStatus, isOpenLoan } from "@/domain/loanStatus";

describe("LTV calculator", () => {
  it("values 22K gold correctly", () => {
    // 10g × ₹6000/g × 22/24
    const value = calculateGoldValuePaise(10, 600000, 22);
    expect(value).toBe(Math.round(10 * 600000 * (22 / 24)));
  });

  it("applies LTV percent", () => {
    expect(calculateMaxEligiblePaise(100000, 75)).toBe(75000);
  });

  it("returns zero for bad inputs", () => {
    expect(calculateGoldValuePaise(0, 100, 22)).toBe(0);
    expect(calculateMaxEligiblePaise(100, 0)).toBe(0);
  });

  it("adds tenure days", () => {
    const from = new Date("2026-01-01");
    expect(addDays(from, 30).toISOString().slice(0, 10)).toBe("2026-01-31");
  });
});

describe("loan status", () => {
  it("marks past-due ACTIVE as OVERDUE for display", () => {
    const due = new Date("2026-01-01");
    const asOf = new Date("2026-02-01");
    expect(displayLoanStatus("ACTIVE", due, asOf)).toBe("OVERDUE");
  });

  it("keeps CLOSED terminal", () => {
    expect(displayLoanStatus("CLOSED", new Date("2020-01-01"), new Date())).toBe("CLOSED");
    expect(isOpenLoan("CLOSED")).toBe(false);
    expect(isOpenLoan("AUCTIONED")).toBe(false);
    expect(isOpenLoan("ACTIVE")).toBe(true);
  });
});
