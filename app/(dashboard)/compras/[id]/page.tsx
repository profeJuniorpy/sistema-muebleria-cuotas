import { notFound } from "next/navigation";
import Link from "next/link";
import { differenceInDays } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Package,
  Phone,
  Printer,
  Truck,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getPurchaseDetail } from "@/lib/actions/purchases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SupplierPayButton } from "./supplier-pay-button";
import { CancelPurchaseButton } from "./cancel-purchase-button";

export const dynamic = "force-dynamic";


// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  COMPLETADA: "bg-emerald-100 text-emerald-800",
  PENDIENTE: "bg-amber-100 text-amber-800",
  MORA: "bg-red-100 text-red-800",
  CANCELADA: "bg-slate-100 text-slate-700",
};

const INST_CLASS: Record<string, string> = {
  PAGADA: "border-emerald-300 text-emerald-700 bg-emerald-50",
  VENCIDA: "border-red-300 text-red-700 bg-red-50",
  PARCIAL: "border-amber-300 text-amber-700 bg-amber-50",
  PENDIENTE: "border-slate-300 text-slate-700",
};

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  CHEQUE: "Cheque",
};

const FREQ_LABEL: Record<string, string> = {
  MENSUAL: "Mensual",
  QUINCENAL: "Quincenal",
  SEMANAL: "Semanal",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CompraDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [purchase, session] = await Promise.all([
    getPurchaseDetail(params.id),
    auth(),
  ]);

  if (!purchase) notFound();

  const userId = (session?.user as any)?.id ?? "";
  const plan = purchase.plan;
  const now = new Date();

  const pct =
    plan && plan.installments > 0
      ? Math.round((purchase.paidInstallments / plan.installments) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/compras" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Compra {purchase.number}
              </h1>
              <Badge className={cn("text-sm", STATUS_CLASS[purchase.status] ?? STATUS_CLASS["PENDIENTE"])}>
                {purchase.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {purchase.supplier.name} —{" "}
              {new Date(purchase.date).toLocaleDateString("es-PY")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {purchase.type === "CREDITO" && (
            <SupplierPayButton
              purchaseId={purchase.id}
              supplierId={purchase.supplier.id}
              purchaseNumber={purchase.number}
              supplierName={purchase.supplier.name}
              userId={userId}
              purchaseStatus={purchase.status}
            />
          )}
          {purchase.status !== "COMPLETADA" && purchase.status !== "CANCELADA" && (
            <CancelPurchaseButton
              purchaseId={purchase.id}
              purchaseNumber={purchase.number}
            />
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> Total Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat("es-PY").format(purchase.total)} GS
            </p>
            {purchase.discount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Dcto: {new Intl.NumberFormat("es-PY").format(purchase.discount)} GS
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Tipo / Cuotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{purchase.type}</p>
            {plan && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {plan.installments} cuotas {FREQ_LABEL[plan.frequency] ?? plan.frequency}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Saldo Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-xl font-bold", purchase.status === "COMPLETADA" ? "text-emerald-600" : "")}>
              {purchase.status === "COMPLETADA"
                ? "Pagado"
                : `${new Intl.NumberFormat("es-PY").format(purchase.pendingBalance)} GS`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pagado: {new Intl.NumberFormat("es-PY").format(purchase.totalPaid)} GS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Registro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {new Date(purchase.date).toLocaleDateString("es-PY")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Por: {purchase.buyerName ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Proveedor + Progreso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Proveedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" /> Datos del Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{purchase.supplier.name}</span>
            </div>
            {purchase.supplier.ruc && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">RUC</span>
                <span>{purchase.supplier.ruc}</span>
              </div>
            )}
            {purchase.supplier.contactName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contacto</span>
                <span>{purchase.supplier.contactName}</span>
              </div>
            )}
            {purchase.supplier.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Teléfono
                </span>
                <span>{purchase.supplier.phone}</span>
              </div>
            )}
            {purchase.notes && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referencia</span>
                  <span className="text-right max-w-[60%]">{purchase.notes}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Progreso (solo CREDITO) */}
        {plan ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progreso del Crédito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {purchase.paidInstallments} de {plan.installments} cuotas pagadas
                  </span>
                  <span className="font-semibold">{pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className={cn(
                      "h-3 rounded-full transition-all",
                      pct === 100
                        ? "bg-emerald-500"
                        : purchase.overdueInstallments > 0
                        ? "bg-red-500"
                        : "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: "Pagadas", value: purchase.paidInstallments, color: "text-emerald-600" },
                  { label: "Vencidas", value: purchase.overdueInstallments, color: purchase.overdueInstallments > 0 ? "text-red-600" : "" },
                  { label: "Pendientes", value: plan.installments - purchase.paidInstallments - purchase.overdueInstallments, color: "" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("es-PY").format(plan.installmentAmount)} GS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primera cuota</span>
                  <span>{new Date(plan.firstDueDate).toLocaleDateString("es-PY")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto financiado</span>
                  <span>{new Intl.NumberFormat("es-PY").format(plan.financedAmount)} GS</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <Badge variant="outline">CONTADO</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge className={cn("text-xs", STATUS_CLASS[purchase.status])}>
                  {purchase.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Pagado</span>
                <span className="text-emerald-600">
                  {new Intl.NumberFormat("es-PY").format(purchase.total)} GS
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" /> Productos Ingresados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Costo Unit. GS</TableHead>
                <TableHead className="text-right">Desc. GS</TableHead>
                <TableHead className="text-right">Subtotal GS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.productCode}</TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("es-PY").format(item.unitCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.discount > 0
                      ? new Intl.NumberFormat("es-PY").format(item.discount)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat("es-PY").format(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold">Subtotal</TableCell>
                <TableCell className="text-right font-bold">
                  {purchase.discount > 0
                    ? new Intl.NumberFormat("es-PY").format(purchase.discount)
                    : "—"}
                </TableCell>
                <TableCell className="text-right font-bold text-lg text-primary">
                  {new Intl.NumberFormat("es-PY").format(purchase.total)} GS
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabla de amortización (solo CREDITO) */}
      {purchase.amortizationTable.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" /> Tabla de Cuotas al Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Cuota</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Monto GS</TableHead>
                  <TableHead className="text-right">Pagado GS</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Fecha Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.amortizationTable.map((row) => {
                  const dueDate = new Date(row.dueDate);
                  const daysLate =
                    now > dueDate && row.status !== "PAGADA"
                      ? differenceInDays(now, dueDate)
                      : 0;

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        row.status === "PAGADA" && "opacity-60",
                        row.status === "VENCIDA" && "bg-red-50/40"
                      )}
                    >
                      <TableCell className="text-center font-medium">
                        #{row.installmentNumber}
                      </TableCell>
                      <TableCell>
                        {dueDate.toLocaleDateString("es-PY")}
                        {daysLate > 0 && (
                          <span className="text-red-600 text-xs ml-1">(+{daysLate}d)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {new Intl.NumberFormat("es-PY").format(row.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.paidAmount > 0 ? (
                          <span className="text-emerald-700 font-medium">
                            {new Intl.NumberFormat("es-PY").format(row.paidAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("text-xs", INST_CLASS[row.status])}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.paidAt
                          ? new Date(row.paidAt).toLocaleDateString("es-PY")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Historial de pagos */}
      {purchase.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Pagos al Proveedor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Pago</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto GS</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm font-medium">{p.number}</TableCell>
                    <TableCell>{new Date(p.date).toLocaleDateString("es-PY")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-700">
                      {new Intl.NumberFormat("es-PY").format(p.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                        render={
                          <Link
                            href={`/rpt/recibo-proveedor/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        <Printer className="h-3 w-3" /> Reimprimir
                      </Button>
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
