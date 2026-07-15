import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { loanService } from "@/services/loanService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser();
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      throw new AppError("Invalid loan id");
    }
    const { searchParams } = new URL(request.url);
    const asOfParam = searchParams.get("asOf");
    const asOf = asOfParam ? new Date(asOfParam) : new Date();
    const quote = await loanService.getSettlementQuote(id, asOf);
    return NextResponse.json({
      data: {
        asOf: quote.asOf.toISOString().slice(0, 10),
        totalPayablePaise: quote.summary.totalPayablePaise,
        interestTillDatePaise: quote.summary.interestTillDatePaise,
        balancePrincipalPaise: quote.summary.balancePrincipalPaise,
        displayStatus: quote.displayStatus,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
