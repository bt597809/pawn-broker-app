import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { noticeSchema, parseDate } from "@/lib/validation";
import { paymentService } from "@/services/paymentService";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser();
    const loanId = Number(params.id);
    if (Number.isNaN(loanId)) {
      throw new AppError("Invalid loan id");
    }
    const parsed = noticeSchema.parse(await request.json());
    const details = await paymentService.addNotice(loanId, {
      noticeDate: parseDate(parsed.noticeDate),
      channel: parsed.channel,
      notes: parsed.notes,
    });
    return NextResponse.json({ data: details }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
