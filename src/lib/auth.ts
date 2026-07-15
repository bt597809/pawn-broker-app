import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions, SessionData, SessionUser } from "./session";
import { AppError } from "./errors";

export async function getSession() {
  return getIronSession<SessionData>(cookies(), getSessionOptions());
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("Unauthorized", 401);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new AppError("Admin access required", 403);
  }
  return user;
}
