import { Search, UserPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";


async function getCustomers() {
  try {
    return await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        code: true,
        name: true,
        ruc: true,
        city: true,
        mobile: true,
        riskLevel: true,
        type: true,
        _count: { select: { sales: true } },
      },
    });
  } catch {
    return [];
  }
}

const RISK_CLASS: Record<string, string> = {
  BAJO: "border-emerald-500 text-emerald-700",
  MEDIO: "border-amber-500 text-amber-700",
  ALTO: "border-red-500 text-red-700",
};

export default async function ClientesPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground">
            Consulta expedientes, niveles de riesgo y estados de cuenta.
          </p>
        </div>
        <Button render={<Link href="/clientes/nuevo" />} className="gap-2">
          <UserPlus className="h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RUC o código..."
                className="pl-10"
                readOnly
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {customers.length} cliente(s) registrados
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>RUC / CI</TableHead>
                <TableHead>Nombre / Razón Social</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead className="text-center">Ventas</TableHead>
                <TableHead className="text-center">Riesgo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No se encontraron clientes registrados.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {customer.code}
                    </TableCell>
                    <TableCell className="text-sm">{customer.ruc}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.city ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.mobile ?? "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {customer._count.sales}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", RISK_CLASS[customer.riskLevel])}
                      >
                        {customer.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Ver expediente"
                        render={<Link href={`/clientes/${customer.id}`} />}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
