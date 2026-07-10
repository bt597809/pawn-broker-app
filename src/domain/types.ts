export type PaymentMode = "CASH" | "BANK";

export interface CreateLoanInput {
  customerName: string;
  loanDate: Date;
  loanAmount: number;
  interestRateMonthly: number;
  pledgedItemName: string;
  grossWeightGm: number;
  stoneWeightGm: number;
  estimatedValue: number;
  paymentMode: PaymentMode;
}

export interface ReceivePaymentInput {
  paymentDate: Date;
  amount: number;
  paymentMode: PaymentMode;
}

export interface LoanSummary {
  loanAmountPaise: number;
  interestTillDatePaise: number;
  principalPaidPaise: number;
  interestPaidPaise: number;
  balancePrincipalPaise: number;
  totalPayablePaise: number;
}

export interface PaymentSplit {
  interestPortionPaise: number;
  principalPortionPaise: number;
}
