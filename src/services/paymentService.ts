import { allocatePayment } from "@/domain/paymentAllocation";
import { addDays } from "@/domain/ltvCalculator";
import { isOpenLoan } from "@/domain/loanStatus";
import {
  AuctionInput,
  NoticeInput,
  ReceivePaymentInput,
  RenewLoanInput,
  SettleLoanInput,
  StaffActor,
} from "@/domain/types";
import { AppError } from "@/lib/errors";
import { toPaise } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { formatVoucherNo } from "@/domain/voucherFactory";
import { LedgerRepository } from "@/repositories/ledgerRepository";
import { LoanRepository } from "@/repositories/loanRepository";
import { PaymentRepository } from "@/repositories/paymentRepository";
import { AccountingService } from "./accountingService";
import { buildLoanSummary, getLastEventDate } from "./loanBalanceService";
import { LoanService } from "./loanService";

function validatePaymentDate(paymentDate: Date, loanDate: Date) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (paymentDate > today) {
    throw new AppError("Payment date cannot be in the future");
  }
  if (paymentDate < loanDate) {
    throw new AppError("Payment date cannot be before loan date");
  }
}

export class PaymentService {
  constructor(private loanService: LoanService) {}

  async receivePayment(loanId: number, input: ReceivePaymentInput) {
    if (input.amount <= 0) {
      throw new AppError("Payment amount must be greater than zero");
    }

    const loan = await this.loadOpenLoan(loanId);
    validatePaymentDate(input.paymentDate, loan.loanDate);

    const summary = buildLoanSummary(
      loan.loanAmountPaise,
      loan.interestRateMonthly,
      loan.loanDate,
      loan.payments,
      input.paymentDate
    );

    const paymentPaise = toPaise(input.amount);
    if (paymentPaise > summary.totalPayablePaise) {
      throw new AppError("Payment exceeds total amount payable");
    }

    await this.persistPayment({
      loan,
      paymentPaise,
      paymentDate: input.paymentDate,
      paymentMode: input.paymentMode,
      comments: input.comments,
      performedBy: input.performedBy,
      txnType: "PAYMENT",
    });
    return this.loanService.getLoanDetails(loanId);
  }

  async settleLoan(loanId: number, input: SettleLoanInput) {
    const loan = await this.loadOpenLoan(loanId);
    if (loan.scheme && !loan.scheme.precloseAllowed) {
      throw new AppError("Pre-closure is not allowed for this scheme");
    }
    validatePaymentDate(input.paymentDate, loan.loanDate);

    const summary = buildLoanSummary(
      loan.loanAmountPaise,
      loan.interestRateMonthly,
      loan.loanDate,
      loan.payments,
      input.paymentDate
    );

    if (summary.totalPayablePaise <= 0) {
      await new LoanRepository(prisma).updateStatus(loanId, "CLOSED", {
        closedAt: input.paymentDate,
      });
      return this.loanService.getLoanDetails(loanId);
    }

    await this.persistPayment({
      loan,
      paymentPaise: summary.totalPayablePaise,
      paymentDate: input.paymentDate,
      paymentMode: input.paymentMode,
      comments: input.comments,
      performedBy: input.performedBy,
      txnType: "SETTLE",
      forceStatus: "CLOSED",
    });
    return this.loanService.getLoanDetails(loanId);
  }

  async renewLoan(loanId: number, input: RenewLoanInput) {
    const loan = await this.loadOpenLoan(loanId);
    validatePaymentDate(input.paymentDate, loan.loanDate);

    const summary = buildLoanSummary(
      loan.loanAmountPaise,
      loan.interestRateMonthly,
      loan.loanDate,
      loan.payments,
      input.paymentDate
    );

    if (summary.interestTillDatePaise <= 0) {
      throw new AppError("No interest due — nothing to renew against");
    }

    const paymentPaise =
      input.amount !== undefined
        ? toPaise(input.amount)
        : summary.interestTillDatePaise;

    if (paymentPaise < summary.interestTillDatePaise) {
      throw new AppError("Renewal requires full accrued interest to be paid");
    }
    if (paymentPaise > summary.totalPayablePaise) {
      throw new AppError("Payment exceeds total amount payable");
    }

    const tenureDays = loan.scheme?.tenureDays ?? 90;
    const newDue = addDays(input.paymentDate, tenureDays);

    await this.persistPayment({
      loan,
      paymentPaise,
      paymentDate: input.paymentDate,
      paymentMode: input.paymentMode,
      comments: input.comments,
      performedBy: input.performedBy,
      txnType: "RENEW",
      forceStatus: "RENEWED",
      newDueDate: newDue,
    });
    return this.loanService.getLoanDetails(loanId);
  }

