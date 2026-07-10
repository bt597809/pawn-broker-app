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
}
