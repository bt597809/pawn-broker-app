import { CreateLoanInput } from "@/domain/types";
import { addDays, calculateGoldValuePaise, calculateMaxEligiblePaise } from "@/domain/ltvCalculator";
import { displayLoanStatus } from "@/domain/loanStatus";
import { AppError } from "@/lib/errors";
import { toPaise } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { LedgerRepository } from "@/repositories/ledgerRepository";
import { LoanRepository } from "@/repositories/loanRepository";
import { AccountingService } from "./accountingService";
import { buildLoanSummary } from "./loanBalanceService";
import { customerService } from "./customerService";
import { schemeService } from "./schemeService";

function validateLoanInput(input: CreateLoanInput) {
  if (input.loanAmount <= 0) {
    throw new AppError("Loan amount must be greater than zero");
  }
  if (input.grossWeightGm < 0 || input.stoneWeightGm < 0) {
    throw new AppError("Weights cannot be negative");
  }
  if (input.stoneWeightGm > input.grossWeightGm) {
    throw new AppError("Stone weight cannot exceed gross weight");
  }
  if (input.purityKarat <= 0 || input.purityKarat > 24) {
    throw new AppError("Purity karat must be between 1 and 24");
  }
  if (input.goldRatePerGram <= 0) {
    throw new AppError("Gold/silver rate per gram is required");
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

    const customer = await customerService.getById(input.customerId);
    const scheme = await schemeService.getById(input.schemeId);

    const netWeightGm = input.grossWeightGm - input.stoneWeightGm;
    const goldRatePaise = toPaise(input.goldRatePerGram);
    const estimatedValuePaise =
      input.estimatedValue !== undefined
        ? toPaise(input.estimatedValue)
        : calculateGoldValuePaise(netWeightGm, goldRatePaise, input.purityKarat);

    if (estimatedValuePaise <= 0) {
      throw new AppError("Estimated item value must be greater than zero");
    }

    const maxEligiblePaise = calculateMaxEligiblePaise(
      estimatedValuePaise,
      scheme.maxLtvPercent
    );
    const loanAmountPaise = toPaise(input.loanAmount);

    if (loanAmountPaise > maxEligiblePaise) {
      throw new AppError(
        `Loan amount exceeds max eligible under LTV (${(maxEligiblePaise / 100).toFixed(2)})`
      );
    }

    const rate =
      input.interestRateMonthly !== undefined
        ? input.interestRateMonthly
        : scheme.interestRateMonthly;

    if (rate < 0) {
      throw new AppError("Interest rate cannot be negative");
    }

    const dueDate = addDays(input.loanDate, scheme.tenureDays);

    return prisma.$transaction(async (tx) => {
      const loanRepo = new LoanRepository(tx);
      const ledgerRepo = new LedgerRepository(tx);
      const accounting = new AccountingService(ledgerRepo);

      const voucherNo = await loanRepo.nextLoanVoucherNo(input.loanDate);

      const loan = await loanRepo.create({
        voucherNo,
        customerId: customer.id,
        customerName: customer.name,
        schemeId: scheme.id,
        loanDate: input.loanDate,
        dueDate,
        loanAmountPaise,
        interestRateMonthly: rate,
        metalType: input.metalType,
        purityKarat: input.purityKarat,
        goldRatePaise,
        maxEligiblePaise,
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

    return {
      loan,
      summary,
      displayStatus: displayLoanStatus(loan.status, loan.dueDate),
    };
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
      displayStatus: displayLoanStatus(loan.status, loan.dueDate),
    }));
  }

  async getSettlementQuote(id: number, asOf: Date = new Date()) {
    const details = await this.getLoanDetails(id);
    if (!isOpenStatus(details.loan.status)) {
      throw new AppError("Loan is already closed");
    }
    const summary = buildLoanSummary(
      details.loan.loanAmountPaise,
      details.loan.interestRateMonthly,
      details.loan.loanDate,
      details.loan.payments,
      asOf
    );
    return { ...details, summary, asOf };
  }
}

function isOpenStatus(status: string) {
  return status !== "CLOSED" && status !== "AUCTIONED";
}

export const loanService = new LoanService();
