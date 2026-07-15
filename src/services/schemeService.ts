import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export type CreateSchemeInput = {
  name: string;
  interestRateMonthly: number;
  tenureDays: number;
  maxLtvPercent: number;
  precloseAllowed: boolean;
};

export class SchemeService {
  async list() {
    return prisma.scheme.findMany({ orderBy: { name: "asc" } });
  }

  async create(input: CreateSchemeInput) {
    if (!input.name.trim()) {
      throw new AppError("Scheme name is required");
    }
    if (input.tenureDays <= 0) {
      throw new AppError("Tenure must be greater than zero");
    }
    if (input.maxLtvPercent <= 0 || input.maxLtvPercent > 100) {
      throw new AppError("LTV must be between 1 and 100");
    }
    return prisma.scheme.create({
      data: {
        name: input.name.trim(),
        interestRateMonthly: input.interestRateMonthly,
        tenureDays: input.tenureDays,
        maxLtvPercent: input.maxLtvPercent,
        precloseAllowed: input.precloseAllowed,
      },
    });
  }

  async getById(id: number) {
    const scheme = await prisma.scheme.findUnique({ where: { id } });
    if (!scheme) {
      throw new AppError("Scheme not found", 404);
    }
    return scheme;
  }
}

export const schemeService = new SchemeService();
