export type PaymentMode = "CASH" | "BANK";

export type StaffActor = {
  userId: number;
  name: string;
};

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
  comments?: string;
  createdBy: StaffActor;
}

export interface ReceivePaymentInput {
  paymentDate: Date;
  amount: number;
  paymentMode: PaymentMode;
  comments?: string;
  performedBy: StaffActor;
}

export interface SettleLoanInput {
  paymentDate: Date;
  paymentMode: PaymentMode;
  comments?: string;
  performedBy: StaffActor;
}

export interface RenewLoanInput {
  paymentDate: Date;
  paymentMode: PaymentMode;
  amount?: number;
  comments?: string;
  performedBy: StaffActor;
}

export interface AuctionInput {
  auctionDate: Date;
  saleAmount: number;
  expenses: number;
  paymentMode: PaymentMode;
  comments?: string;
  performedBy: StaffActor;
}

export interface NoticeInput {
  noticeDate: Date;
  channel: "SHOP" | "PHONE" | "LETTER";
  notes?: string;
  performedBy: StaffActor;
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
