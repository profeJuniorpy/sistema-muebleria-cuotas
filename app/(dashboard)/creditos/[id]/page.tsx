import { notFound } from "next/navigation";
import Link from "next/link";
import { differenceInDays } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  Percent,
  Phone,
  User,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getCreditDetail } from "@/lib/actions/credits";
import { getCustomersWithPendingInstallments } from "@/lib/actions/payments";
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
import { CreditPayButton } from "./credit-pay-button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<string, string> = {
  MENSUAL: "Mensual",
  QUINCENAL: "Quincenal",
  SEMANAL: "Semanal",
};

const MODE_LABEL: Record<string, string> = {
  FRANCES: "Francés (cuota fija)",
  SIMPLE: "Simple",
  SALDO_DECRECIENTE: "Sobre saldo decreciente",
};

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  CHEQUE: "Cheque",
};

const RISK_CLASS: Record<string, string> = {
  BAJO: "border-emerald-400 text-emerald-700 bg-emerald-50",
  MEDIO: "border-amber-400 text-amber-700 bg-amber-50",
  ALTO: "border-red-400 text-red-700 bg-red-50",
};

const STATUS_CLASS: Record<string, string> = {
  COMPLETADA: "bg-emerald-100 text-emerald-800",
  PENDIENTE: "bg-amber-100 text-amber-800",
  MORA: "bg-red-100 text-red-800",
  CANCELADA: "bg-slate-100 text-slate-700",
};

const INST_STATUS_CLASS: Record<string, string> = {
  PAGADA: "border-emerald-300 text-emerald-700 bg-emerald-50",
  VENCIDA: "border-red-300 text-red-700 bg-red-50",
  PARCIAL: "border-amber-300 text-amber-700 bg-amber-50",
  PENDIENTE: "border-slate-300 text-slate-700",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CreditDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [credit, session, customers] = await Promise.all([
    getCreditDetail(params.id),
    auth(),
    getCustomersWithPendingInstallments(),
  ]);

  if (!credit) notFound();

  const userId = (session?.user as any)?.id ?? "";
  const plan = credit.plan;
  const pct =
    plan.totalInstallments > 0
      ? Math.round((credit.paidInstallments / plan.totalInstallments) * 100)
      : 0;

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/creditos" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Crédito {credit.saleNumber}
              </h1>
              <Badge
                className={cn("text-sm", STATUS_CLASS[credit.saleStatus] ?? STATUS_CLASS["PENDIENTE"])}
              >
                {credit.saleStatus}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {credit.customer.name} —{" "}
              {new Date(credit.date).toLocaleDateString("es-PY")}
            </p>
          </div>
        </div>

        <CreditPayButton
          saleId={credit.saleId}
          customerId={credit.customer.id}
          customers={customers}
          userId={userId}
          saleStatus={credit.saleStatus}
        />
      </div>

      {/* 4 summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Monto Financiado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat("es-PY").format(plan.financedAmount)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Entrega inicial: {new Intl.NumberFormat("es-PY").format(plan.downPayment)} GS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Cuota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat("es-PY").format(plan.installmentAmount)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan.totalInstallments} cuotas {FREQ_LABEL[plan.frequency] ?? plan.frequency}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5" /> Tasas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{plan.interestRate}% mensual</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mora: {plan.lateInterestRate}% — {MODE_LABEL[plan.interestMode] ?? plan.interestMode}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Saldo Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-xl font-bold", credit.saleStatus === "COMPLETADA" ? "text-emerald-600" : "")}>
              {credit.saleStatus === "COMPLETADA"
                ? "Pagado"
                : `${new Intl.NumberFormat("es-PY").format(credit.pendingBalance)} GS`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cobrado: {new Intl.NumberFormat("es-PY").format(credit.totalPaid)} GS
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cliente + Progreso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Datos del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{credit.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RUC / CI</span>
              <span>{credit.customer.ruc}</span>
            </div>
            {credit.customer.mobile && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Celular
                </span>
                <span>{credit.customer.mobile}</span>
              </div>
            )}
            {credit.customer.city && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ciudad</span>
                <span>{credit.customer.city}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nivel de Riesgo</span>
              <Badge variant="outline" className={cn("text-xs", RISK_CLASS[credit.customer.riskLevel])}>
                {credit.customer.riskLevel}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Límite de Crédito</span>
              <span className="font-medium">
                {new Intl.NumberFormat("es-PY").format(credit.customer.creditLimit)} GS
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Progreso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progreso del Crédito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {credit.paidInstallments} de {plan.totalInstallments} cuotas pagadas
                </span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={cn(
                    "h-3 rounded-full transition-all",
                    pct === 100
                      ? "bg-emerald-500"
                      : credit.overdueInstallments > 0
                      ? "bg-red-500"
                      : "bg-primary"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">
                  {credit.paidInstallments}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Pagadas</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className={cn("text-2xl font-bold", credit.overdueInstallments > 0 ? "text-red-600" : "")}>
                  {credit.overdueInstallments}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Vencidas</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {plan.totalInstallments - credit.paidInstallments - credit.overdueInstallments}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Pendientes</p>
              </div>
            </div>

            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primera cuota</span>
                <span>{new Date(plan.firstDueDate).toLocaleDateString("es-PY")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendedor</span>
                <span>{credit.sellerName}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de amortización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" /> Tabla de Amortización
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Cuota</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Capital GS</TableHead>
                <TableHead className="text-right">Interés GS</TableHead>
                <TableHead className="text-right">Total GS</TableHead>
                <TableHead className="text-right">Saldo GS</TableHead>
                <TableHead className="text-right">Pagado GS</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead>Fecha Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credit.amortizationTable.map((row) => {
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
                        <span className="text-red-600 text-xs ml-1">
                          (+{daysLate}d)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("es-PY").format(row.principal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("es-PY").format(row.interest)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat("es-PY").format(row.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("es-PY").format(row.balance)}
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
                      <Badge
                        variant="outline"
                        className={cn("text-xs", INST_STATUS_CLASS[row.status])}
                      >
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

      {/* Historial de pagos */}
      {credit.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Recibo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto GS</TableHead>
                  <TableHead className="text-right">Mora GS</TableHead>
                  <TableHead>Cobrador</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credit.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {p.number}
                    </TableCell>
                    <TableCell>
                      {new Date(p.date).toLocaleDateString("es-PY")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-700">
                      {new Intl.NumberFormat("es-PY").format(p.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.lateInterestApplied > 0 ? (
                        <span className="text-red-600">
                          {new Intl.NumberFormat("es-PY").format(p.lateInterestApplied)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.collectorName ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.notes ?? "—"}
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
