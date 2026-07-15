import { NextResponse } from "next/server";
import { requireAdmin, requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSchemeSchema } from "@/lib/validation";
import { schemeService } from "@/services/schemeService";

export async function GET() {
  try {
    await requireUser();
    const data = await schemeService.list();
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = createSchemeSchema.parse(await request.json());
    const data = await schemeService.create(parsed);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
