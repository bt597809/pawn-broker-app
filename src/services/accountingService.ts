import { LedgerEntryInput, LedgerRepository, paymentModeToAccount } from "@/repositories/ledgerRepository";

export class AccountingService {
  constructor(private ledgerRepo: LedgerRepository) {}

  async postLoanEntries(params: {
    voucherNo: string;
    entryDate: Date;
    loanAmountPaise: number;
    paymentMode: "CASH" | "BANK";
    loanId: number;
  }) {
    const cashOrBank = paymentModeToAccount(params.paymentMode);

    await this.ledgerRepo.createEntries([
      {
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: "LOAN_REC",
        debitPaise: params.loanAmountPaise,
        creditPaise: 0,
        referenceType: "LOAN",
        referenceId: params.loanId,
      },
      {
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: cashOrBank,
        debitPaise: 0,
        creditPaise: params.loanAmountPaise,
        referenceType: "LOAN",
        referenceId: params.loanId,
      },
    ]);
  }

  async postPaymentEntries(params: {
    voucherNo: string;
    entryDate: Date;
    paymentMode: "CASH" | "BANK";
    amountPaise: number;
    interestPortionPaise: number;
    principalPortionPaise: number;
    paymentId: number;
  }) {
    const cashOrBank = paymentModeToAccount(params.paymentMode);
    const entries: LedgerEntryInput[] = [
      {
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: cashOrBank,
        debitPaise: params.amountPaise,
        creditPaise: 0,
        referenceType: "PAYMENT",
        referenceId: params.paymentId,
      },
    ];

    if (params.interestPortionPaise > 0) {
      entries.push({
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: "INT_INC",
        debitPaise: 0,
        creditPaise: params.interestPortionPaise,
        referenceType: "PAYMENT",
        referenceId: params.paymentId,
      });
    }

    if (params.principalPortionPaise > 0) {
      entries.push({
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: "LOAN_REC",
        debitPaise: 0,
        creditPaise: params.principalPortionPaise,
        referenceType: "PAYMENT",
        referenceId: params.paymentId,
      });
    }

    await this.ledgerRepo.createEntries(entries);
  }

  /**
   * Auction settlement — net cash = sale - expenses.
   * Dr net cash (+ write-off if short); Cr principal + interest (+ surplus).
   * Expenses: Dr Auction Exp / Cr Cash (offsets netting).
   */
  async postAuctionEntries(params: {
    voucherNo: string;
    entryDate: Date;
    paymentMode: "CASH" | "BANK";
    saleAmountPaise: number;
    expensesPaise: number;
    principalPortionPaise: number;
    interestPortionPaise: number;
    surplusPaise: number;
    shortfallPaise: number;
    auctionId: number;
  }) {
    const cashOrBank = paymentModeToAccount(params.paymentMode);
    const netCash = params.saleAmountPaise - params.expensesPaise;
    const entries: LedgerEntryInput[] = [];

    if (netCash > 0) {
      entries.push({
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: cashOrBank,
        debitPaise: netCash,
        creditPaise: 0,
        referenceType: "AUCTION",
        referenceId: params.auctionId,
      });
    }

    if (params.shortfallPaise > 0) {
      entries.push({
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: "WRITE_OFF",
        debitPaise: params.shortfallPaise,
        creditPaise: 0,
        referenceType: "AUCTION",
        referenceId: params.auctionId,
      });
    }

    if (params.expensesPaise > 0) {
      entries.push({
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: "AUCTION_EXP",
        debitPaise: params.expensesPaise,
        creditPaise: 0,
        referenceType: "AUCTION",
        referenceId: params.auctionId,
      });
      entries.push({
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: cashOrBank,
        debitPaise: 0,
        creditPaise: params.expensesPaise,
        referenceType: "AUCTION",
        referenceId: params.auctionId,
      });
    }

    if (params.interestPortionPaise > 0) {
      entries.push({
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: "INT_INC",
        debitPaise: 0,
        creditPaise: params.interestPortionPaise,
        referenceType: "AUCTION",
        referenceId: params.auctionId,
      });
    }

    if (params.principalPortionPaise > 0) {
      entries.push({
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: "LOAN_REC",
        debitPaise: 0,
        creditPaise: params.principalPortionPaise,
        referenceType: "AUCTION",
        referenceId: params.auctionId,
      });
    }

    if (params.surplusPaise > 0) {
      entries.push({
        voucherNo: params.voucherNo,
        entryDate: params.entryDate,
        accountCode: "SURPLUS_PAYABLE",
        debitPaise: 0,
        creditPaise: params.surplusPaise,
        referenceType: "AUCTION",
        referenceId: params.auctionId,
      });
    }

    await this.ledgerRepo.createEntries(entries);
  }
}