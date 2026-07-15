import { SessionOptions } from "iron-session";

export type SessionUser = {
  userId: number;
  email: string;
  name: string;
  role: "ADMIN" | "CASHIER";
};

export type SessionData = {
  user?: SessionUser;
};

export function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET || "dev-session-secret-change-in-production-32";
  if (password.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return {
    password,
    cookieName: "pawn_broker_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
      path: "/",
    },
  };
}
