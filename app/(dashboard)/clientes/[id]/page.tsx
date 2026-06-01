import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CreditCard,
  Edit,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  TrendingDown,
  Users,
} from "lucide-react";

import { getCustomerDetail } from "@/lib/actions/customers";
import { CallmebotConfig } from "./callmebot-config";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_CLASS: Record<string, string> = {
  BAJO: "border-emerald-300 text-emerald-700 bg-emerald-50",
  MEDIO: "border-amber-300 text-amber-700 bg-amber-50",
  ALTO: "border-red-300 text-red-700 bg-red-50",
};

const SALE_STATUS_CLASS: Record<string, string> = {
  COMPLETADA: "border-emerald-300 text-emerald-700 bg-emerald-50",
  PENDIENTE: "border-amber-300 text-amber-700 bg-amber-50",
  MORA: "border-red-300 text-red-700 bg-red-50",
  CANCELADA: "border-slate-300 text-slate-600",
};

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  CHEQUE: "Cheque",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY").format(Math.round(n));
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClienteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await getCustomerDetail(params.id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/clientes" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <Badge variant="outline" className={cn("text-sm", RISK_CLASS[customer.riskLevel])}>
                Riesgo {customer.riskLevel}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {customer.code} · RUC/CI: {customer.ruc} · {customer.type}
            </p>
          </div>
        </div>
        <Button
          render={<Link href={`/clientes/${customer.id}/editar`} />}
          variant="outline"
          className="gap-2"
        >
          <Edit className="h-4 w-4" /> Editar Cliente
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Saldo Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-xl font-bold", customer.pendingBalance > 0 ? "text-amber-600" : "text-emerald-600")}>
              {customer.pendingBalance > 0 ? `${fmt(customer.pendingBalance)} GS` : "Sin deuda"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pagado: {fmt(customer.totalPaid)} GS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Cuotas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-xl font-bold", customer.overdueInstallments > 0 ? "text-red-600" : "")}>
              {customer.overdueInstallments}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {customer.pendingInstallments} pendientes total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> Límite de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{fmt(customer.creditLimit)} GS</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ingreso: {fmt(customer.monthlyIncome)} GS/mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-emerald-500" /> Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{customer.sales.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              desde {new Date(customer.createdAt).getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info + Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" /> Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Teléfono" value={customer.phone} />
            <InfoRow label="Celular" value={customer.mobile} />
            <InfoRow label="Email" value={customer.email} />
            {customer.email && (
              <div className="pt-1">
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" /> {customer.email}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dirección */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" /> Dirección
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Dirección" value={customer.address} />
            <InfoRow label="Barrio" value={customer.neighborhood} />
            <InfoRow label="Ciudad" value={customer.city} />
            <InfoRow label="Departamento" value={customer.department} />
          </CardContent>
        </Card>

        {/* Empleo y referencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4" /> Laboral y Referencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Empleador" value={customer.employer} />
            <InfoRow label="Cargo" value={customer.position} />
            {(customer.reference1Name || customer.reference2Name) && (
              <>
                <Separator className="my-2" />
                <InfoRow label="Ref. 1" value={customer.reference1Name} />
                <InfoRow label="Tel. ref. 1" value={customer.reference1Phone} />
                <InfoRow label="Ref. 2" value={customer.reference2Name} />
                <InfoRow label="Tel. ref. 2" value={customer.reference2Phone} />
              </>
            )}
            {customer.notes && (
              <>
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground">{customer.notes}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historial de ventas */}
      {customer.sales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" /> Historial de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Venta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead className="text-right">Total GS</TableHead>
                  <TableHead className="text-center">Cuotas</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm font-medium">{sale.number}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(sale.date).toLocaleDateString("es-PY")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {sale.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {sale.itemSummary || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {fmt(sale.total)}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {sale.creditSummary ? (
                        <span className={cn(
                          sale.creditSummary.overdue > 0 ? "text-red-600 font-semibold" : ""
                        )}>
                          {sale.creditSummary.paid}/{sale.creditSummary.installments}
                          {sale.creditSummary.overdue > 0 && ` (${sale.creditSummary.overdue} venc.)`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", SALE_STATUS_CLASS[sale.status])}
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        render={<Link href={`/ventas/${sale.id}`} />}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Últimos pagos */}
      {customer.recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Últimos Pagos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Recibo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Venta</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto GS</TableHead>
                  <TableHead>Cobrador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.number}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(p.date).toLocaleDateString("es-PY")}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{p.saleNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-700">
                      {fmt(p.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.collectorName ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {customer.sales.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Este cliente aún no tiene ventas registradas.
          </CardContent>
        </Card>
      )}

      {/* CallMeBot / WhatsApp config */}
      <CallmebotConfig
        customerId={customer.id}
        initialKey={customer.callmebotKey ?? null}
        mobile={customer.mobile ?? null}
      />
    </div>
  );
}
