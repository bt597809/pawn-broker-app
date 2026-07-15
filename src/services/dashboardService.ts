import { prisma } from "@/lib/prisma";
import { displayLoanStatus } from "@/domain/loanStatus";
import { fromPaise } from "@/lib/money";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export class DashboardService {
  async getTodaySummary() {
    const from = startOfToday();
    const to = endOfToday();

    const [loansToday, paymentsToday, openLoans] = await Promise.all([
      prisma.loan.findMany({
        where: { createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: "desc" },
        include: { createdBy: true },
      }),
      prisma.payment.findMany({
        where: {
          voided: false,
          paymentDate: { gte: from, lte: to },
        },
        include: { loan: true, performedBy: true },
        orderBy: { paymentDate: "desc" },
      }),
      prisma.loan.findMany({
        where: { status: { notIn: ["CLOSED", "AUCTIONED"] } },
        include: { payments: true },
      }),
    ]);

    const disbursedPaise = loansToday.reduce((s, l) => s + l.loanAmountPaise, 0);
    const collectionsPaise = paymentsToday.reduce((s, p) => s + p.amountPaise, 0);
    const interestCollectedPaise = paymentsToday.reduce(
      (s, p) => s + p.interestPortionPaise,
      0
    );

    let overdueCount = 0;
    for (const loan of openLoans) {
      const status = displayLoanStatus(loan.status, loan.dueDate);
      if (status === "OVERDUE" || status === "NOTICE") {
        overdueCount += 1;
      }
    }

    const activeOpen = openLoans.length;

    return {
      loansCreatedToday: loansToday.length,
      disbursedToday: fromPaise(disbursedPaise),
      collectionsToday: fromPaise(collectionsPaise),
      interestCollectedToday: fromPaise(interestCollectedPaise),
      receiptsToday: paymentsToday.length,
      openLoans: activeOpen,
      overdueCount,
      loansToday: loansToday.map((l) => ({
        id: l.id,
        voucherNo: l.voucherNo,
        customerName: l.customerName,
        amount: fromPaise(l.loanAmountPaise),
        by: l.createdBy?.name || "—",
      })),
      paymentsToday: paymentsToday.map((p) => ({
        id: p.id,
        voucherNo: p.voucherNo,
        loanId: p.loanId,
        loanVoucher: p.loan.voucherNo,
        customerName: p.loan.customerName,
        amount: fromPaise(p.amountPaise),
        txnType: p.txnType,
        by: p.performedBy?.name || "—",
      })),
    };
  }
}

export const dashboardService = new DashboardService();
