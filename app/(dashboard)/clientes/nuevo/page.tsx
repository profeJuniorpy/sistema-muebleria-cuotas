import CustomerForm from "@/components/forms/customer-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href="/clientes" />}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
          <p className="text-muted-foreground">
            Registrá los datos personales y crediticios del cliente.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expediente de Cliente</CardTitle>
          <CardDescription>
            Toda la información ingresada será utilizada para el análisis de riesgo y contratos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}
