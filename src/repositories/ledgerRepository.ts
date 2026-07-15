import { Prisma, PrismaClient } from "@prisma/client";
import { PaymentMode } from "@/domain/types";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type LedgerMeta = {
  staffName?: string | null;
  narration?: string | null;
  performedByUserId?: number | null;
};

export type LedgerEntryInput = {
  voucherNo: string;
  entryDate: Date;
  accountCode: string;
  debitPaise: number;
  creditPaise: number;
  referenceType: "LOAN" | "PAYMENT" | "AUCTION";
  referenceId: number;
  staffName?: string | null;
  narration?: string | null;
  performedByUserId?: number | null;
};

export class LedgerRepository {
  constructor(private db: DbClient) {}

  async getAccountByCode(code: string) {
    const account = await this.db.account.findUnique({ where: { code } });
    if (!account) {
      throw new Error(`Account not found: ${code}`);
    }
    return account;
  }

  async createEntries(entries: LedgerEntryInput[], meta?: LedgerMeta) {
    for (const entry of entries) {
      const account = await this.getAccountByCode(entry.accountCode);
      await this.db.ledgerEntry.create({
        data: {
          voucherNo: entry.voucherNo,
          entryDate: entry.entryDate,
          accountId: account.id,
          debitPaise: entry.debitPaise,
          creditPaise: entry.creditPaise,
          referenceType: entry.referenceType,
          referenceId: entry.referenceId,
          staffName: entry.staffName ?? meta?.staffName ?? null,
          narration: entry.narration ?? meta?.narration ?? null,
          performedByUserId: entry.performedByUserId ?? meta?.performedByUserId ?? null,
        },
      });
    }
  }

  async getDayBook(from?: Date, to?: Date) {
    const where: Prisma.LedgerEntryWhereInput = {};
    if (from || to) {
      where.entryDate = {};
      if (from) where.entryDate.gte = from;
      if (to) where.entryDate.lte = to;
    }

    return this.db.ledgerEntry.findMany({
      where,
      include: { account: true, performedBy: true },
      orderBy: [{ entryDate: "asc" }, { voucherNo: "asc" }, { id: "asc" }],
    });
  }
}

export function paymentModeToAccount(mode: PaymentMode): string {
  return mode === "CASH" ? "CASH" : "BANK";
}
