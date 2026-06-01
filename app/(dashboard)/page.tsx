import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SalesChart from "@/components/charts/sales-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";

async function getStats() {
  const [salesCount, customersCount, totalSales, lowStockResult] = await Promise.all([
    prisma.sale.count(),
    prisma.customer.count(),
    prisma.sale.aggregate({ _sum: { total: true } }),
    prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "Product" WHERE stock <= "minStock"`,
  ]);

  return {
    salesCount,
    customersCount,
    totalSales: Number(totalSales._sum.total || 0),
    lowStock: Number(lowStockResult[0]?.count || 0),
  };
}

const mockChartData = [
  { name: "Ene", total: 12000000 },
  { name: "Feb", total: 18500000 },
  { name: "Mar", total: 15000000 },
  { name: "Abr", total: 22000000 },
  { name: "May", total: 30000000 },
  { name: "Jun", total: 28000000 },
];

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
        <p className="text-muted-foreground text-lg">
          Resumen operativo y financiero de la inmobiliaria.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat().format(stats.totalSales)} GS</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12% desde el último mes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Nuevos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.customersCount}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Total registrado en el sistema
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cartera en Mora</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2M GS</div>
            <p className="text-xs text-amber-600 flex items-center mt-1">
              8 cuotas vencidas detectadas
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-red-100 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Crítico</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
            <p className="text-xs text-red-500 mt-1">
              Productos requieren reposición
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <SalesChart data={mockChartData} />
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Canales de Venta</CardTitle>
            <CardDescription>Distribución por origen de captación.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-full bg-zinc-100 rounded-full h-2.5">
                  <div className="bg-emerald-500 h-2.5 rounded-full w-[65%]"></div>
                </div>
                <span className="ml-4 text-sm font-medium">Tienda (65%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-full bg-zinc-100 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full w-[25%]"></div>
                </div>
                <span className="ml-4 text-sm font-medium">Redes (25%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-full bg-zinc-100 rounded-full h-2.5">
                  <div className="bg-amber-400 h-2.5 rounded-full w-[10%]"></div>
                </div>
                <span className="ml-4 text-sm font-medium">Visita (10%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
