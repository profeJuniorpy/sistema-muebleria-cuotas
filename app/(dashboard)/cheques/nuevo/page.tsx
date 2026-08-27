import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ChequeForm } from "@/components/forms/cheque-form";

export const dynamic = "force-dynamic";

export default async function NuevoChequePage() {
  const session = await auth();
  const userId = (session?.user as any)?.id ?? "";

  const [customers, suppliers] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href="/cheques" />}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Cheque</h1>
          <p className="text-muted-foreground">
            Registrá un cheque emitido (pago a terceros) o recibido (cobro a clientes).
          </p>
        </div>
      </div>

      <ChequeForm customers={customers} suppliers={suppliers} userId={userId} />
    </div>
  );
}
