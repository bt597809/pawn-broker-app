import { describe, expect, it } from "vitest";
import { allocatePayment } from "@/domain/paymentAllocation";

const rate = 2;

describe("allocatePayment", () => {
  it("applies payment to interest before principal", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    const split = allocatePayment(10000, 100000, rate, from, to);

    expect(split.interestPortionPaise).toBe(2000);
    expect(split.principalPortionPaise).toBe(8000);
  });

  it("covers interest only when payment is smaller", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    const split = allocatePayment(500, 100000, rate, from, to);

    expect(split.interestPortionPaise).toBe(500);
    expect(split.principalPortionPaise).toBe(0);
  });

  it("settles exact interest with no principal portion", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    const split = allocatePayment(2000, 100000, rate, from, to);

    expect(split.interestPortionPaise).toBe(2000);
    expect(split.principalPortionPaise).toBe(0);
  });

  it("puts leftover into principal after interest is cleared", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-16");
    const split = allocatePayment(50000, 100000, rate, from, to);

    expect(split.interestPortionPaise).toBe(1000);
    expect(split.principalPortionPaise).toBe(49000);
  });
});
