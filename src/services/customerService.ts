import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export type CreateCustomerInput = {
  name: string;
  phone?: string;
  address?: string;
  idProofType?: string;
  idProofNo?: string;
};

export class CustomerService {
  async list(filters?: { q?: string }) {
    const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
    const q = filters?.q?.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) => {
      const hay = [c.name, c.phone || "", c.idProofNo || "", c.idProofType || "", c.address || ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  async create(input: CreateCustomerInput) {
    const name = input.name.trim();
    if (name.length < 2) {
      throw new AppError("Customer name is required");
    }
    return prisma.customer.create({
      data: {
        name,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        idProofType: input.idProofType?.trim() || null,
        idProofNo: input.idProofNo?.trim() || null,
      },
    });
  }

  async getById(id: number) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }
    return customer;
  }
}

export const customerService = new CustomerService();