  async voidPayment(
    paymentId: number,
    input: { reason?: string; performedBy: StaffActor }
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { loan: true },
    });
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }
    if (payment.voided) {
      throw new AppError("Payment is already voided");
    }
    if (payment.txnType === "AUCTION") {
      throw new AppError("Auction clearances cannot be voided here");
    }
    if (payment.loan.status === "AUCTIONED") {
      throw new AppError("Cannot void payments on an auctioned loan");
    }

    const reason = input.reason?.trim() || "Voided due to entry mistake";
    const voidDate = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          voided: true,
          voidedAt: voidDate,
          voidReason: reason,
          voidedByUserId: input.performedBy.userId,
        },
      });

      const ledgerRepo = new LedgerRepository(tx);
      await ledgerRepo.reversePaymentEntries(paymentId, {
        staffName: input.performedBy.name,
        narration: `VOID ${payment.voucherNo}: ${reason}`,
        performedByUserId: input.performedBy.userId,
        voidDate,
      });

      if (payment.loan.status === "CLOSED") {
        await new LoanRepository(tx).updateStatus(payment.loanId, "ACTIVE", {
          closedAt: null,
        });
      }
    });

    return this.loanService.getLoanDetails(payment.loanId);
  }

  async addNotice(loanId: number, input: NoticeInput) {
    const loan = await this.loadOpenLoan(loanId);

    await prisma.$transaction(async (tx) => {
      await tx.loanNotice.create({
        data: {
          loanId,
          noticeDate: input.noticeDate,
          channel: input.channel,
          notes: input.notes?.trim() || null,
          performedByUserId: input.performedBy.userId,
        },
      });
      await new LoanRepository(tx).updateStatus(loanId, "NOTICE");
    });

    return this.loanService.getLoanDetails(loanId);
  }

  async auctionLoan(loanId: number, input: AuctionInput) {
    const loan = await this.loadOpenLoan(loanId);
    if (input.saleAmount <= 0) {
      throw new AppError("Sale amount must be greater than zero");
    }
    if (input.expenses < 0) {
      throw new AppError("Expenses cannot be negative");
    }

    const summary = buildLoanSummary(
      loan.loanAmountPaise,
      loan.interestRateMonthly,
      loan.loanDate,
      loan.payments,
      input.auctionDate
    );

    const salePaise = toPaise(input.saleAmount);
    const expensesPaise = toPaise(input.expenses);
    const dues = summary.totalPayablePaise;
    const net = salePaise - expensesPaise;
    const surplusPaise = Math.max(0, net - dues);
    const shortfallPaise = Math.max(0, dues - net);
    const interestPortion = summary.interestTillDatePaise;
    const principalPortion = summary.balancePrincipalPaise;
    const comments = input.comments?.trim() || null;
    const meta = {
      staffName: input.performedBy.name,
      narration: comments,
      performedByUserId: input.performedBy.userId,
    };

    await prisma.$transaction(async (tx) => {
      const loanRepo = new LoanRepository(tx);
      const ledgerRepo = new LedgerRepository(tx);
      const accounting = new AccountingService(ledgerRepo);
      const payRepo = new PaymentRepository(tx);

      const count = await tx.auction.count({
        where: {
          createdAt: {
            gte: startOfDay(input.auctionDate),
            lte: endOfDay(input.auctionDate),
          },
        },
      });
      const voucherNo = formatVoucherNo("AQ", input.auctionDate, count + 1);

      const auction = await tx.auction.create({
        data: {
          loanId,
          voucherNo,
          auctionDate: input.auctionDate,
          saleAmountPaise: salePaise,
          expensesPaise,
          surplusPaise,
          shortfallPaise,
          paymentMode: input.paymentMode,
          comments,
          performedByUserId: input.performedBy.userId,
        },
      });

      if (dues > 0) {
        const payVoucher = await payRepo.nextPaymentVoucherNo(input.auctionDate);
        await payRepo.create({
          loanId,
          voucherNo: payVoucher,
          paymentDate: input.auctionDate,
          amountPaise: interestPortion + principalPortion,
          interestPortionPaise: interestPortion,
          principalPortionPaise: principalPortion,
          comments,
          txnType: "AUCTION",
          performedByUserId: input.performedBy.userId,
        });
      }

      await accounting.postAuctionEntries(
        {
          voucherNo,
          entryDate: input.auctionDate,
          paymentMode: input.paymentMode,
          saleAmountPaise: salePaise,
          expensesPaise,
          principalPortionPaise: principalPortion,
          interestPortionPaise: interestPortion,
          surplusPaise,
          shortfallPaise,
          auctionId: auction.id,
        },
        meta
      );

      await loanRepo.updateStatus(loanId, "AUCTIONED", {
        closedAt: input.auctionDate,
      });
    });

    return this.loanService.getLoanDetails(loanId);
  }

  private async loadOpenLoan(loanId: number) {
    const loan = await new LoanRepository(prisma).findById(loanId);
    if (!loan) {
      throw new AppError("Loan not found", 404);
    }
    if (!isOpenLoan(loan.status)) {
      throw new AppError("Loan is already closed");
    }
    return loan;
  }

  private async persistPayment(opts: {
    loan: NonNullable<Awaited<ReturnType<LoanRepository["findById"]>>>;
    paymentPaise: number;
    paymentDate: Date;
    paymentMode: "CASH" | "BANK";
    comments?: string;
    performedBy: StaffActor;
    txnType: string;
    forceStatus?: "CLOSED" | "RENEWED";
    newDueDate?: Date;
  }) {
    const {
      loan,
      paymentPaise,
      paymentDate,
      paymentMode,
      performedBy,
      txnType,
      forceStatus,
      newDueDate,
    } = opts;
    const comments = opts.comments?.trim() || null;

    const fromDate = getLastEventDate(loan.loanDate, loan.payments);
    const summary = buildLoanSummary(
      loan.loanAmountPaise,
      loan.interestRateMonthly,
      loan.loanDate,
      loan.payments,
      paymentDate
    );

    const split = allocatePayment(
      paymentPaise,
      summary.balancePrincipalPaise,
      loan.interestRateMonthly,
      fromDate,
      paymentDate
    );

    await prisma.$transaction(async (tx) => {
      const txLoanRepo = new LoanRepository(tx);
      const txPaymentRepo = new PaymentRepository(tx);
      const ledgerRepo = new LedgerRepository(tx);
      const accounting = new AccountingService(ledgerRepo);

      const voucherNo = await txPaymentRepo.nextPaymentVoucherNo(paymentDate);

      const saved = await txPaymentRepo.create({
        loanId: loan.id,
        voucherNo,
        paymentDate,
        amountPaise: paymentPaise,
        interestPortionPaise: split.interestPortionPaise,
        principalPortionPaise: split.principalPortionPaise,
        comments,
        txnType,
        performedByUserId: performedBy.userId,
      });

      await accounting.postPaymentEntries(
        {
          voucherNo,
          entryDate: paymentDate,
          paymentMode,
          amountPaise: paymentPaise,
          interestPortionPaise: split.interestPortionPaise,
          principalPortionPaise: split.principalPortionPaise,
          paymentId: saved.id,
        },
        {
          staffName: performedBy.name,
          narration: comments,
          performedByUserId: performedBy.userId,
        }
      );

      const updatedSummary = buildLoanSummary(
        loan.loanAmountPaise,
        loan.interestRateMonthly,
        loan.loanDate,
        [...loan.payments, saved],
        paymentDate
      );

      if (forceStatus === "CLOSED" || updatedSummary.totalPayablePaise === 0) {
        await txLoanRepo.updateStatus(loan.id, "CLOSED", { closedAt: paymentDate });
      } else if (forceStatus === "RENEWED" && newDueDate) {
        await txLoanRepo.updateStatus(loan.id, "RENEWED", { dueDate: newDueDate });
      }
    });
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

export const paymentService = new PaymentService(new LoanService());
