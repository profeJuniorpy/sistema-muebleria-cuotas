"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  ChevronRight,
  Clock,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  pendingEmitidosTotal: number;
  pendingEmitidosCount: number;
  pendingRecibidosTotal: number;
  pendingRecibidosCount: number;
  upcomingCount: number;
  rejectedCount: number;
};

type ChequeRow = {
  id: string;
  number: string;
  type: string;
  bankName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  partyName: string;
  partyDocument: string | null;
  concept: string | null;
  customerName: string | null;
  supplierName: string | null;
};

export interface ChequesViewProps {
  stats: Stats;
  cheques: ChequeRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  PENDIENTE: "border-amber-300 text-amber-700 bg-amber-50",
  COBRADO: "border-emerald-300 text-emerald-700 bg-emerald-50",
  RECHAZADO: "border-red-300 text-red-700 bg-red-50",
  ANULADO: "border-slate-300 text-slate-600",
};

const TYPE_CLASS: Record<string, string> = {
  EMITIDO: "border-orange-300 text-orange-700 bg-orange-50",
  RECIBIDO: "border-blue-300 text-blue-700 bg-blue-50",
};

const TYPE_LABEL: Record<string, string> = {
  EMITIDO: "Emitido",
  RECIBIDO: "Recibido",
};

const fmt = (n: number) => new Intl.NumberFormat("es-PY").format(n);

// ─── Component ────────────────────────────────────────────────────────────────

export function ChequesView({ stats, cheques }: ChequesViewProps) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");

  const filtered = useMemo(
    () =>
      cheques.filter((c) => {
        if (type !== "ALL" && c.type !== type) return false;
        if (status !== "ALL" && c.status !== status) return false;
        if (search === "") return true;
        const q = search.toLowerCase();
        return (
          c.number.toLowerCase().includes(q) ||
          c.partyName.toLowerCase().includes(q) ||
          c.bankName.toLowerCase().includes(q)
        );
      }),
    [cheques, search, type, status]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cheques</h1>
          <p className="text-muted-foreground">
            Control de emisión y pago de cheques propios y recibidos de clientes
          </p>
        </div>
        <Button render={<Link href="/cheques/nuevo" />} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Cheque
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" /> Por Pagar (Emitidos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {fmt(stats.pendingEmitidosTotal)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingEmitidosCount} cheque(s) pendiente(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Por Cobrar (Recibidos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {fmt(stats.pendingRecibidosTotal)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingRecibidosCount} cheque(s) pendiente(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Vencen en 7 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.upcomingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">requieren atención pronto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Rechazados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.rejectedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">histórico total</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por N°, banco o nombre..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={type} onValueChange={(v) => setType(v ?? "ALL")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue>{type === "ALL" ? "Todos los tipos" : TYPE_LABEL[type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                <SelectItem value="EMITIDO">Emitidos</SelectItem>
                <SelectItem value="RECIBIDO">Recibidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "ALL")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue>{status === "ALL" ? "Todos los estados" : status}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="COBRADO">Cobrado</SelectItem>
                <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                <SelectItem value="ANULADO">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Cheque</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Beneficiario / Librador</TableHead>
                <TableHead className="text-right">Monto GS</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {search || type !== "ALL" || status !== "ALL"
                      ? "Sin resultados"
                      : "No hay cheques registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm font-medium flex items-center gap-1.5">
                      <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                      {c.number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", TYPE_CLASS[c.type])}>
                        {TYPE_LABEL[c.type] ?? c.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.bankName}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {c.partyName}
                      {(c.customerName || c.supplierName) && (
                        <p className="text-xs text-muted-foreground">
                          {c.customerName ?? c.supplierName}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fmt(c.amount)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(c.dueDate).toLocaleDateString("es-PY")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-xs", STATUS_CLASS[c.status])}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        render={<Link href={`/cheques/${c.id}`} />}
                      >
                        Ver <ChevronRight className="h-3 w-3" />
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
