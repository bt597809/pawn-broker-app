import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { authService } from "@/services/authService";
import { AppError } from "@/lib/errors";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);
    const user = await authService.login(parsed.email, parsed.password);

    const session = await getSession();
    session.user = user;
    await session.save();

    return NextResponse.json({ data: { name: user.name, role: user.role } });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    if (err && typeof err === "object" && "issues" in err) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
