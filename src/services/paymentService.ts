import { allocatePayment } from "@/domain/paymentAllocation";
import { addDays } from "@/domain/ltvCalculator";
import { isOpenLoan } from "@/domain/loanStatus";
import {
  AuctionInput,
  NoticeInput,
  ReceivePaymentInput,
  RenewLoanInput,
  SettleLoanInput,
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

    const loanRepo = new LoanRepository(prisma);
    const loan = await loanRepo.findById(loanId);
    if (!loan) {
      throw new AppError("Loan not found", 404);
    }
    if (!isOpenLoan(loan.status)) {
      throw new AppError("Cannot receive payment on a closed loan");
    }
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

    await this.persistPayment(loan, paymentPaise, input.paymentDate, input.paymentMode);
    return this.loanService.getLoanDetails(loanId);
  }

  async settleLoan(loanId: number, input: SettleLoanInput) {
    const loan = await new LoanRepository(prisma).findById(loanId);
    if (!loan) {
      throw new AppError("Loan not found", 404);
    }
    if (!isOpenLoan(loan.status)) {
      throw new AppError("Loan is already closed");
    }
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

    await this.persistPayment(
      loan,
      summary.totalPayablePaise,
      input.paymentDate,
      input.paymentMode,
      "CLOSED"
    );
    return this.loanService.getLoanDetails(loanId);
  }

  async renewLoan(loanId: number, input: RenewLoanInput) {
    const loan = await new LoanRepository(prisma).findById(loanId);
    if (!loan) {
      throw new AppError("Loan not found", 404);
    }
    if (!isOpenLoan(loan.status)) {
      throw new AppError("Cannot renew a closed loan");
    }
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

    await this.persistPayment(
      loan,
      paymentPaise,
      input.paymentDate,
      input.paymentMode,
      "RENEWED",
      newDue
    );
    return this.loanService.getLoanDetails(loanId);
  }

  async addNotice(loanId: number, input: NoticeInput) {
    const loan = await new LoanRepository(prisma).findById(loanId);
    if (!loan) {
      throw new AppError("Loan not found", 404);
    }
    if (!isOpenLoan(loan.status)) {
      throw new AppError("Cannot add notice on a closed loan");
    }

    await prisma.$transaction(async (tx) => {
      await tx.loanNotice.create({
        data: {
          loanId,
          noticeDate: input.noticeDate,
          channel: input.channel,
          notes: input.notes?.trim() || null,
        },
      });
      await new LoanRepository(tx).updateStatus(loanId, "NOTICE");
    });

    return this.loanService.getLoanDetails(loanId);
  }

  async auctionLoan(loanId: number, input: AuctionInput) {
    const loan = await new LoanRepository(prisma).findById(loanId);
    if (!loan) {
      throw new AppError("Loan not found", 404);
    }
    if (!isOpenLoan(loan.status)) {
      throw new AppError("Loan is already closed");
    }
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
        },
      });

      // Keep payment history so balances derive to zero after auction.
      if (dues > 0) {
        const payVoucher = await payRepo.nextPaymentVoucherNo(input.auctionDate);
        await payRepo.create({
          loanId,
          voucherNo: payVoucher,
          paymentDate: input.auctionDate,
          amountPaise: interestPortion + principalPortion,
          interestPortionPaise: interestPortion,
          principalPortionPaise: principalPortion,
        });
      }

      await accounting.postAuctionEntries({
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
      });

      await loanRepo.updateStatus(loanId, "AUCTIONED", {
        closedAt: input.auctionDate,
      });
    });

    return this.loanService.getLoanDetails(loanId);
  }

  private async persistPayment(
    loan: NonNullable<Awaited<ReturnType<LoanRepository["findById"]>>>,
    paymentPaise: number,
    paymentDate: Date,
    paymentMode: "CASH" | "BANK",
    forceStatus?: "CLOSED" | "RENEWED",
    newDueDate?: Date
  ) {
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
      });

      await accounting.postPaymentEntries({
        voucherNo,
        entryDate: paymentDate,
        paymentMode,
        amountPaise: paymentPaise,
        interestPortionPaise: split.interestPortionPaise,
        principalPortionPaise: split.principalPortionPaise,
        paymentId: saved.id,
      });

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
