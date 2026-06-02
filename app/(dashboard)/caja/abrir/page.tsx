import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CajaAperturaForm from "@/components/forms/caja-apertura-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Wallet } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";


export default async function AbrirCajaPage() {
  const session = await auth();
  const role = (session?.user as any)?.role ?? "";

  if (!["ADMIN", "CAJERO", "SUPERVISOR"].includes(role)) {
    redirect("/caja");
  }

  const userId = (session?.user as any)?.id ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href="/caja" />}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abrir Caja</h1>
          <p className="text-muted-foreground">
            Registrá el saldo inicial para comenzar las operaciones del día.
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Datos de Apertura
          </CardTitle>
          <CardDescription>
            El saldo inicial es el efectivo con el que se abre la caja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CajaAperturaForm userId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
