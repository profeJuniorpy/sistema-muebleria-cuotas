-- CreateEnum
CREATE TYPE "ChequeType" AS ENUM ('EMITIDO', 'RECIBIDO');

-- CreateEnum
CREATE TYPE "ChequeStatus" AS ENUM ('PENDIENTE', 'COBRADO', 'RECHAZADO', 'ANULADO');

-- CreateTable
CREATE TABLE "StorefrontBanner" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cheque" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "ChequeType" NOT NULL,
    "bankName" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ChequeStatus" NOT NULL DEFAULT 'PENDIENTE',
    "partyName" TEXT NOT NULL,
    "partyDocument" TEXT,
    "concept" TEXT,
    "customerId" TEXT,
    "supplierId" TEXT,
    "clearedAt" TIMESTAMP(3),
    "notes" TEXT,
    "registeredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cheque_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cheque" ADD CONSTRAINT "Cheque_registeredBy_fkey" FOREIGN KEY ("registeredBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
