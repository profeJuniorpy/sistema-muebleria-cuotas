import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  User,
  Calendar,
  CreditCard,
  ArrowLeft,
  Printer
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";


async function getSaleDetails(id: string) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        seller: true,
        items: true,
        creditPlan: {
          include: {
            amortizationTable: {
              orderBy: { installmentNumber: "asc" }
            }
          }
        },
        payments: true,
      },
    });
    return sale;
  } catch (error) {
    console.error("Error fetching sale details:", error);
    return null;
  }
}

export default async function SaleDetailsPage({ params }: { params: { id: string } }) {
  const sale = await getSaleDetails(params.id);

  if (!sale) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/ventas" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalle de Venta</h1>
            <p className="text-muted-foreground">
              Venta N° {sale.number} - {sale.customer.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" render={<a href={`/api/sales/${sale.id}/receipt`} target="_blank" rel="noopener noreferrer" />}>
            <Printer className="h-4 w-4" /> Imprimir Recibo
          </Button>
          <Button className="gap-2" render={<a href={`/api/sales/${sale.id}/contract`} target="_blank" rel="noopener noreferrer" />}>
            <FileText className="h-4 w-4" /> Contrato
          </Button>
          {sale.type === "CREDITO" && sale.creditPlan && (
            <Button
              variant="outline"
              className="gap-2"
              render={<a href={`/api/sales/${sale.id}/pagare`} target="_blank" rel="noopener noreferrer" />}
            >
              <FileText className="h-4 w-4" /> Pagaré
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Información General */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">{new Date(sale.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo:</span>
              <Badge variant={sale.type === "CONTADO" ? "outline" : "default"}>
                {sale.type}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado:</span>
              <Badge className={cn(
                sale.status === "COMPLETADA" ? "bg-emerald-100 text-emerald-800" :
                sale.status === "PENDIENTE" ? "bg-amber-100 text-amber-800" :
                "bg-red-100 text-red-800"
              )}>
                {sale.status}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <User className="h-4 w-4" /> Cliente
              </div>
              <div className="pl-6">
                <p className="font-bold">{sale.customer.name}</p>
                <p className="text-xs">{sale.customer.ruc}</p>
                <p className="text-xs">{sale.customer.phone}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <User className="h-4 w-4" /> Vendedor
              </div>
              <div className="pl-6">
                <p className="font-bold">{sale.seller.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productos Vendidos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">P. Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat().format(Number(item.unitPrice))} GS</TableCell>
                    <TableCell className="text-right font-medium">{new Intl.NumberFormat().format(Number(item.subtotal))} GS</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">Subtotal</TableCell>
                  <TableCell className="text-right font-bold">{new Intl.NumberFormat().format(Number(sale.subtotal))} GS</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-muted-foreground">Descuento</TableCell>
                  <TableCell className="text-right text-muted-foreground">-{new Intl.NumberFormat().format(Number(sale.discount))} GS</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold text-lg">TOTAL</TableCell>
                  <TableCell className="text-right font-bold text-lg text-emerald-600">
                    {new Intl.NumberFormat().format(Number(sale.total))} GS
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {sale.type === "CREDITO" && sale.creditPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Plan de Crédito y Amortización
            </CardTitle>
            <CardDescription>
              Detalles del financiamiento y tabla de cuotas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Entrega Inicial</p>
                <p className="font-bold">{new Intl.NumberFormat().format(Number(sale.creditPlan.downPayment))} GS</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Monto Financiado</p>
                <p className="font-bold">{new Intl.NumberFormat().format(Number(sale.creditPlan.financedAmount))} GS</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tasa de Interés</p>
                <p className="font-bold">{Number(sale.creditPlan.interestRate)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cuotas</p>
                <p className="font-bold">{sale.creditPlan.installments} {sale.creditPlan.frequency}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead className="text-right">Capital</TableHead>
                  <TableHead className="text-right">Interés</TableHead>
                  <TableHead className="text-right">Total Cuota</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.creditPlan.amortizationTable.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.installmentNumber}</TableCell>
                    <TableCell>{new Date(row.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat().format(Number(row.principal))} GS</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat().format(Number(row.interest))} GS</TableCell>
                    <TableCell className="text-right font-bold">{new Intl.NumberFormat().format(Number(row.total))} GS</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat().format(Number(row.balance))} GS</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        row.status === "PAGADA" ? "bg-emerald-100 text-emerald-800" :
                        row.status === "VENCIDA" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
