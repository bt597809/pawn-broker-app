import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { createLoanSchema, parseDate } from "@/lib/validation";
import { loanService } from "@/services/loanService";

export async function GET() {
  try {
    const loans = await loanService.listLoans();
    return NextResponse.json({ data: loans });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createLoanSchema.parse(body);

    if (parsed.stoneWeightGm > parsed.grossWeightGm) {
      throw new AppError("Stone weight cannot exceed gross weight");
    }

    const loan = await loanService.createLoan({
      customerName: parsed.customerName,
      loanDate: parseDate(parsed.loanDate),
      loanAmount: parsed.loanAmount,
      interestRateMonthly: parsed.interestRateMonthly,
      pledgedItemName: parsed.pledgedItemName,
      grossWeightGm: parsed.grossWeightGm,
      stoneWeightGm: parsed.stoneWeightGm,
      estimatedValue: parsed.estimatedValue,
      paymentMode: parsed.paymentMode,
    });

    return NextResponse.json({ data: loan }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  if (err && typeof err === "object" && "issues" in err) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
