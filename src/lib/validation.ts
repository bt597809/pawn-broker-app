import { z } from "zod";

const commentsField = z.string().optional();

export const createLoanSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  schemeId: z.coerce.number().int().positive(),
  loanDate: z.string(),
  loanAmount: z.coerce.number().positive(),
  interestRateMonthly: z.coerce.number().min(0).optional(),
  metalType: z.enum(["GOLD", "SILVER"]).default("GOLD"),
  purityKarat: z.coerce.number().positive().max(24),
  goldRatePerGram: z.coerce.number().positive(),
  pledgedItemName: z.string().min(1),
  grossWeightGm: z.coerce.number().min(0),
  stoneWeightGm: z.coerce.number().min(0),
  estimatedValue: z.coerce.number().positive().optional(),
  paymentMode: z.enum(["CASH", "BANK"]),
  comments: commentsField,
});

export const receivePaymentSchema = z.object({
  paymentDate: z.string(),
  amount: z.coerce.number().positive(),
  paymentMode: z.enum(["CASH", "BANK"]),
  comments: commentsField,
});

export const settleSchema = z.object({
  paymentDate: z.string(),
  paymentMode: z.enum(["CASH", "BANK"]),
  comments: commentsField,
});

export const renewSchema = z.object({
  paymentDate: z.string(),
  paymentMode: z.enum(["CASH", "BANK"]),
  amount: z.coerce.number().positive().optional(),
  comments: commentsField,
});

export const noticeSchema = z.object({
  noticeDate: z.string(),
  channel: z.enum(["SHOP", "PHONE", "LETTER"]),
  notes: z.string().optional(),
});

export const auctionSchema = z.object({
  auctionDate: z.string(),
  saleAmount: z.coerce.number().positive(),
  expenses: z.coerce.number().min(0).default(0),
  paymentMode: z.enum(["CASH", "BANK"]),
  comments: commentsField,
});

export const createCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNo: z.string().optional(),
});

export const createSchemeSchema = z.object({
  name: z.string().min(1),
  interestRateMonthly: z.coerce.number().min(0),
  tenureDays: z.coerce.number().int().positive(),
  maxLtvPercent: z.coerce.number().positive().max(100),
  precloseAllowed: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === "true" || v === "on"),
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "CASHIER"]),
});

export const setUserActiveSchema = z.object({
  active: z.boolean(),
});

export function parseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}
