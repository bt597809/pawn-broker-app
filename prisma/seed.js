const { PrismaClient } = require("@prisma/client");

const accounts = [
  { code: "CASH", name: "Cash", accountType: "Asset" },
  { code: "BANK", name: "Bank", accountType: "Asset" },
  { code: "LOAN_REC", name: "Loan Receivable", accountType: "Asset" },
  { code: "INT_INC", name: "Interest Income", accountType: "Income" },
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

  console.log("Chart of accounts seeded.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
