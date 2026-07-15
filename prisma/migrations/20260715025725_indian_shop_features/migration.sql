-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "customerId" INTEGER,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "goldRatePaise" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxEligiblePaise" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "metalType" TEXT NOT NULL DEFAULT 'GOLD',
ADD COLUMN     "purityKarat" DOUBLE PRECISION NOT NULL DEFAULT 22,
ADD COLUMN     "schemeId" INTEGER;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CASHIER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "idProofType" TEXT,
    "idProofNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "interestRateMonthly" DOUBLE PRECISION NOT NULL,
    "tenureDays" INTEGER NOT NULL,
    "maxLtvPercent" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "precloseAllowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanNotice" (
    "id" SERIAL NOT NULL,
    "loanId" INTEGER NOT NULL,
    "noticeDate" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" SERIAL NOT NULL,
    "loanId" INTEGER NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "auctionDate" TIMESTAMP(3) NOT NULL,
    "saleAmountPaise" INTEGER NOT NULL,
    "expensesPaise" INTEGER NOT NULL DEFAULT 0,
    "surplusPaise" INTEGER NOT NULL DEFAULT 0,
    "shortfallPaise" INTEGER NOT NULL DEFAULT 0,
    "paymentMode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Scheme_name_key" ON "Scheme"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_voucherNo_key" ON "Auction"("voucherNo");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanNotice" ADD CONSTRAINT "LoanNotice_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
