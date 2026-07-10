import { describe, expect, it } from "vitest";
import { formatVoucherNo } from "@/domain/voucherFactory";
import { formatMoney, fromPaise, toPaise } from "@/lib/money";

describe("money helpers", () => {
  it("converts rupees to paise", () => {
    expect(toPaise(100.5)).toBe(10050);
  });

  it("converts paise back to rupees", () => {
    expect(fromPaise(10050)).toBe(100.5);
  });

  it("formats money for display", () => {
    expect(formatMoney(10050)).toBe("100.50");
  });

  it("rejects invalid amounts", () => {
    expect(() => toPaise(Number.NaN)).toThrow("Invalid amount");
  });
});

describe("voucher numbers", () => {
  it("formats loan voucher with sequence", () => {
    const date = new Date("2026-07-09");
    expect(formatVoucherNo("LN", date, 1)).toBe("LN-20260709-001");
    expect(formatVoucherNo("RC", date, 12)).toBe("RC-20260709-012");
  });
});
