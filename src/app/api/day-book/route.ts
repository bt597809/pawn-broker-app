import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { LedgerRepository } from "@/repositories/ledgerRepository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser();
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
      staff: entry.staffName || entry.performedBy?.name || "",
      narration: entry.narration || "",
    }));

    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
