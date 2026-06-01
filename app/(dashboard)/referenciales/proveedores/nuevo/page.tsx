import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import SupplierForm from "@/components/forms/supplier-form";

export default function NuevoProveedorPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Proveedor</h1>
          <p className="text-muted-foreground">
            Registrá un nuevo distribuidor o importador en el sistema.
          </p>
        </div>
      </div>

      <SupplierForm />
    </div>
  );
}
