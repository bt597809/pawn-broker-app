import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createUserSchema } from "@/lib/validation";
import { userService } from "@/services/userService";

export async function GET() {
  try {
    await requireAdmin();
    const data = await userService.list();
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = createUserSchema.parse(await request.json());
    const data = await userService.create(parsed);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
