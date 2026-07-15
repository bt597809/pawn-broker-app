import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { goldRateSchema, parseDate } from "@/lib/validation";
import { goldRateService } from "@/services/goldRateService";
import { fromPaise } from "@/lib/money";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const metal = searchParams.get("metal") as "GOLD" | "SILVER" | null;
    if (metal === "GOLD" || metal === "SILVER") {
      const latest = await goldRateService.getLatestRate(metal);
      return NextResponse.json({
        data: latest
          ? { ...latest, ratePerGram: fromPaise(latest.ratePerGramPaise) }
          : null,
      });
    }
    const latest = await goldRateService.listLatest();
    return NextResponse.json({
      data: latest.map((r) => ({
        ...r,
        ratePerGram: fromPaise(r.ratePerGramPaise),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = goldRateSchema.parse(await request.json());
    const data = await goldRateService.setRate({
      metalType: parsed.metalType,
      ratePerGram: parsed.ratePerGram,
      effectiveDate: parseDate(parsed.effectiveDate),
      createdBy: { userId: user.userId, name: user.name },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
