"use client";

import { useState, useMemo } from "react";
import { differenceInDays } from "date-fns";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  CreditCard,
  Printer,
  Search,
  TrendingUp,
  Users,
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
import { PaymentDialog } from "@/components/forms/payment-dialog";

// ─── Types (plain serialized objects from the server) ────────────────────────

type Stats = {
  overdueBalance: number;
  customersInMora: number;
  upcomingCount: number;
  collectedThisMonth: number;
  paymentsCount: number;
};

type PendingInstallment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  total: number;
  paidAmount: number;
  balance: number;
  status: string;
  saleId: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string | null;
};

type PaymentRecord = {
  id: string;
  number: string;
  date: string;
  amount: number;
  lateInterestApplied: number;
  paymentMethod: string;
  notes: string | null;
  customerId: string;
  customerName: string;
  saleId: string;
  saleNumber: string;
  collectorName: string | null;
};

type Customer = {
  id: string;
  name: string;
  ruc: string;
  mobile: string | null;
};

export interface CobranzasViewProps {
  stats: Stats;
  pendingInstallments: PendingInstallment[];
  paymentHistory: PaymentRecord[];
  customers: Customer[];
  userId: string;
}

// ─── Label maps ──────────────────────────────────────────────────────────────

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  CHEQUE: "Cheque",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function CobranzasView({
  stats,
  pendingInstallments,
  paymentHistory,
  customers,
  userId,
}: CobranzasViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<{
    customerId: string;
    saleId: string;
    installmentId: string;
  } | undefined>();
  const [cuotasSearch, setCuotasSearch] = useState("");
  const [historialSearch, setHistorialSearch] = useState("");

  const now = new Date();

  const filteredCuotas = useMemo(
    () =>
      pendingInstallments.filter(
        (i) =>
          cuotasSearch === "" ||
          i.customerName.toLowerCase().includes(cuotasSearch.toLowerCase()) ||
          i.saleNumber.toLowerCase().includes(cuotasSearch.toLowerCase())
      ),
    [pendingInstallments, cuotasSearch]
  );

  const filteredHistorial = useMemo(
    () =>
      paymentHistory.filter(
        (p) =>
          historialSearch === "" ||
          p.customerName.toLowerCase().includes(historialSearch.toLowerCase()) ||
          p.number.toLowerCase().includes(historialSearch.toLowerCase()) ||
          p.saleNumber.toLowerCase().includes(historialSearch.toLowerCase())
      ),
    [paymentHistory, historialSearch]
  );

  function openForInstallment(inst: PendingInstallment) {
    setSelected({ customerId: inst.customerId, saleId: inst.saleId, installmentId: inst.id });
    setDialogOpen(true);
  }

  function openGeneric() {
    setSelected(undefined);
    setDialogOpen(true);
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setSelected(undefined);
  }

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cobranzas</h1>
          <p className="text-muted-foreground">Gestión de pagos y cuotas de clientes</p>
        </div>
        <Button onClick={openGeneric} className="gap-2">
          <CreditCard className="h-4 w-4" /> Registrar Pago
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Saldo Vencido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("es-PY").format(stats.overdueBalance)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">cuotas en mora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" /> Clientes en Mora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.customersInMora}</p>
            <p className="text-xs text-muted-foreground mt-1">con cuotas vencidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Cobrado este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat("es-PY").format(stats.collectedThisMonth)} GS
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stats.paymentsCount} pagos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" /> Próximas a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.upcomingCount}</p>
            <p className="text-xs text-muted-foreground mt-1">en los próximos 7 días</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="cuotas">
        <div className="sticky top-0 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-2 mb-2 bg-background border-b">
          <TabsList>
            <TabsTrigger value="cuotas" className="gap-2">
              Cuotas Pendientes
              {filteredCuotas.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {filteredCuotas.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historial">Historial de Pagos</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab: Cuotas pendientes ── */}
        <TabsContent value="cuotas">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente o Nº venta..."
                  className="pl-10"
                  value={cuotasSearch}
                  onChange={(e) => setCuotasSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Venta</TableHead>
                    <TableHead className="text-center">Cuota</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Total GS</TableHead>
                    <TableHead className="text-right">Saldo GS</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Atraso</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCuotas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        {cuotasSearch
                          ? "Sin resultados para la búsqueda"
                          : "No hay cuotas pendientes"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCuotas.map((inst) => {
                      const dueDate = new Date(inst.dueDate);
                      const daysLate = now > dueDate ? differenceInDays(now, dueDate) : 0;

                      return (
                        <TableRow
                          key={inst.id}
                          className={cn(inst.status === "VENCIDA" && "bg-red-50/40")}
                        >
                          <TableCell>
                            <p className="font-medium">{inst.customerName}</p>
                            {inst.customerMobile && (
                              <p className="text-xs text-muted-foreground">{inst.customerMobile}</p>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{inst.saleNumber}</TableCell>
                          <TableCell className="text-center font-medium">
                            #{inst.installmentNumber}
                          </TableCell>
                          <TableCell>{dueDate.toLocaleDateString("es-PY")}</TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat("es-PY").format(inst.total)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {new Intl.NumberFormat("es-PY").format(inst.balance)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                inst.status === "VENCIDA"
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : inst.status === "PARCIAL"
                                  ? "border-amber-300 text-amber-700 bg-amber-50"
                                  : "border-slate-300 text-slate-700"
                              )}
                            >
                              {inst.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {daysLate > 0 ? (
                              <span className="text-red-600 font-semibold text-sm">
                                {daysLate}d
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={() => openForInstallment(inst)}
                            >
                              Cobrar <ChevronRight className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Historial de pagos ── */}
        <TabsContent value="historial">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente o Nº recibo..."
                  className="pl-10"
                  value={historialSearch}
                  onChange={(e) => setHistorialSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Recibo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Venta</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto GS</TableHead>
                    <TableHead className="text-right">Mora GS</TableHead>
                    <TableHead>Cobrador</TableHead>
                    <TableHead className="text-right">Recibo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistorial.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        {historialSearch
                          ? "Sin resultados para la búsqueda"
                          : "No hay pagos registrados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistorial.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm font-medium">{p.number}</TableCell>
                        <TableCell>{new Date(p.date).toLocaleDateString("es-PY")}</TableCell>
                        <TableCell className="font-medium">{p.customerName}</TableCell>
                        <TableCell className="font-mono text-sm">{p.saleNumber}</TableCell>
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
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              window.open(`/rpt/recibo/${p.id}`, "_blank")
                            }
                          >
                            <Printer className="h-3 w-3" /> Reimprimir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialog de pago ── */}
      <PaymentDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        customers={customers}
        userId={userId}
        initialCustomerId={selected?.customerId}
        initialSaleId={selected?.saleId}
        initialInstallmentId={selected?.installmentId}
      />
    </div>
  );
}
