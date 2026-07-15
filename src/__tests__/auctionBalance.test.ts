import { describe, expect, it } from "vitest";

/** Mirrors AccountingService.postAuctionEntries balancing rules. */
function auctionLegs(sale: number, expenses: number, principal: number, interest: number) {
  const dues = principal + interest;
  const netCash = sale - expenses;
  const surplus = Math.max(0, netCash - dues);
  const shortfall = Math.max(0, dues - netCash);

  let debit = 0;
  let credit = 0;
  if (netCash > 0) debit += netCash;
  if (shortfall > 0) debit += shortfall;
  if (expenses > 0) {
    debit += expenses;
    credit += expenses;
  }
  credit += interest + principal + surplus;
  return { debit, credit, surplus, shortfall, netCash };
}

describe("auction ledger balance", () => {
  it("balances when sale covers dues with surplus", () => {
    const r = auctionLegs(12000, 500, 10000, 200);
    expect(r.surplus).toBe(1300);
    expect(r.shortfall).toBe(0);
    expect(r.debit).toBe(r.credit);
  });

  it("balances when sale is short", () => {
    const r = auctionLegs(8000, 200, 10000, 500);
    expect(r.shortfall).toBe(2700);
    expect(r.surplus).toBe(0);
    expect(r.debit).toBe(r.credit);
  });
});
