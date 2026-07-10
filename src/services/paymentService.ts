import { allocatePayment } from "@/domain/paymentAllocation";
import { ReceivePaymentInput } from "@/domain/types";
import { AppError } from "@/lib/errors";
import { toPaise } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { LedgerRepository } from "@/repositories/ledgerRepository";
import { LoanRepository } from "@/repositories/loanRepository";
import { PaymentRepository } from "@/repositories/paymentRepository";
import { AccountingService } from "./accountingService";
import { buildLoanSummary, getLastEventDate } from "./loanBalanceService";
import { LoanService } from "./loanService";

function validatePaymentInput(input: ReceivePaymentInput) {
  if (input.amount <= 0) {
    throw new AppError("Payment amount must be greater than zero");
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (input.paymentDate > today) {
    throw new AppError("Payment date cannot be in the future");
  }
}

export class PaymentService {
  constructor(private loanService: LoanService) {}

  async receivePayment(loanId: number, input: ReceivePaymentInput) {
    validatePaymentInput(input);

    const loanRepo = new LoanRepository(prisma);
    const loan = await loanRepo.findById(loanId);
    if (!loan) {
      throw new AppError("Loan not found", 404);
    }
    if (loan.status === "CLOSED") {
      throw new AppError("Cannot receive payment on a closed loan");
    }
    if (input.paymentDate < loan.loanDate) {
      throw new AppError("Payment date cannot be before loan date");
    }

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

    const fromDate = getLastEventDate(loan.loanDate, loan.payments);
    const split = allocatePayment(
      paymentPaise,
      summary.balancePrincipalPaise,
      loan.interestRateMonthly,
      fromDate,
      input.paymentDate
    );

    await prisma.$transaction(async (tx) => {
      const txLoanRepo = new LoanRepository(tx);
      const txPaymentRepo = new PaymentRepository(tx);
      const ledgerRepo = new LedgerRepository(tx);
      const accounting = new AccountingService(ledgerRepo);

      const voucherNo = await txPaymentRepo.nextPaymentVoucherNo(input.paymentDate);

      const saved = await txPaymentRepo.create({
        loanId,
        voucherNo,
        paymentDate: input.paymentDate,
        amountPaise: paymentPaise,
        interestPortionPaise: split.interestPortionPaise,
        principalPortionPaise: split.principalPortionPaise,
      });

      await accounting.postPaymentEntries({
        voucherNo,
        entryDate: input.paymentDate,
        paymentMode: input.paymentMode,
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
        input.paymentDate
      );

      if (updatedSummary.totalPayablePaise === 0) {
        await txLoanRepo.updateStatus(loanId, "CLOSED");
      }

      return saved;
    });

    return this.loanService.getLoanDetails(loanId);
  }
}

export const paymentService = new PaymentService(new LoanService());
