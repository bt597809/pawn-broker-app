import { Prisma, PrismaClient } from "@prisma/client";
import { formatVoucherNo } from "@/domain/voucherFactory";
import { PaymentMode } from "@/domain/types";
import { LoanStatus } from "@/domain/loanStatus";

type DbClient = PrismaClient | Prisma.TransactionClient;

export class LoanRepository {
  constructor(private db: DbClient) {}

  async countLoansOnDate(date: Date) {
    const start = startOfDay(date);
    const end = endOfDay(date);
    return this.db.loan.count({
      where: { createdAt: { gte: start, lte: end } },
    });
  }

  async create(data: {
    voucherNo: string;
    customerId: number;
    customerName: string;
    schemeId: number;
    loanDate: Date;
    dueDate: Date;
    loanAmountPaise: number;
    interestRateMonthly: number;
    metalType: string;
    purityKarat: number;
    goldRatePaise: number;
    maxEligiblePaise: number;
    pledgedItemName: string;
    grossWeightGm: number;
    stoneWeightGm: number;
    netWeightGm: number;
    estimatedValuePaise: number;
    paymentMode: PaymentMode;
  }) {
    return this.db.loan.create({ data });
  }

  async findById(id: number) {
    return this.db.loan.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { paymentDate: "asc" } },
        notices: { orderBy: { noticeDate: "asc" } },
        auctions: { orderBy: { auctionDate: "asc" } },
        scheme: true,
        customer: true,
      },
    });
  }

  async findAll() {
    return this.db.loan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        payments: { orderBy: { paymentDate: "asc" } },
        scheme: true,
        customer: true,
      },
    });
  }

  async updateStatus(
    id: number,
    status: LoanStatus,
    extra?: { dueDate?: Date; closedAt?: Date | null }
  ) {
    return this.db.loan.update({
      where: { id },
      data: {
        status,
        ...(extra?.dueDate ? { dueDate: extra.dueDate } : {}),
        ...(extra && "closedAt" in extra ? { closedAt: extra.closedAt } : {}),
      },
    });
  }

  async nextLoanVoucherNo(loanDate: Date) {
    const count = await this.countLoansOnDate(loanDate);
    return formatVoucherNo("LN", loanDate, count + 1);
  }
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
