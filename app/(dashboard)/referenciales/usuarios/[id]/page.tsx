import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getUserById } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import UserForm from "@/components/forms/user-form";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  CAJERO: "Cajero",
  ALMACEN: "Almacén",
  SUPERVISOR: "Supervisor",
};

export default async function EditarUsuarioPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUserById(params.id);

  if (!user) notFound();

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
          <h1 className="text-3xl font-bold tracking-tight">Editar Usuario</h1>
          <p className="text-muted-foreground">
            {user.name} — {ROLE_LABEL[user.role] ?? user.role}
          </p>
        </div>
      </div>

      <UserForm user={user} />
    </div>
  );
}
