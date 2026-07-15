const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const accounts = [
  { code: "CASH", name: "Cash", accountType: "Asset" },
  { code: "BANK", name: "Bank", accountType: "Asset" },
  { code: "LOAN_REC", name: "Loan Receivable", accountType: "Asset" },
  { code: "INT_INC", name: "Interest Income", accountType: "Income" },
  { code: "AUCTION_EXP", name: "Auction Expenses", accountType: "Expense" },
  { code: "SURPLUS_PAYABLE", name: "Auction Surplus Payable", accountType: "Liability" },
  { code: "WRITE_OFF", name: "Loan Write Off", accountType: "Expense" },
];

const schemes = [
  {
    name: "Standard 90 days",
    interestRateMonthly: 2,
    tenureDays: 90,
    maxLtvPercent: 75,
    precloseAllowed: true,
  },
  {
    name: "Short 30 days",
    interestRateMonthly: 2.5,
    tenureDays: 30,
    maxLtvPercent: 70,
    precloseAllowed: true,
  },
];

async function main() {
  const prisma = new PrismaClient();

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: acc,
    });
  }

  for (const scheme of schemes) {
    await prisma.scheme.upsert({
      where: { name: scheme.name },
      update: {
        interestRateMonthly: scheme.interestRateMonthly,
        tenureDays: scheme.tenureDays,
        maxLtvPercent: scheme.maxLtvPercent,
        precloseAllowed: scheme.precloseAllowed,
      },
      create: scheme,
    });
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@pawnshop.local" },
    update: {},
    create: {
      email: "admin@pawnshop.local",
      passwordHash,
      name: "Shop Admin",
      role: "ADMIN",
    },
  });

  const cashierHash = await bcrypt.hash("cashier123", 10);
  await prisma.user.upsert({
    where: { email: "cashier@pawnshop.local" },
    update: {},
    create: {
      email: "cashier@pawnshop.local",
      passwordHash: cashierHash,
      name: "Cashier",
      role: "CASHIER",
    },
  });

  console.log("Seeded accounts, schemes, and users.");
  console.log("Login: admin@pawnshop.local / admin123");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
