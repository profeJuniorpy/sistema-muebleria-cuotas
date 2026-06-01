import { Search, Plus, Filter, Download } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getSales() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        seller: true,
      },
      orderBy: {
        date: "desc",
      },
      take: 20,
    });
    return sales;
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}

export default async function VentasPage() {
  const sales = await getSales();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Ventas</h1>
          <p className="text-muted-foreground">
            Registro cronológico de todas las operaciones comerciales.
          </p>
        </div>
        <Button render={<Link href="/ventas/nueva" />}>
          <Plus className="mr-2 h-4 w-4" /> Registrar Venta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por N° Venta o Cliente..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Venta</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Total (GS)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No se han registrado ventas aún.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-bold">{sale.number}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{sale.customer.name}</span>
                        <span className="text-xs text-muted-foreground">{sale.customer.ruc}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{sale.seller.name}</TableCell>
                    <TableCell>
                      <Badge variant={sale.type === "CONTADO" ? "outline" : "default"}>
                        {sale.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat().format(Number(sale.total))}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        sale.status === "COMPLETADA" ? "bg-emerald-100 text-emerald-800" :
                        sale.status === "PENDIENTE" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      )}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" render={<Link href={`/ventas/${sale.id}`} />}>Ver</Button>
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
