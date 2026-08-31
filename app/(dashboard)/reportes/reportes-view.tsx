"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownToLine,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Clock,
  Loader2,
  Package,
  Phone,
  Printer,
  ShoppingCart,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  Warehouse,
  TrendingDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SalesReport = {
  totalSales: number;
  totalAmount: number;
  avgTicket: number;
  contadoCount: number;
  contadoAmount: number;
  creditoCount: number;
  creditoAmount: number;
  byDay: { date: string; total: number; count: number }[];
  byChannel: { channel: string; count: number; amount: number }[];
  byCategory: { category: string; count: number; amount: number }[];
  topSales: {
    number: string; date: string; customer: string;
    seller: string; type: string; status: string; total: number;
  }[];
};

type CollectionsReport = {
  totalCollected: number;
  totalMora: number;
  paymentCount: number;
  byDay: { date: string; amount: number; count: number }[];
  byMethod: { method: string; amount: number; count: number }[];
  recentPayments: {
    id: string; number: string; date: string; customer: string;
    saleNumber: string; method: string; amount: number; mora: number; collector: string;
  }[];
};

type DelinquencyReport = {
  totalOverdue: number;
  totalEstimatedMora: number;
  customerCount: number;
  avgDaysLate: number;
  customers: {
    customerId: string; name: string; ruc: string;
    mobile: string | null; phone: string | null; city: string | null;
    overdueBalance: number; estimatedMora: number;
    maxDaysLate: number; installmentCount: number;
    sales: { number: string; balance: number; count: number }[];
  }[];
};

type InventoryReport = {
  totalMovements: number;
  totalEntries: number;
  totalExits: number;
  lowStockCount: number;
  byProduct: {
    id: string; code: string; name: string; category: string;
    currentStock: number; minStock: number; status: string;
    entries: number; exits: number; isLow: boolean;
  }[];
};

type ProfitReport = {
  periodRevenue: number;
  periodCost: number;
  periodProfit: number;
  margin: number;
  salesCount: number;
  byDay: { date: string; revenue: number; cost: number; profit: number }[];
  byCategory: { category: string; revenue: number; cost: number; profit: number; margin: number }[];
  byMonth: { month: string; revenue: number; cost: number; profit: number }[];
  bySemester: { month: string; revenue: number; cost: number; profit: number }[];
  byYear: { year: string; revenue: number; cost: number; profit: number }[];
  inventoryValue: {
    totalProducts: number;
    costValue: number;
    saleValue: number;
    potentialProfit: number;
  };
};

export interface ReportesViewProps {
  period: string;
  periodLabel: string;
  salesReport: SalesReport;
  collectionsReport: CollectionsReport;
  delinquencyReport: DelinquencyReport;
  inventoryReport: InventoryReport;
  profitReport: ProfitReport;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  CHEQUE: "Cheque",
};

const CHANNEL_LABEL: Record<string, string> = {
  TIENDA: "Tienda",
  VISITA: "Visita",
  TELEFONICA: "Telefónica",
};

const CATEGORY_LABEL: Record<string, string> = {
  MUEBLES: "Muebles",
  ELECTRODOMESTICOS: "Electrodomésticos",
  ELECTRONICOS: "Electrónicos",
  COLCHONES: "Colchones",
  OTROS: "Otros",
};

const STATUS_CLASS: Record<string, string> = {
  COMPLETADA: "border-emerald-300 text-emerald-700 bg-emerald-50",
  PENDIENTE: "border-amber-300 text-amber-700 bg-amber-50",
  MORA: "border-red-300 text-red-700 bg-red-50",
  CANCELADA: "border-slate-300 text-slate-600",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY").format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PY");
}

function fmtAxisDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: "default" | "emerald" | "red" | "amber" | "blue";
}) {
  const valueClass = {
    default: "",
    emerald: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
  }[color];

  const iconClass = {
    default: "text-primary",
    emerald: "text-emerald-500",
    red: "text-red-500",
    amber: "text-amber-500",
    blue: "text-blue-500",
  }[color];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className={cn("h-4 w-4", iconClass)} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-bold", valueClass)}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function GsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)} GS
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportesView({
  period,
  periodLabel,
  salesReport: sr,
  collectionsReport: cr,
  delinquencyReport: dr,
  inventoryReport: ir,
  profitReport: pr,
}: ReportesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(value: string) {
    startTransition(() => {
      router.push(`/reportes?period=${value}`);
    });
  }

  // ── Sales Chart Data ──
  const salesChartData = sr.byDay.map((d) => ({
    name: fmtAxisDate(d.date),
    total: d.total,
  }));

  const categoryChartData = sr.byCategory.map((c) => ({
    name: CATEGORY_LABEL[c.category] ?? c.category,
    monto: c.amount,
  }));

  const typeData = [
    { name: "Contado", value: sr.contadoAmount, count: sr.contadoCount },
    { name: "Crédito", value: sr.creditoAmount, count: sr.creditoCount },
  ];

  // ── Profit Chart Data ──
  const profitDailyData = pr.byDay.map((d) => ({
    name: fmtAxisDate(d.date),
    Ingresos: d.revenue,
    Costo: d.cost,
    Ganancia: d.profit,
  }));
  const profitMonthlyData = pr.byMonth.map((d) => ({
    name: d.month,
    Ingresos: d.revenue,
    Ganancia: d.profit,
  }));
  const profitSemesterData = pr.bySemester.map((d) => ({
    name: d.month,
    Ingresos: d.revenue,
    Ganancia: d.profit,
  }));
  const profitYearData = pr.byYear.map((d) => ({
    name: d.year,
    Ingresos: d.revenue,
    Ganancia: d.profit,
  }));

  // ── Collections Chart Data ──
  const collectionsChartData = cr.byDay.map((d) => ({
    name: fmtAxisDate(d.date),
    cobrado: d.amount,
  }));

  const methodPieData = cr.byMethod.map((m) => ({
    name: METHOD_LABEL[m.method] ?? m.method,
    value: m.amount,
    count: m.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis de ventas, cobranzas, morosidad e inventario
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Select value={period} onValueChange={(v) => { if (v) handlePeriodChange(v); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">Este mes</SelectItem>
              <SelectItem value="lastMonth">Mes anterior</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="thisYear">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs py-1">
            {periodLabel}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ventas">
        <div className="sticky top-0 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-2 mb-2 bg-background border-b">
          <TabsList>
            <TabsTrigger value="ganancias" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Ganancias
            </TabsTrigger>
            <TabsTrigger value="ventas" className="gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" /> Ventas
            </TabsTrigger>
            <TabsTrigger value="cobranzas" className="gap-1.5">
              <BadgeDollarSign className="h-3.5 w-3.5" /> Cobranzas
            </TabsTrigger>
            <TabsTrigger value="morosidad" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Morosidad
            </TabsTrigger>
            <TabsTrigger value="inventario" className="gap-1.5">
              <Boxes className="h-3.5 w-3.5" /> Inventario
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══ TAB: GANANCIAS ════════════════════════════════════════════════ */}
        <TabsContent value="ganancias" className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => window.open(`/rpt/ganancias?period=${period}`, "_blank")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
            </button>
          </div>

          {/* ── KPIs del período ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={TrendingUp}
              label="Ingresos del Período"
              value={`${fmt(pr.periodRevenue)} GS`}
              sub={`${pr.salesCount} venta(s)`}
              color="blue"
            />
            <KpiCard
              icon={TrendingDown}
              label="Costo de Ventas"
              value={`${fmt(pr.periodCost)} GS`}
              sub="costo de productos vendidos"
              color="red"
            />
            <KpiCard
              icon={DollarSign}
              label="Ganancia Bruta"
              value={`${fmt(pr.periodProfit)} GS`}
              color={pr.periodProfit >= 0 ? "emerald" : "red"}
            />
            <KpiCard
              icon={Percent}
              label="Margen Bruto"
              value={`${pr.margin}%`}
              sub="(ganancia / ingresos)"
              color={pr.margin >= 20 ? "emerald" : pr.margin >= 10 ? "amber" : "red"}
            />
          </div>

          {/* ── Valor del inventario ── */}
          <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-blue-600" />
                Valor del Inventario Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-white border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Productos activos</p>
                  <p className="text-2xl font-bold">{pr.inventoryValue.totalProducts}</p>
                </div>
                <div className="rounded-lg bg-white border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor a Costo</p>
                  <p className="text-2xl font-bold text-red-700">{fmt(pr.inventoryValue.costValue)} GS</p>
                  <p className="text-xs text-muted-foreground">capital invertido en stock</p>
                </div>
                <div className="rounded-lg bg-white border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor a Precio de Venta</p>
                  <p className="text-2xl font-bold text-blue-700">{fmt(pr.inventoryValue.saleValue)} GS</p>
                  <p className="text-xs text-muted-foreground">si se vende todo el stock</p>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Ganancia Potencial</p>
                  <p className="text-2xl font-bold text-emerald-700">{fmt(pr.inventoryValue.potentialProfit)} GS</p>
                  <p className="text-xs text-muted-foreground">venta − costo del stock</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Gráfico diario (período seleccionado) ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Ganancias Diarias — {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profitDailyData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Sin ventas en el período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={profitDailyData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip content={<GsTooltip />} />
                    <Legend iconSize={10} />
                    <Bar dataKey="Ingresos" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Costo" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Ganancia" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ── Gráficos mensual / semestral / anual ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Últimos 12 meses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mensual — últimos 12 meses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={profitMonthlyData} barGap={1}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <Tooltip content={<GsTooltip />} />
                    <Legend iconSize={9} />
                    <Bar dataKey="Ingresos" fill="#93c5fd" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Ganancia" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Últimos 6 meses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Semestral — últimos 6 meses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={profitSemesterData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <Tooltip content={<GsTooltip />} />
                    <Legend iconSize={9} />
                    <Bar dataKey="Ingresos" fill="#60a5fa" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Ganancia" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Últimos 5 años */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Anual — últimos 5 años</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={profitYearData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <Tooltip content={<GsTooltip />} />
                    <Legend iconSize={9} />
                    <Bar dataKey="Ingresos" fill="#818cf8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Ganancia" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ── Ganancias por categoría ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ganancia por Categoría — {periodLabel}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Ingresos GS</TableHead>
                    <TableHead className="text-right">Costo GS</TableHead>
                    <TableHead className="text-right">Ganancia GS</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pr.byCategory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                        Sin datos en el período
                      </TableCell>
                    </TableRow>
                  ) : (
                    pr.byCategory.map((c) => (
                      <TableRow key={c.category}>
                        <TableCell className="font-medium">
                          {CATEGORY_LABEL[c.category] ?? c.category}
                        </TableCell>
                        <TableCell className="text-right text-blue-700 font-semibold">
                          {fmt(c.revenue)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {fmt(c.cost)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-700">
                          {fmt(c.profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "text-sm font-semibold",
                            c.margin >= 20 ? "text-emerald-700" : c.margin >= 10 ? "text-amber-600" : "text-red-600"
                          )}>
                            {c.margin}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {pr.byCategory.length > 0 && (
                    <TableRow className="font-bold bg-zinc-50">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right text-blue-700">{fmt(pr.periodRevenue)}</TableCell>
                      <TableCell className="text-right text-red-600">{fmt(pr.periodCost)}</TableCell>
                      <TableCell className="text-right text-emerald-700">{fmt(pr.periodProfit)}</TableCell>
                      <TableCell className="text-right">{pr.margin}%</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: VENTAS ═══════════════════════════════════════════════════ */}
        <TabsContent value="ventas" className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => window.open(`/rpt/ventas?period=${period}`, "_blank")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
            </button>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={ShoppingCart}
              label="Ventas Totales"
              value={String(sr.totalSales)}
              sub={`${sr.contadoCount} contado · ${sr.creditoCount} crédito`}
            />
            <KpiCard
              icon={TrendingUp}
              label="Monto Total"
              value={`${fmt(sr.totalAmount)} GS`}
              color="emerald"
            />
            <KpiCard
              icon={BarChart3}
              label="Ticket Promedio"
              value={`${fmt(sr.avgTicket)} GS`}
              color="blue"
            />
            <KpiCard
              icon={BadgeDollarSign}
              label="Crédito Otorgado"
              value={`${fmt(sr.creditoAmount)} GS`}
              sub={`${sr.creditoCount} ventas a crédito`}
              color="amber"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales trend */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Monto de Ventas por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesChartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Sin datos para el período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={salesChartData}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                      />
                      <Tooltip content={<GsTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Ventas"
                        stroke="#10b981"
                        fill="url(#salesGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Contado vs Crédito */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Contado vs Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={((v: number) => [`${fmt(v)} GS`, ""]) as any}
                    />
                    <Legend
                      formatter={(value, entry: any) =>
                        `${value} (${entry.payload.count})`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category + Channel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Monto por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Sin datos
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={categoryChartData}
                      layout="vertical"
                      margin={{ left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        width={100}
                      />
                      <Tooltip content={<GsTooltip />} />
                      <Bar dataKey="monto" name="Monto" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Ventas por Canal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {sr.byChannel.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Sin datos
                  </p>
                ) : (
                  sr.byChannel
                    .sort((a, b) => b.amount - a.amount)
                    .map((ch) => {
                      const pct =
                        sr.totalAmount > 0
                          ? Math.round((ch.amount / sr.totalAmount) * 100)
                          : 0;
                      return (
                        <div key={ch.channel}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">
                              {CHANNEL_LABEL[ch.channel] ?? ch.channel}
                            </span>
                            <span className="text-muted-foreground">
                              {ch.count} venta(s) · {pct}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top sales table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Ventas del Período
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Venta</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-right">Total GS</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sr.topSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                        Sin ventas en el período
                      </TableCell>
                    </TableRow>
                  ) : (
                    sr.topSales.map((s) => (
                      <TableRow key={s.number}>
                        <TableCell className="font-mono text-sm">{s.number}</TableCell>
                        <TableCell className="text-sm">{fmtDate(s.date)}</TableCell>
                        <TableCell className="font-medium text-sm">{s.customer}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.seller}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {s.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {fmt(s.total)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", STATUS_CLASS[s.status])}
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: COBRANZAS ════════════════════════════════════════════════ */}
        <TabsContent value="cobranzas" className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => window.open(`/rpt/cobranzas?period=${period}`, "_blank")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
            </button>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={TrendingUp}
              label="Total Cobrado"
              value={`${fmt(cr.totalCollected)} GS`}
              sub={`${cr.paymentCount} pago(s)`}
              color="emerald"
            />
            <KpiCard
              icon={AlertTriangle}
              label="Mora Cobrada"
              value={`${fmt(cr.totalMora)} GS`}
              sub="interés de mora aplicado"
              color="red"
            />
            <KpiCard
              icon={BadgeDollarSign}
              label="Pagos Registrados"
              value={String(cr.paymentCount)}
              sub={`promedio ${cr.paymentCount > 0 ? fmt(Math.round(cr.totalCollected / cr.paymentCount)) : 0} GS`}
              color="blue"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Cobrado por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                {collectionsChartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Sin cobros en el período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={collectionsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                      />
                      <Tooltip content={<GsTooltip />} />
                      <Bar dataKey="cobrado" name="Cobrado" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Por Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                {methodPieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={methodPieData}
                        cx="50%"
                        cy="45%"
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {methodPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={((v: number, _: any, props: any) => [
                          `${fmt(v)} GS (${props.payload.count})`,
                          "",
                        ]) as any}
                      />
                      <Legend iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent payments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Pagos del Período
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cr.recentPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">
                        Sin cobros en el período
                      </TableCell>
                    </TableRow>
                  ) : (
                    cr.recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">{p.number}</TableCell>
                        <TableCell className="text-sm">{fmtDate(p.date)}</TableCell>
                        <TableCell className="font-medium text-sm">{p.customer}</TableCell>
                        <TableCell className="font-mono text-sm">{p.saleNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {METHOD_LABEL[p.method] ?? p.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-700">
                          {fmt(p.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.mora > 0 ? (
                            <span className="text-red-600">{fmt(p.mora)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.collector}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: MOROSIDAD ════════════════════════════════════════════════ */}
        <TabsContent value="morosidad" className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => window.open("/rpt/morosidad", "_blank")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
            </button>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <KpiCard
              icon={AlertTriangle}
              label="Saldo Vencido"
              value={`${fmt(dr.totalOverdue)} GS`}
              color="red"
            />
            <KpiCard
              icon={BadgeDollarSign}
              label="Mora Estimada"
              value={`${fmt(dr.totalEstimatedMora)} GS`}
              sub="interés proyectado"
              color="amber"
            />
            <KpiCard
              icon={Users}
              label="Clientes en Mora"
              value={String(dr.customerCount)}
              color="red"
            />
            <KpiCard
              icon={Clock}
              label="Promedio de Atraso"
              value={`${dr.avgDaysLate} días`}
              sub="atraso máximo promedio"
              color="amber"
            />
          </div>

          {/* Delinquency table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Clientes con Cuotas Vencidas
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (estado actual, independiente del período seleccionado)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>RUC / CI</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-center">Cuotas</TableHead>
                    <TableHead className="text-right">Saldo Vencido GS</TableHead>
                    <TableHead className="text-right">Mora Est. GS</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                    <TableHead>Ventas afectadas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dr.customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                        No hay clientes en mora
                      </TableCell>
                    </TableRow>
                  ) : (
                    dr.customers.map((c) => (
                      <TableRow key={c.customerId}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.ruc}</TableCell>
                        <TableCell className="text-sm">{c.city ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col gap-0.5">
                            {c.mobile && (
                              <span className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3" /> {c.mobile}
                              </span>
                            )}
                            {c.phone && !c.mobile && (
                              <span className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3" /> {c.phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="border-red-300 text-red-700 bg-red-50 text-xs"
                          >
                            {c.installmentCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-700">
                          {fmt(c.overdueBalance)}
                        </TableCell>
                        <TableCell className="text-right text-amber-700">
                          {fmt(c.estimatedMora)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              c.maxDaysLate > 60
                                ? "text-red-600"
                                : c.maxDaysLate > 30
                                ? "text-amber-600"
                                : "text-slate-600"
                            )}
                          >
                            {c.maxDaysLate}d
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.sales.map((s) => s.number).join(", ")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB: INVENTARIO ═══════════════════════════════════════════════ */}
        <TabsContent value="inventario" className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => window.open(`/rpt/inventario?period=${period}`, "_blank")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
            </button>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Package}
              label="Movimientos"
              value={String(ir.totalMovements)}
              sub="en el período"
            />
            <KpiCard
              icon={ArrowDownToLine}
              label="Entradas"
              value={String(ir.totalEntries)}
              sub="unidades ingresadas"
              color="emerald"
            />
            <KpiCard
              icon={TrendingUp}
              label="Salidas"
              value={String(ir.totalExits)}
              sub="unidades vendidas"
              color="blue"
            />
            <KpiCard
              icon={AlertTriangle}
              label="Stock Crítico"
              value={String(ir.lowStockCount)}
              sub="productos bajo mínimo"
              color="red"
            />
          </div>

          {/* Inventory table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Productos — Stock y Movimientos
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (stock actual en tiempo real; movimientos del período)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Mínimo</TableHead>
                    <TableHead className="text-center">Entradas</TableHead>
                    <TableHead className="text-center">Salidas</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ir.byProduct.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                        Sin productos
                      </TableCell>
                    </TableRow>
                  ) : (
                    ir.byProduct.map((p) => (
                      <TableRow
                        key={p.id}
                        className={cn(p.isLow && "bg-red-50/40")}
                      >
                        <TableCell>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.code}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABEL[p.category] ?? p.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              p.isLow ? "text-red-600" : "text-foreground"
                            )}
                          >
                            {p.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {p.minStock}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.entries > 0 ? (
                            <span className="text-emerald-700 font-medium text-sm">
                              +{p.entries}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.exits > 0 ? (
                            <span className="text-blue-700 font-medium text-sm">
                              -{p.exits}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.isLow ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-red-300 text-red-700 bg-red-50"
                            >
                              Stock Bajo
                            </Badge>
                          ) : p.status === "AGOTADO" ? (
                            <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                              Agotado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                            >
                              OK
                            </Badge>
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
      </Tabs>
    </div>
  );
}
