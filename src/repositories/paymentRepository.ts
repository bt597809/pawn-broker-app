import { Prisma, PrismaClient } from "@prisma/client";
import { formatVoucherNo } from "@/domain/voucherFactory";

type DbClient = PrismaClient | Prisma.TransactionClient;

export class PaymentRepository {
  constructor(private db: DbClient) {}

  async countPaymentsOnDate(date: Date) {
    const start = startOfDay(date);
    const end = endOfDay(date);
    return this.db.payment.count({
      where: { createdAt: { gte: start, lte: end } },
    });
  }

  async create(data: {
    loanId: number;
    voucherNo: string;
    paymentDate: Date;
    amountPaise: number;
    interestPortionPaise: number;
    principalPortionPaise: number;
    comments?: string | null;
    txnType?: string;
    performedByUserId?: number | null;
  }) {
    return this.db.payment.create({ data });
  }

  async nextPaymentVoucherNo(paymentDate: Date) {
    const count = await this.countPaymentsOnDate(paymentDate);
    return formatVoucherNo("RC", paymentDate, count + 1);
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
