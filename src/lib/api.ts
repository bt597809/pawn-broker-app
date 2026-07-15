import { AppError } from "@/lib/errors";
import { NextResponse } from "next/server";

export function handleApiError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  if (err && typeof err === "object" && "issues" in err) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
