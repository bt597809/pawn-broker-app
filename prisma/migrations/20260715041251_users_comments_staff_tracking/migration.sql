-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "performedByUserId" INTEGER;

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "narration" TEXT,
ADD COLUMN     "performedByUserId" INTEGER,
ADD COLUMN     "staffName" TEXT;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "createdByUserId" INTEGER;

-- AlterTable
ALTER TABLE "LoanNotice" ADD COLUMN     "performedByUserId" INTEGER;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "performedByUserId" INTEGER,
ADD COLUMN     "txnType" TEXT NOT NULL DEFAULT 'PAYMENT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanNotice" ADD CONSTRAINT "LoanNotice_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
