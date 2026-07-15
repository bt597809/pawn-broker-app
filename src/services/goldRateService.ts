import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { toPaise, fromPaise } from "@/lib/money";
import { StaffActor } from "@/domain/types";

export class GoldRateService {
  async listLatest() {
    const metals = ["GOLD", "SILVER"] as const;
    const result = [];
    for (const metal of metals) {
      const row = await prisma.goldRate.findFirst({
        where: { metalType: metal },
        orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
        include: { createdBy: true },
      });
      if (row) result.push(row);
    }
    return result;
  }

  async listHistory(limit = 20) {
    return prisma.goldRate.findMany({
      orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
      take: limit,
      include: { createdBy: true },
    });
  }

  async getLatestRate(metalType: "GOLD" | "SILVER") {
    return prisma.goldRate.findFirst({
      where: { metalType },
      orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
    });
  }

  async setRate(input: {
    metalType: "GOLD" | "SILVER";
    ratePerGram: number;
    effectiveDate: Date;
    createdBy: StaffActor;
  }) {
    if (input.ratePerGram <= 0) {
      throw new AppError("Rate must be greater than zero");
    }
    const created = await prisma.goldRate.create({
      data: {
        metalType: input.metalType,
        ratePerGramPaise: toPaise(input.ratePerGram),
        effectiveDate: input.effectiveDate,
        createdByUserId: input.createdBy.userId,
      },
    });
    return {
      ...created,
      ratePerGram: fromPaise(created.ratePerGramPaise),
    };
  }
}

export const goldRateService = new GoldRateService();
