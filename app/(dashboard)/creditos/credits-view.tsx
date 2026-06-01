"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { differenceInDays } from "date-fns";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronRight,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  activeCount: number;
  moraCount: number;
  totalFinanced: number;
  totalPendingBalance: number;
};

type CreditRow = {
  saleId: string;
  saleNumber: string;
  date: string;
  saleStatus: string;
  customerId: string;
  customerName: string;
  customerRisk: string;
  financedAmount: number;
  totalInstallments: number;
  frequency: string;
  installmentAmount: number;
  paidInstallments: number;
  overdueInstallments: number;
  pendingBalance: number;
  nextDueDate: string | null;
  nextDueAmount: number | null;
};

export interface CreditsViewProps {
  stats: Stats;
  credits: CreditRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<string, string> = {
  MENSUAL: "Mensual",
  QUINCENAL: "Quincenal",
  SEMANAL: "Semanal",
};

const RISK_CLASS: Record<string, string> = {
  BAJO: "border-emerald-400 text-emerald-700 bg-emerald-50",
  MEDIO: "border-amber-400 text-amber-700 bg-amber-50",
  ALTO: "border-red-400 text-red-700 bg-red-50",
};

function creditStatus(saleStatus: string, overdueCount: number) {
  if (saleStatus === "COMPLETADA") return { label: "Completado", cls: "border-emerald-400 text-emerald-700 bg-emerald-50" };
  if (saleStatus === "CANCELADA") return { label: "Cancelado", cls: "border-slate-400 text-slate-600 bg-slate-50" };
  if (saleStatus === "MORA" || overdueCount > 0) return { label: "En Mora", cls: "border-red-400 text-red-700 bg-red-50" };
  return { label: "Al día", cls: "border-green-400 text-green-700 bg-green-50" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreditsView({ stats, credits }: CreditsViewProps) {
  const [search, setSearch] = useState("");

  const now = new Date();

  const filtered = useMemo(
    () =>
      credits.filter(
        (c) =>
          search === "" ||
          c.customerName.toLowerCase().includes(search.toLowerCase()) ||
          c.saleNumber.toLowerCase().includes(search.toLowerCase())
      ),
    [credits, search]
  );

  const todos = filtered;
  const enMora = filtered.filter(
    (c) => c.saleStatus === "MORA" || c.overdueInstallments > 0
  );
  const completados = filtered.filter((c) => c.saleStatus === "COMPLETADA");
  const alDia = filtered.filter(
    (c) =>
      (c.saleStatus === "PENDIENTE") &&
      c.overdueInstallments === 0
  );

  function CreditTable({ rows }: { rows: CreditRow[] }) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Venta</TableHead>
            <TableHead className="text-right">Financiado GS</TableHead>
            <TableHead>Cuota</TableHead>
            <TableHead className="text-center">Progreso</TableHead>
            <TableHead className="text-right">Saldo GS</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-center">Próx. Cuota</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                {search ? "Sin resultados" : "No hay créditos en esta categoría"}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((c) => {
              const st = creditStatus(c.saleStatus, c.overdueInstallments);
              const pct =
                c.totalInstallments > 0
                  ? Math.round((c.paidInstallments / c.totalInstallments) * 100)
                  : 0;
              const nextDate = c.nextDueDate ? new Date(c.nextDueDate) : null;
              const daysToNext = nextDate
                ? differenceInDays(nextDate, now)
                : null;

              return (
                <TableRow
                  key={c.saleId}
                  className={cn(
                    (c.saleStatus === "MORA" || c.overdueInstallments > 0) &&
                      "bg-red-50/40"
                  )}
                >
                  <TableCell>
                    <p className="font-medium">{c.customerName}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-xs mt-0.5", RISK_CLASS[c.customerRisk])}
                    >
                      {c.customerRisk}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <p className="font-mono text-sm font-medium">{c.saleNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.date).toLocaleDateString("es-PY")}
                    </p>
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat("es-PY").format(c.financedAmount)}
                  </TableCell>

                  <TableCell>
                    <p className="font-medium text-sm">
                      {new Intl.NumberFormat("es-PY").format(c.installmentAmount)} GS
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {FREQ_LABEL[c.frequency] ?? c.frequency}
                    </p>
                  </TableCell>

                  <TableCell className="text-center min-w-[120px]">
                    <p className="text-xs text-muted-foreground mb-1">
                      {c.paidInstallments} / {c.totalInstallments} cuotas
                    </p>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          pct === 100
                            ? "bg-emerald-500"
                            : c.overdueInstallments > 0
                            ? "bg-red-500"
                            : "bg-primary"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </TableCell>

                  <TableCell className="text-right font-semibold">
                    {c.saleStatus === "COMPLETADA" ? (
                      <span className="text-emerald-600">—</span>
                    ) : (
                      new Intl.NumberFormat("es-PY").format(c.pendingBalance)
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn("text-xs", st.cls)}>
                      {st.label}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    {nextDate ? (
                      <div>
                        <p className="text-xs font-medium">
                          {nextDate.toLocaleDateString("es-PY")}
                        </p>
                        {daysToNext !== null && (
                          <p
                            className={cn(
                              "text-xs",
                              daysToNext < 0
                                ? "text-red-600 font-semibold"
                                : daysToNext <= 7
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            )}
                          >
                            {daysToNext < 0
                              ? `${Math.abs(daysToNext)}d vencida`
                              : daysToNext === 0
                              ? "Hoy"
                              : `en ${daysToNext}d`}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      render={<Link href={`/creditos/${c.saleId}`} />}
                    >
                      Ver <ChevronRight className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cartera de Créditos</h1>
        <p className="text-muted-foreground">
          Seguimiento de planes de financiamiento y niveles de riesgo
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Cartera Activa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">créditos vigentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Total Financiado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("es-PY").format(stats.totalFinanced)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">en cartera activa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-500" /> Saldo por Cobrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat("es-PY").format(stats.totalPendingBalance)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">cuotas pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> En Mora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.moraCount}</p>
            <p className="text-xs text-muted-foreground mt-1">créditos vencidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <Tabs defaultValue="todos">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="todos" className="gap-1.5">
              Todos
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {todos.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="mora" className="gap-1.5">
              En Mora
              {enMora.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-red-100 text-red-700">
                  {enMora.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="aldia">Al día</TabsTrigger>
            <TabsTrigger value="completados">Completados</TabsTrigger>
          </TabsList>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o Nº venta..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <TabsContent value="todos" className="m-0">
              <CreditTable rows={todos} />
            </TabsContent>
            <TabsContent value="mora" className="m-0">
              <CreditTable rows={enMora} />
            </TabsContent>
            <TabsContent value="aldia" className="m-0">
              <CreditTable rows={alDia} />
            </TabsContent>
            <TabsContent value="completados" className="m-0">
              <CreditTable rows={completados} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
