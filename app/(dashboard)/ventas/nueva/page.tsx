import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SalesForm from "@/components/forms/sales-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";


export default async function NuevaVentaPage() {
  const session = await auth();
  const currentUserId = (session?.user as any)?.id ?? "";

  const [customers, products, sellers, commissionSettings] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { status: "ACTIVO", stock: { gt: 0 } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["ADMIN", "VENDEDOR", "SUPERVISOR"] },
      },
      select: { id: true, name: true, commissionRate: true },
      orderBy: { name: "asc" },
    }),
    prisma.commissionSettings.findFirst(),
  ]);

  const serializedSellers = sellers.map((s) => ({
    id: s.id,
    name: s.name ?? "Sin nombre",
    commissionRate: s.commissionRate,
  }));

  const globalRates = commissionSettings
    ? {
        cashRate: Number(commissionSettings.cashSaleRate),
        creditRate: Number(commissionSettings.creditSaleRate),
        trigger: commissionSettings.trigger as string,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href="/ventas" />}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registrar Nueva Venta</h1>
          <p className="text-muted-foreground">
            Genera comprobantes de venta al contado o planes de financiación.
          </p>
        </div>
      </div>

      <SalesForm
        customers={customers}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          cashPrice: Number(p.cashPrice),
          creditPrice: Number(p.creditPrice),
        }))}
        sellers={serializedSellers}
        currentUserId={currentUserId}
        globalRates={globalRates}
      />
    </div>
  );
}
