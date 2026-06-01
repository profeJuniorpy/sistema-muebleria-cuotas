import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import UserForm from "@/components/forms/user-form";

export default function NuevoUsuarioPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          render={<Link href="/referenciales/usuarios" />}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h1>
          <p className="text-muted-foreground">
            Crea una cuenta de acceso al sistema ERP.
          </p>
        </div>
      </div>

      <UserForm />
    </div>
  );
}
