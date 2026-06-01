"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, CreditCard, Package, Plus, Search, Truck, Wallet } from "lucide-react";

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
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  monthlyTotal: number;
  monthlyCount: number;
  pendingBalance: number;
  activeCreditCount: number;
  suppliersCount: number;
};

type PurchaseRow = {
  id: string;
  number: string;
  date: string;
  supplierId: string;
  supplierName: string;
  type: string;
  status: string;
  total: number;
  itemCount: number;
  pendingBalance: number;
};

export interface ComprasViewProps {
  stats: Stats;
  purchases: PurchaseRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<string, string> = {
  COMPLETADA: "border-emerald-300 text-emerald-700 bg-emerald-50",
  PENDIENTE: "border-amber-300 text-amber-700 bg-amber-50",
  MORA: "border-red-300 text-red-700 bg-red-50",
  CANCELADA: "border-slate-300 text-slate-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ComprasView({ stats, purchases }: ComprasViewProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      purchases.filter(
        (p) =>
          search === "" ||
          p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
          p.number.toLowerCase().includes(search.toLowerCase())
      ),
    [purchases, search]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">
            Registro de facturas de proveedores e ingreso de mercadería
          </p>
        </div>
        <Button render={<Link href="/compras/nueva" />} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Compra
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Compras este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("es-PY").format(stats.monthlyTotal)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stats.monthlyCount} compra(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Cuentas por Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {new Intl.NumberFormat("es-PY").format(stats.pendingBalance)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">saldo pendiente a proveedores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-500" /> Créditos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.activeCreditCount}</p>
            <p className="text-xs text-muted-foreground mt-1">compras al crédito vigentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" /> Proveedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.suppliersCount}</p>
            <p className="text-xs text-muted-foreground mt-1">registrados en el sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por proveedor o Nº compra..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Compra</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-center">Productos</TableHead>
                <TableHead className="text-right">Total GS</TableHead>
                <TableHead className="text-right">Saldo GS</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {search ? "Sin resultados" : "No hay compras registradas"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {p.number}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(p.date).toLocaleDateString("es-PY")}
                    </TableCell>
                    <TableCell className="font-medium">{p.supplierName}</TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-sm">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {p.itemCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat("es-PY").format(p.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.pendingBalance > 0 ? (
                        <span className="text-amber-700 font-medium">
                          {new Intl.NumberFormat("es-PY").format(p.pendingBalance)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", STATUS_CLASS[p.status])}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        render={<Link href={`/compras/${p.id}`} />}
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
