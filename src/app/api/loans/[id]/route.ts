import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { loanService } from "@/services/loanService";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      throw new AppError("Invalid loan id");
    }

    const details = await loanService.getLoanDetails(id);
    return NextResponse.json({ data: details });
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
