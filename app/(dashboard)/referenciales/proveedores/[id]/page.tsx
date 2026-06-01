import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getSupplierById } from "@/lib/actions/suppliers";
import { Button } from "@/components/ui/button";
import SupplierForm from "@/components/forms/supplier-form";

export default async function EditarProveedorPage({
  params,
}: {
  params: { id: string };
}) {
  const supplier = await getSupplierById(params.id);

  if (!supplier) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          render={<Link href="/referenciales/proveedores" />}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Proveedor</h1>
          <p className="text-muted-foreground">
            {supplier.code} — {supplier.name}
          </p>
        </div>
      </div>

      <SupplierForm supplier={supplier} />
    </div>
  );
}
