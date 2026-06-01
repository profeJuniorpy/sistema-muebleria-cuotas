import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import PurchaseForm from "@/components/forms/purchase-form";

export const dynamic = "force-dynamic";

export default async function NuevaCompraPage() {
  const session = await auth();
  const buyerId = (session?.user as any)?.id ?? "";

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { status: "ACTIVO" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, costPrice: true, category: true },
    }),
  ]);

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    costPrice: Number(p.costPrice),
    category: p.category as string,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href="/compras" />}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registrar Nueva Compra</h1>
          <p className="text-muted-foreground">
            Ingresa mercadería al stock y registra la factura del proveedor.
          </p>
        </div>
      </div>

      <PurchaseForm
        suppliers={suppliers}
        products={serializedProducts}
        buyerId={buyerId}
      />
    </div>
  );
}
