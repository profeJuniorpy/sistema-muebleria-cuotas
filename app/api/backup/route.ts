import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Tablas de datos del negocio. Se excluyen las tablas internas de NextAuth
// (Account, Session, VerificationToken) por ser efímeras / no relevantes
// para un backup de restauración.
//
// Orden pensado para una eventual restauración (padres antes que hijos,
// respetando FKs). El export en sí no depende del orden.
const MODELS = [
  "companyConfig",
  "storefrontCreditConfig",
  "storefrontBanner",
  "user",
  "supplier",
  "product",
  "customer",
  "sale",
  "saleItem",
  "creditPlan",
  "amortizationSchedule",
  "payment",
  "commissionSettings",
  "commissionOverride",
  "commission",
  "purchase",
  "purchaseItem",
  "supplierCreditPlan",
  "supplierAmortizationSchedule",
  "supplierPayment",
  "stockMovement",
  "cashRegister",
  "cashWithdrawal",
  "cashCount",
  "cheque",
  "notificationLog",
] as const;

async function isAuthorized(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.BACKUP_SECRET;
  if (secret && authHeader === `Bearer ${secret}`) return true;

  const session = await auth();
  const role = (session?.user as any)?.role;
  return role === "ADMIN";
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data: Record<string, unknown[]> = {};

    for (const model of MODELS) {
      // @ts-expect-error - acceso dinámico por nombre de modelo
      data[model] = await prisma[model].findMany();
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      system: "Sistema Muebleria Cuotas ERP",
      version: 1,
      data,
    };

    const json = JSON.stringify(payload, null, 2);
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-erp-${stamp}.json"`,
      },
    });
  } catch (error: any) {
    console.error("[api/backup] Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Error al generar el backup" },
      { status: 500 }
    );
  }
}
