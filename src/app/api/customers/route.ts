import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createCustomerSchema } from "@/lib/validation";
import { customerService } from "@/services/customerService";

export async function GET() {
  try {
    await requireUser();
    const data = await customerService.list();
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = createCustomerSchema.parse(await request.json());
    const data = await customerService.create(parsed);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
