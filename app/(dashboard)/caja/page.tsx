import { auth } from "@/lib/auth";
import { getCajaStats, getCajas } from "@/lib/actions/caja";
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
import Link from "next/link";
import { cn } from "@/lib/utils";
import {

export const dynamic = "force-dynamic";
  Wallet,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  TrendingUp,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(n);

export default async function CajaPage() {
  const session = await auth();
  const [{ openCaja, totalCajas }, cajas] = await Promise.all([
    getCajaStats(),
    getCajas(),
  ]);

  const role = (session?.user as any)?.role ?? "VENDEDOR";
  const canOpen = ["ADMIN", "CAJERO", "SUPERVISOR"].includes(role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
          <p className="text-muted-foreground">
            Control de apertura, cierre, arqueos y retiros de efectivo.
          </p>
        </div>
        {canOpen && !openCaja && (
          <Button render={<Link href="/caja/abrir" />} className="gap-2">
            <Plus className="h-4 w-4" /> Abrir Caja
          </Button>
        )}
      </div>

      {/* Current state */}
      {openCaja ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-100">
                  <Wallet className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <CardTitle className="text-emerald-900">
                    Caja {openCaja.number} — Abierta
                  </CardTitle>
                  <CardDescription>
                    Abierta por {openCaja.openedByName} el{" "}
                    {new Date(openCaja.openedAt).toLocaleString("es-PY")}
                  </CardDescription>
                </div>
              </div>
              <Button render={<Link href={`/caja/${openCaja.id}`} />} variant="outline">
                Ver detalle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-white border p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo Inicial</p>
                <p className="text-xl font-bold">{fmt(openCaja.openingBalance)}</p>
              </div>
              <div className="rounded-lg bg-white border p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <ArrowUpCircle className="h-3 w-3 text-emerald-600" /> Cobros
                </p>
                <p className="text-xl font-bold text-emerald-700">
                  +{fmt(openCaja.paymentsReceived)}
                </p>
                <p className="text-xs text-muted-foreground">{openCaja.paymentsCount} cobros</p>
              </div>
              <div className="rounded-lg bg-white border p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <ArrowDownCircle className="h-3 w-3 text-red-500" /> Retiros
                </p>
                <p className="text-xl font-bold text-red-600">
                  -{fmt(openCaja.withdrawalsTotal)}
                </p>
                <p className="text-xs text-muted-foreground">{openCaja.withdrawalsCount} retiros</p>
              </div>
              <div className="rounded-lg bg-emerald-100 border border-emerald-200 p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Saldo Actual
                </p>
                <p className="text-xl font-bold text-emerald-800">
                  {fmt(openCaja.systemBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="p-4 rounded-full bg-zinc-100">
              <Wallet className="h-8 w-8 text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">No hay caja abierta</p>
              <p className="text-muted-foreground text-sm">
                Abrí la caja para empezar a registrar operaciones del día.
              </p>
            </div>
            {canOpen && (
              <Button render={<Link href="/caja/abrir" />} className="gap-2">
                <Plus className="h-4 w-4" /> Abrir Caja
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Historial de Cajas
          </CardTitle>
          <CardDescription>{totalCajas} sesiones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Caja</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Abierta por</TableHead>
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead className="text-right">Saldo Inicial</TableHead>
                <TableHead className="text-right">Saldo Sistema</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cajas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No hay cajas registradas.
                  </TableCell>
                </TableRow>
              ) : (
                cajas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold">{c.number}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          c.status === "ABIERTA"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-100 text-zinc-700"
                        )}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.openedByName}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(c.openedAt).toLocaleString("es-PY")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.closedAt ? new Date(c.closedAt).toLocaleString("es-PY") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt(c.openingBalance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.systemBalance !== null ? fmt(c.systemBalance) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.difference !== null ? (
                        <span
                          className={cn(
                            "font-medium",
                            c.difference === 0
                              ? "text-emerald-700"
                              : c.difference < 0
                              ? "text-red-600"
                              : "text-amber-600"
                          )}
                        >
                          {c.difference > 0 ? "+" : ""}
                          {fmt(c.difference)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/caja/${c.id}`} />}
                      >
                        Ver
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
