import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { setUserActiveSchema } from "@/lib/validation";
import { userService } from "@/services/userService";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const id = Number(params.id);
    if (Number.isNaN(id)) throw new AppError("Invalid user id");

    const parsed = setUserActiveSchema.parse(await request.json());
    const data = await userService.setActive(id, parsed.active, admin.userId);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
