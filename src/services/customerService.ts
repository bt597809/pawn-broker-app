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
  async list() {
    return prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
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
