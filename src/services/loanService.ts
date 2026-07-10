import { CreateLoanInput } from "@/domain/types";
import { AppError } from "@/lib/errors";
import { toPaise } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { LedgerRepository } from "@/repositories/ledgerRepository";
import { LoanRepository } from "@/repositories/loanRepository";
import { AccountingService } from "./accountingService";
import { buildLoanSummary } from "./loanBalanceService";

function validateLoanInput(input: CreateLoanInput) {
  const name = input.customerName.trim();
  if (name.length < 2) {
    throw new AppError("Customer name is required");
  }
  if (input.loanAmount <= 0) {
    throw new AppError("Loan amount must be greater than zero");
  }
  if (input.interestRateMonthly < 0) {
    throw new AppError("Interest rate cannot be negative");
  }
  if (input.grossWeightGm < 0 || input.stoneWeightGm < 0) {
    throw new AppError("Weights cannot be negative");
  }
  if (input.stoneWeightGm > input.grossWeightGm) {
    throw new AppError("Stone weight cannot exceed gross weight");
  }
  if (input.estimatedValue <= 0) {
    throw new AppError("Estimated item value must be greater than zero");
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (input.loanDate > today) {
    throw new AppError("Loan date cannot be in the future");
  }
}

export class LoanService {
  async createLoan(input: CreateLoanInput) {
    validateLoanInput(input);

    const netWeightGm = input.grossWeightGm - input.stoneWeightGm;
    const loanAmountPaise = toPaise(input.loanAmount);
    const estimatedValuePaise = toPaise(input.estimatedValue);

    return prisma.$transaction(async (tx) => {
      const loanRepo = new LoanRepository(tx);
      const ledgerRepo = new LedgerRepository(tx);
      const accounting = new AccountingService(ledgerRepo);

      const voucherNo = await loanRepo.nextLoanVoucherNo(input.loanDate);

      const loan = await loanRepo.create({
        voucherNo,
        customerName: input.customerName.trim(),
        loanDate: input.loanDate,
        loanAmountPaise,
        interestRateMonthly: input.interestRateMonthly,
        pledgedItemName: input.pledgedItemName.trim(),
        grossWeightGm: input.grossWeightGm,
        stoneWeightGm: input.stoneWeightGm,
        netWeightGm,
        estimatedValuePaise,
        paymentMode: input.paymentMode,
      });

      await accounting.postLoanEntries({
        voucherNo,
        entryDate: input.loanDate,
        loanAmountPaise,
        paymentMode: input.paymentMode,
        loanId: loan.id,
      });

      return loan;
    });
  }

  async getLoanDetails(id: number) {
    const loan = await new LoanRepository(prisma).findById(id);
    if (!loan) {
      throw new AppError("Loan not found", 404);
    }

    const summary = buildLoanSummary(
      loan.loanAmountPaise,
      loan.interestRateMonthly,
      loan.loanDate,
      loan.payments
    );

    return { loan, summary };
  }

  async listLoans() {
    const loans = await new LoanRepository(prisma).findAll();
    return loans.map((loan) => ({
      ...loan,
      summary: buildLoanSummary(
        loan.loanAmountPaise,
        loan.interestRateMonthly,
        loan.loanDate,
        loan.payments
      ),
    }));
  }

  async closeLoanIfSettled(loanId: number) {
    const { loan, summary } = await this.getLoanDetails(loanId);
    if (loan.status === "CLOSED") {
      return;
    }
    if (summary.totalPayablePaise === 0) {
      await new LoanRepository(prisma).updateStatus(loanId, "CLOSED");
    }
  }
}

export const loanService = new LoanService();
