import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { voidPaymentSchema } from "@/lib/validation";
import { paymentService } from "@/services/paymentService";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const paymentId = Number(params.id);
    if (Number.isNaN(paymentId)) throw new AppError("Invalid payment id");

    const parsed = voidPaymentSchema.parse(await request.json().catch(() => ({})));
    const details = await paymentService.voidPayment(paymentId, {
      reason: parsed.reason,
      performedBy: { userId: user.userId, name: user.name },
    });
    return NextResponse.json({ data: details });
  } catch (err) {
    return handleApiError(err);
  }
}
