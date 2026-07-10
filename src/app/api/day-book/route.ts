import { NextResponse } from "next/server";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { LedgerRepository } from "@/repositories/ledgerRepository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const entries = await new LedgerRepository(prisma).getDayBook(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );

    const data = entries.map((entry) => ({
      date: entry.entryDate.toISOString().slice(0, 10),
      voucherNo: entry.voucherNo,
      account: entry.account.name,
      debit: entry.debitPaise > 0 ? formatMoney(entry.debitPaise) : "",
      credit: entry.creditPaise > 0 ? formatMoney(entry.creditPaise) : "",
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
