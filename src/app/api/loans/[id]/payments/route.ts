import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { parseDate, receivePaymentSchema } from "@/lib/validation";
import { paymentService } from "@/services/paymentService";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = Number(params.id);
    if (Number.isNaN(loanId)) {
      throw new AppError("Invalid loan id");
    }

    const body = await request.json();
    const parsed = receivePaymentSchema.parse(body);

    const details = await paymentService.receivePayment(loanId, {
      paymentDate: parseDate(parsed.paymentDate),
      amount: parsed.amount,
      paymentMode: parsed.paymentMode,
    });

    return NextResponse.json({ data: details }, { status: 201 });
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
