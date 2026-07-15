import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export class UserService {
  async list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async create(input: {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "CASHIER";
  }) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (name.length < 2) throw new AppError("Name is required");
    if (input.password.length < 6) throw new AppError("Password must be at least 6 characters");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);
    return prisma.user.create({
      data: { name, email, passwordHash, role: input.role, active: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async setActive(id: number, active: boolean, actorUserId: number) {
    if (id === actorUserId && !active) {
      throw new AppError("You cannot disable your own account");
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);

    if (!active && user.role === "ADMIN") {
      const activeAdmins = await prisma.user.count({
        where: { role: "ADMIN", active: true, NOT: { id } },
      });
      if (activeAdmins === 0) {
        throw new AppError("Cannot disable the last active admin");
      }
    }

    return prisma.user.update({
      where: { id },
      data: { active },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }
}

export const userService = new UserService();
