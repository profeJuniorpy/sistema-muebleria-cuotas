-- CreateTable
CREATE TABLE "StorefrontCreditConfig" (
    "id" TEXT NOT NULL,
    "interestRate" DECIMAL(65,30) NOT NULL DEFAULT 5,
    "interestMode" "InterestMode" NOT NULL DEFAULT 'FRANCES',
    "installmentOptions" TEXT NOT NULL DEFAULT '3,6,12,18,24',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontCreditConfig_pkey" PRIMARY KEY ("id")
);
