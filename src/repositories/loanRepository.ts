import { Prisma, PrismaClient } from "@prisma/client";
import { formatVoucherNo } from "@/domain/voucherFactory";
import { PaymentMode } from "@/domain/types";

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
    customerName: string;
    loanDate: Date;
    loanAmountPaise: number;
    interestRateMonthly: number;
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
      include: { payments: { orderBy: { paymentDate: "asc" } } },
    });
  }

  async findAll() {
    return this.db.loan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        payments: true,
      },
    });
  }

  async updateStatus(id: number, status: "ACTIVE" | "CLOSED") {
    return this.db.loan.update({ where: { id }, data: { status } });
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
