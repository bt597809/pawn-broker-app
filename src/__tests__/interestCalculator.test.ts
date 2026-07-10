import { describe, expect, it } from "vitest";
import { calculateAccruedInterest } from "@/domain/interestCalculator";

describe("calculateAccruedInterest", () => {
  const principal = 10000_00; // 10000 rupees in paise
  const rate = 2;

  it("returns zero when no days have passed", () => {
    const date = new Date("2026-01-01");
    expect(calculateAccruedInterest(principal, rate, date, date)).toBe(0);
  });

  it("charges one full month of interest", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    expect(calculateAccruedInterest(principal, rate, from, to)).toBe(20000);
  });

  it("pro-rates for half a month", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-16");
    expect(calculateAccruedInterest(principal, rate, from, to)).toBe(10000);
  });

  it("returns zero when principal is zero", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-02-01");
    expect(calculateAccruedInterest(0, rate, from, to)).toBe(0);
  });

  it("returns zero when rate is zero", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-02-01");
    expect(calculateAccruedInterest(principal, 0, from, to)).toBe(0);
  });
});
