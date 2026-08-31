"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  CheckCircle,
  Loader2,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import {
  saveCommissionSettings,
  updateSellerRate,
} from "@/lib/actions/commissions";
import { LiquidateDialog } from "./liquidate-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  pendingTotal: number;
  pendingCount: number;
  sellersWithPending: number;
  paidThisMonth: number;
  generatedThisMonth: number;
  generatedCount: number;
};

type SellerSummary = {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerRate: number;
  pendingCount: number;
  pendingAmount: number;
  paidThisMonthAmount: number;
  totalAmount: number;
  pendingCommissionIds: string[];
};

type CommissionDetail = {
  id: string;
  createdAt: string;
  saleId: string;
  saleNumber: string;
  saleType: string;
  customerName: string;
  triggerType: string;
  sellerName: string;
  amount: number;
  rate: number;
  status: string;
  paidAt: string | null;
};

type Settings = {
  id: string;
  cashSaleRate: number;
  creditSaleRate: number;
  trigger: string;
} | null;

type SellerRate = {
  id: string;
  name: string;
  email: string;
  role: string;
  commissionRate: number;
};

export interface ComisionesViewProps {
  stats: Stats;
  sellerSummaries: SellerSummary[];
  commissions: CommissionDetail[];
  settings: Settings;
  sellers: SellerRate[];
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRIGGER_LABEL: Record<string, string> = {
  AL_VENDER: "Al Vender",
  AL_COBRAR_CUOTA: "Al Cobrar Cuota",
  AL_COMPLETAR: "Al Completar Crédito",
};

const TRIGGER_DESC: Record<string, string> = {
  AL_VENDER: "Se genera una comisión en el momento de registrar la venta.",
  AL_COBRAR_CUOTA:
    "Se genera una comisión por cada cuota pagada del crédito.",
  AL_COMPLETAR:
    "Se genera una comisión única cuando el crédito está totalmente pagado.",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ComisionesView({
  stats,
  sellerSummaries,
  commissions,
  settings,
  sellers,
  userId,
}: ComisionesViewProps) {
  const router = useRouter();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerSummary | null>(null);

  // Detail search
  const [detailSearch, setDetailSearch] = useState("");

  // Settings form state
  const [trigger, setTrigger] = useState(settings?.trigger ?? "AL_VENDER");
  const [cashRate, setCashRate] = useState(String(settings?.cashSaleRate ?? 0));
  const [creditRate, setCreditRate] = useState(String(settings?.creditSaleRate ?? 0));
  const [savingSettings, startSavingSettings] = useTransition();

  // Seller rate editing
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [savingRate, startSavingRate] = useTransition();

  const filteredCommissions = useMemo(
    () =>
      commissions.filter(
        (c) =>
          detailSearch === "" ||
          c.sellerName.toLowerCase().includes(detailSearch.toLowerCase()) ||
          c.saleNumber.toLowerCase().includes(detailSearch.toLowerCase()) ||
          c.customerName.toLowerCase().includes(detailSearch.toLowerCase())
      ),
    [commissions, detailSearch]
  );

  function openLiquidate(seller: SellerSummary) {
    setSelectedSeller(seller);
    setDialogOpen(true);
  }

  function handleSaveSettings() {
    startSavingSettings(async () => {
      const result = await saveCommissionSettings({
        cashSaleRate: Number(cashRate),
        creditSaleRate: Number(creditRate),
        trigger: trigger as any,
        updatedBy: userId,
      });
      if (result.success) {
        toast.success("Configuración guardada");
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    });
  }

  function handleSaveRate(userId: string) {
    const rate = Number(editingRates[userId]);
    if (isNaN(rate) || rate < 0) {
      toast.error("Tasa inválida");
      return;
    }
    startSavingRate(async () => {
      const result = await updateSellerRate(userId, rate);
      if (result.success) {
        toast.success("Tasa actualizada");
        router.refresh();
        setEditingRates((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      } else {
        toast.error(result.error ?? "Error al actualizar");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comisiones</h1>
        <p className="text-muted-foreground">
          Seguimiento y liquidación de comisiones del equipo de ventas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BadgeDollarSign className="h-4 w-4 text-amber-500" /> Pendiente Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {new Intl.NumberFormat("es-PY").format(stats.pendingTotal)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingCount} comisión(es) sin pagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Vendedores con Deuda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.sellersWithPending}</p>
            <p className="text-xs text-muted-foreground mt-1">con comisiones pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Pagado este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat("es-PY").format(stats.paidThisMonth)} GS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" /> Generado este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("es-PY").format(stats.generatedThisMonth)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.generatedCount} comisión(es)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vendedores">
        <div className="sticky top-0 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-2 mb-2 bg-background border-b">
          <TabsList>
            <TabsTrigger value="vendedores">Por Vendedor</TabsTrigger>
            <TabsTrigger value="detalle">Detalle</TabsTrigger>
            <TabsTrigger value="configuracion">Configuración</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab: Por Vendedor ── */}
        <TabsContent value="vendedores">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Tasa Personal</TableHead>
                    <TableHead className="text-center">Pendientes</TableHead>
                    <TableHead className="text-right">Monto Pendiente GS</TableHead>
                    <TableHead className="text-right">Pagado este Mes GS</TableHead>
                    <TableHead className="text-right">Total Histórico GS</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellerSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No hay comisiones registradas aún
                      </TableCell>
                    </TableRow>
                  ) : (
                    sellerSummaries.map((s) => (
                      <TableRow key={s.sellerId}>
                        <TableCell>
                          <p className="font-medium">{s.sellerName}</p>
                          <p className="text-xs text-muted-foreground">{s.sellerEmail}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono">
                            {s.sellerRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {s.pendingCount > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-amber-300 text-amber-700 bg-amber-50"
                            >
                              {s.pendingCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {s.pendingAmount > 0 ? (
                            <span className="text-amber-700">
                              {new Intl.NumberFormat("es-PY").format(s.pendingAmount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-emerald-700 font-medium">
                          {s.paidThisMonthAmount > 0
                            ? new Intl.NumberFormat("es-PY").format(s.paidThisMonthAmount)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Intl.NumberFormat("es-PY").format(s.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.pendingCount > 0 ? (
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => openLiquidate(s)}
                            >
                              <BadgeDollarSign className="h-3 w-3" /> Liquidar
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Al día
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Detalle ── */}
        <TabsContent value="detalle">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por vendedor, venta o cliente..."
                  className="pl-10"
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Venta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Tasa %</TableHead>
                    <TableHead className="text-right">Comisión GS</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead>Fecha Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        {detailSearch ? "Sin resultados" : "No hay comisiones registradas"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">
                          {new Date(c.createdAt).toLocaleDateString("es-PY")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{c.saleNumber}</TableCell>
                        <TableCell className="text-sm">{c.customerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TRIGGER_LABEL[c.triggerType] ?? c.triggerType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{c.sellerName}</TableCell>
                        <TableCell className="text-right text-sm font-mono">{c.rate}%</TableCell>
                        <TableCell className="text-right font-semibold">
                          {new Intl.NumberFormat("es-PY").format(c.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              c.status === "PAGADA"
                                ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                : "border-amber-300 text-amber-700 bg-amber-50"
                            )}
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.paidAt
                            ? new Date(c.paidAt).toLocaleDateString("es-PY")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Configuración ── */}
        <TabsContent value="configuracion">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ajustes globales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración Global</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Disparador de Comisión</Label>
                  <Select
                    value={trigger}
                    onValueChange={(v) => { if (v) setTrigger(v); }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AL_VENDER">Al Vender</SelectItem>
                      <SelectItem value="AL_COBRAR_CUOTA">Al Cobrar Cuota</SelectItem>
                      <SelectItem value="AL_COMPLETAR">Al Completar Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                  {trigger && (
                    <p className="text-xs text-muted-foreground">{TRIGGER_DESC[trigger]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tasa Venta Contado (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={cashRate}
                      onChange={(e) => setCashRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tasa Venta Crédito (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={creditRate}
                      onChange={(e) => setCreditRate(e.target.value)}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  La tasa personal de cada vendedor tiene prioridad sobre estas tasas globales.
                  Si la tasa personal es 0, se aplica la tasa global según el tipo de venta.
                </p>

                <Button
                  className="w-full"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
                  ) : (
                    "Guardar Configuración"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tasas por vendedor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tasas por Vendedor</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-center">Rol</TableHead>
                      <TableHead className="text-right">Tasa %</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellers.map((s) => {
                      const isEditing = s.id in editingRates;
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {s.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                className="w-20 h-7 text-right text-sm"
                                value={editingRates[s.id]}
                                onChange={(e) =>
                                  setEditingRates((prev) => ({
                                    ...prev,
                                    [s.id]: e.target.value,
                                  }))
                                }
                              />
                            ) : (
                              <span className="font-mono text-sm">{s.commissionRate}%</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs px-2"
                                  onClick={() => handleSaveRate(s.id)}
                                  disabled={savingRate}
                                >
                                  {savingRate ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "OK"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2"
                                  onClick={() =>
                                    setEditingRates((prev) => {
                                      const next = { ...prev };
                                      delete next[s.id];
                                      return next;
                                    })
                                  }
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() =>
                                  setEditingRates((prev) => ({
                                    ...prev,
                                    [s.id]: String(s.commissionRate),
                                  }))
                                }
                              >
                                Editar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Liquidation dialog */}
      {selectedSeller && (
        <LiquidateDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setSelectedSeller(null); }}
          sellerName={selectedSeller.sellerName}
          pendingAmount={selectedSeller.pendingAmount}
          pendingCount={selectedSeller.pendingCount}
          commissionIds={selectedSeller.pendingCommissionIds}
          userId={userId}
        />
      )}
    </div>
  );
}
