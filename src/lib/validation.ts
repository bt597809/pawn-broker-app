import { z } from "zod";

export const createLoanSchema = z.object({
  customerName: z.string().min(2),
  loanDate: z.string(),
  loanAmount: z.coerce.number().positive(),
  interestRateMonthly: z.coerce.number().min(0),
  pledgedItemName: z.string().min(1),
  grossWeightGm: z.coerce.number().min(0),
  stoneWeightGm: z.coerce.number().min(0),
  estimatedValue: z.coerce.number().positive(),
  paymentMode: z.enum(["CASH", "BANK"]),
});

export const receivePaymentSchema = z.object({
  paymentDate: z.string(),
  amount: z.coerce.number().positive(),
  paymentMode: z.enum(["CASH", "BANK"]),
});

export function parseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}
