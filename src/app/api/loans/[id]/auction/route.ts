import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { auctionSchema, parseDate } from "@/lib/validation";
import { paymentService } from "@/services/paymentService";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const loanId = Number(params.id);
    if (Number.isNaN(loanId)) throw new AppError("Invalid loan id");

    const parsed = auctionSchema.parse(await request.json());
    const details = await paymentService.auctionLoan(loanId, {
      auctionDate: parseDate(parsed.auctionDate),
      saleAmount: parsed.saleAmount,
      expenses: parsed.expenses,
      paymentMode: parsed.paymentMode,
      comments: parsed.comments,
      performedBy: { userId: user.userId, name: user.name },
    });

    return NextResponse.json({ data: details }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
