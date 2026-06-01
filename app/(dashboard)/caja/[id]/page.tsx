import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getCajaDetail } from "@/lib/actions/caja";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  Wallet,
  MinusCircle,
  LockKeyhole,
} from "lucide-react";
import CajaRetiroDialog from "@/components/forms/caja-retiro-dialog";
import CajaArqueoDialog from "@/components/forms/caja-arqueo-dialog";
import CajaCierreDialog from "@/components/forms/caja-cierre-dialog";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(n);

const CATEGORY_LABELS: Record<string, string> = {
  PAGO_PROVEEDOR: "Pago proveedor",
  GASTO_OPERATIVO: "Gasto operativo",
  ADELANTO_PERSONAL: "Adelanto personal",
  DEVOLUCION: "Devolución",
  OTRO: "Otro",
};

export default async function CajaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const userId = (session?.user as any)?.id ?? "";
  const role = (session?.user as any)?.role ?? "";
  const canOperate = ["ADMIN", "CAJERO", "SUPERVISOR"].includes(role);

  const caja = await getCajaDetail(params.id);
  if (!caja) notFound();

  const isOpen = caja.status === "ABIERTA";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/caja" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Caja {caja.number}
            </h1>
            <p className="text-muted-foreground">
              Abierta por {caja.openedByName} —{" "}
              {new Date(caja.openedAt).toLocaleString("es-PY")}
            </p>
          </div>
        </div>
        {isOpen && canOperate && (
          <div className="flex items-center gap-2">
            <CajaRetiroDialog cashRegisterId={caja.id} userId={userId} />
            <CajaArqueoDialog
              cashRegisterId={caja.id}
              userId={userId}
              currentSystemBalance={caja.currentSystemBalance}
            />
            <CajaCierreDialog
              cashRegisterId={caja.id}
              userId={userId}
              systemBalance={caja.currentSystemBalance}
            />
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Saldo Inicial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(caja.openingBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 uppercase tracking-wide flex items-center gap-1">
              <ArrowUpCircle className="h-3.5 w-3.5" /> Cobros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">
              +{fmt(caja.paymentsTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {caja.payments.length} pagos recibidos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-red-500 uppercase tracking-wide flex items-center gap-1">
              <ArrowDownCircle className="h-3.5 w-3.5" /> Retiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              -{fmt(caja.withdrawalsTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {caja.withdrawals.length} retiros
            </p>
          </CardContent>
        </Card>
        <Card className={cn(isOpen ? "border-emerald-200 bg-emerald-50/30" : "")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              {isOpen ? "Saldo Actual" : "Saldo Cierre"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {fmt(isOpen ? caja.currentSystemBalance : (caja.systemBalance ?? caja.currentSystemBalance))}
            </p>
            {!isOpen && caja.closingBalance !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Declarado: {fmt(caja.closingBalance)}
              </p>
            )}
            {!isOpen && caja.difference !== null && (
              <p className={cn("text-xs font-medium mt-1", caja.difference === 0 ? "text-emerald-700" : caja.difference < 0 ? "text-red-600" : "text-amber-600")}>
                Diferencia: {caja.difference > 0 ? "+" : ""}{fmt(caja.difference)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-emerald-600" /> Cobros recibidos
          </CardTitle>
          <CardDescription>{caja.payments.length} pagos durante esta sesión</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Recibo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cajero</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caja.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                    Sin cobros en esta sesión.
                  </TableCell>
                </TableRow>
              ) : (
                caja.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.number}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(p.date).toLocaleString("es-PY")}
                    </TableCell>
                    <TableCell>{p.customerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.collectorName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-700">
                      {fmt(p.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MinusCircle className="h-5 w-5 text-red-500" /> Retiros de caja
          </CardTitle>
          <CardDescription>{caja.withdrawals.length} retiros registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Retiro</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caja.withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                    Sin retiros en esta sesión.
                  </TableCell>
                </TableRow>
              ) : (
                caja.withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono text-sm">{w.number}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(w.createdAt).toLocaleString("es-PY")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[w.category] ?? w.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{w.concept}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{w.userName}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      -{fmt(w.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Arqueos */}
      {caja.counts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" /> Arqueos realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {caja.counts.map((c) => (
                <div key={c.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{new Date(c.createdAt).toLocaleString("es-PY")}</p>
                    <p className="text-xs text-muted-foreground">Por {c.userName}</p>
                    {c.notes && <p className="text-xs text-muted-foreground italic">{c.notes}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Sistema</p>
                      <p className="font-semibold">{fmt(c.systemAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contado</p>
                      <p className="font-semibold">{fmt(c.countedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Diferencia</p>
                      <p className={cn("font-bold", c.difference === 0 ? "text-emerald-700" : c.difference < 0 ? "text-red-600" : "text-amber-600")}>
                        {c.difference > 0 ? "+" : ""}{fmt(c.difference)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Close info */}
      {!isOpen && (
        <Card className="border-zinc-200 bg-zinc-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-700">
              <LockKeyhole className="h-5 w-5" /> Caja Cerrada
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Cerrada por</p>
              <p className="font-semibold">{caja.closedByName ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha cierre</p>
              <p className="font-semibold">
                {caja.closedAt ? new Date(caja.closedAt).toLocaleString("es-PY") : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Saldo declarado</p>
              <p className="font-semibold">{caja.closingBalance !== null ? fmt(caja.closingBalance) : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Diferencia final</p>
              <p className={cn("font-bold", !caja.difference ? "text-zinc-700" : caja.difference === 0 ? "text-emerald-700" : caja.difference < 0 ? "text-red-600" : "text-amber-600")}>
                {caja.difference !== null
                  ? `${caja.difference > 0 ? "+" : ""}${fmt(caja.difference)}`
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
