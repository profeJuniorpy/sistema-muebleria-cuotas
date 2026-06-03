-- ============================================================
-- TABLAS FALTANTES - Ejecutar en Supabase SQL Editor
-- ============================================================

-- Enums faltantes
DO $$ BEGIN CREATE TYPE "PurchaseType" AS ENUM ('CONTADO', 'CREDITO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PurchaseStatus" AS ENUM ('PENDIENTE', 'COMPLETADA', 'CANCELADA', 'MORA'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CashStatus" AS ENUM ('ABIERTA', 'CERRADA'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "WithdrawalCategory" AS ENUM ('PAGO_PROVEEDOR', 'GASTO_OPERATIVO', 'ADELANTO_PERSONAL', 'DEVOLUCION', 'OTRO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "NotifStatus" AS ENUM ('PENDIENTE', 'ENVIADO', 'FALLIDO', 'SIN_NUMERO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CompanyConfig
CREATE TABLE IF NOT EXISTS "CompanyConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "phone" TEXT, "mobile" TEXT, "email" TEXT, "website" TEXT,
    "address" TEXT, "city" TEXT, "department" TEXT,
    "legalRepresentative" TEXT, "legalRepresentativeCI" TEXT,
    "bankName" TEXT, "bankAccount" TEXT, "bankAccountType" TEXT,
    "timbrado" TEXT, "establishmentNumber" TEXT, "dispatchPoint" TEXT,
    "logoUrl" TEXT, "footerText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyConfig_pkey" PRIMARY KEY ("id")
);

-- Purchase
CREATE TABLE IF NOT EXISTS "Purchase" (
    "id" TEXT NOT NULL, "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "type" "PurchaseType" NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_number_key" ON "Purchase"("number");

-- PurchaseItem
CREATE TABLE IF NOT EXISTS "PurchaseItem" (
    "id" TEXT NOT NULL, "purchaseId" TEXT NOT NULL, "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- SupplierCreditPlan
CREATE TABLE IF NOT EXISTS "SupplierCreditPlan" (
    "id" TEXT NOT NULL, "purchaseId" TEXT NOT NULL,
    "downPayment" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "financedAmount" DECIMAL(65,30) NOT NULL,
    "installments" INTEGER NOT NULL,
    "frequency" "Frequency" NOT NULL DEFAULT 'MENSUAL',
    "firstDueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierCreditPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupplierCreditPlan_purchaseId_key" ON "SupplierCreditPlan"("purchaseId");

-- SupplierAmortizationSchedule
CREATE TABLE IF NOT EXISTS "SupplierAmortizationSchedule" (
    "id" TEXT NOT NULL, "creditPlanId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL, "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0, "paidAt" TIMESTAMP(3),
    CONSTRAINT "SupplierAmortizationSchedule_pkey" PRIMARY KEY ("id")
);

-- SupplierPayment
CREATE TABLE IF NOT EXISTS "SupplierPayment" (
    "id" TEXT NOT NULL, "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL, "purchaseId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'EFECTIVO',
    "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupplierPayment_number_key" ON "SupplierPayment"("number");

-- CashRegister
CREATE TABLE IF NOT EXISTS "CashRegister" (
    "id" TEXT NOT NULL, "number" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL, "closedBy" TEXT,
    "openingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(65,30), "systemBalance" DECIMAL(65,30), "difference" DECIMAL(65,30),
    "status" "CashStatus" NOT NULL DEFAULT 'ABIERTA',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3), "notes" TEXT,
    CONSTRAINT "CashRegister_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CashRegister_number_key" ON "CashRegister"("number");

-- CashWithdrawal
CREATE TABLE IF NOT EXISTS "CashWithdrawal" (
    "id" TEXT NOT NULL, "number" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL, "concept" TEXT NOT NULL,
    "category" "WithdrawalCategory" NOT NULL DEFAULT 'OTRO',
    "referenceType" TEXT, "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashWithdrawal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CashWithdrawal_number_key" ON "CashWithdrawal"("number");

-- CashCount
CREATE TABLE IF NOT EXISTS "CashCount" (
    "id" TEXT NOT NULL, "cashRegisterId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "countedAmount" DECIMAL(65,30) NOT NULL, "systemAmount" DECIMAL(65,30) NOT NULL,
    "difference" DECIMAL(65,30) NOT NULL, "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashCount_pkey" PRIMARY KEY ("id")
);

-- NotificationLog
CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id" TEXT NOT NULL, "customerId" TEXT NOT NULL, "installmentId" TEXT,
    "phone" TEXT NOT NULL, "message" TEXT NOT NULL,
    "status" "NotifStatus" NOT NULL DEFAULT 'PENDIENTE',
    "errorMessage" TEXT, "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys (todas con manejo de duplicados)
DO $$ BEGIN ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SupplierCreditPlan" ADD CONSTRAINT "SupplierCreditPlan_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SupplierAmortizationSchedule" ADD CONSTRAINT "SupplierAmortizationSchedule_creditPlanId_fkey" FOREIGN KEY ("creditPlanId") REFERENCES "SupplierCreditPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CashRegister" ADD CONSTRAINT "CashRegister_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CashRegister" ADD CONSTRAINT "CashRegister_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CashWithdrawal" ADD CONSTRAINT "CashWithdrawal_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CashWithdrawal" ADD CONSTRAINT "CashWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CashCount" ADD CONSTRAINT "CashCount_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CashCount" ADD CONSTRAINT "CashCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

SELECT 'Tablas creadas exitosamente' AS resultado;
