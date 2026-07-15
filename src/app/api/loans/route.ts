import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createLoanSchema, parseDate } from "@/lib/validation";
import { loanService } from "@/services/loanService";

export async function GET() {
  try {
    await requireUser();
    const loans = await loanService.listLoans();
    return NextResponse.json({ data: loans });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = createLoanSchema.parse(body);

    if (parsed.stoneWeightGm > parsed.grossWeightGm) {
      return NextResponse.json(
        { error: "Stone weight cannot exceed gross weight" },
        { status: 400 }
      );
    }

    const loan = await loanService.createLoan({
      customerId: parsed.customerId,
      schemeId: parsed.schemeId,
      loanDate: parseDate(parsed.loanDate),
      loanAmount: parsed.loanAmount,
      interestRateMonthly: parsed.interestRateMonthly,
      metalType: parsed.metalType,
      purityKarat: parsed.purityKarat,
      goldRatePerGram: parsed.goldRatePerGram,
      pledgedItemName: parsed.pledgedItemName,
      grossWeightGm: parsed.grossWeightGm,
      stoneWeightGm: parsed.stoneWeightGm,
      estimatedValue: parsed.estimatedValue,
      paymentMode: parsed.paymentMode,
      comments: parsed.comments,
      createdBy: { userId: user.userId, name: user.name },
    });

    return NextResponse.json({ data: loan }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
