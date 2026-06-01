import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getCustomerById } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CustomerForm from "@/components/forms/customer-form";

export default async function EditarClientePage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await getCustomerById(params.id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          render={<Link href={`/clientes/${params.id}`} />}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
          <p className="text-muted-foreground">{customer.name} — {customer.code}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expediente de Cliente</CardTitle>
          <CardDescription>
            Actualizá los datos del cliente. El código y RUC deben ser únicos en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm customer={customer} />
        </CardContent>
      </Card>
    </div>
  );
}
