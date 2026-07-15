import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { loanService } from "@/services/loanService";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser();
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      throw new AppError("Invalid loan id");
    }
    const details = await loanService.getLoanDetails(id);
    return NextResponse.json({ data: details });
  } catch (err) {
    return handleApiError(err);
  }
}
