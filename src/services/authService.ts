import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { SessionUser } from "@/lib/session";

export class AuthService {
  async login(email: string, password: string): Promise<SessionUser> {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }
    if (!user.active) {
      throw new AppError("This account is disabled. Contact admin.", 403);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError("Invalid email or password", 401);
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "CASHIER",
    };
  }
}

export const authService = new AuthService();
