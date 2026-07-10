import { calculateAccruedInterest } from "./interestCalculator";
import { PaymentSplit } from "./types";

// Standard pawn shop rule: pay accrued interest first, then knock off principal.
export function allocatePayment(
  paymentPaise: number,
  principalOutstandingPaise: number,
  monthlyRate: number,
  fromDate: Date,
  paymentDate: Date
): PaymentSplit {
  const accruedInterest = calculateAccruedInterest(
    principalOutstandingPaise,
    monthlyRate,
    fromDate,
    paymentDate
  );

  const interestPortionPaise = Math.min(paymentPaise, accruedInterest);
  const remaining = paymentPaise - interestPortionPaise;
  const principalPortionPaise = Math.min(remaining, principalOutstandingPaise);

  return { interestPortionPaise, principalPortionPaise };
}
