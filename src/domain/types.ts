export type PaymentMode = "CASH" | "BANK";

export interface CreateLoanInput {
  customerId: number;
  schemeId: number;
  loanDate: Date;
  loanAmount: number;
  interestRateMonthly?: number;
  metalType: "GOLD" | "SILVER";
  purityKarat: number;
  goldRatePerGram: number;
  pledgedItemName: string;
  grossWeightGm: number;
  stoneWeightGm: number;
  estimatedValue?: number;
  paymentMode: PaymentMode;
}

export interface ReceivePaymentInput {
  paymentDate: Date;
  amount: number;
  paymentMode: PaymentMode;
}

export interface SettleLoanInput {
  paymentDate: Date;
  paymentMode: PaymentMode;
}

export interface RenewLoanInput {
  paymentDate: Date;
  paymentMode: PaymentMode;
  amount?: number;
}

export interface AuctionInput {
  auctionDate: Date;
  saleAmount: number;
  expenses: number;
  paymentMode: PaymentMode;
}

export interface NoticeInput {
  noticeDate: Date;
  channel: "SHOP" | "PHONE" | "LETTER";
  notes?: string;
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
