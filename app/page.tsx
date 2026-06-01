import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { getDashboardStats } from "@/lib/actions/dashboard";
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  AlertTriangle,
  TrendingUp,
  Package,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Mueblería ERP | Dashboard",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
  }).format(amount);
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role || "VENDEDOR";
  const stats = await getDashboardStats();

  const cards = [
    {
      title: "Ventas del Mes",
      value: formatCurrency(stats.monthlySales),
      icon: DollarSign,
      description: "Ventas contado y crédito",
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "Clientes Totales",
      value: stats.totalCustomers,
      icon: Users,
      description: "Base de datos CRM",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Saldo en Calle",
      value: formatCurrency(stats.pendingBalance),
      icon: CreditCard,
      description: "Cuotas pendientes totales",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20",
    },
    {
      title: "Alertas de Stock",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      description: "Productos bajo el mínimo",
      color: stats.lowStockCount > 10 ? "text-red-600 bg-red-50" : "text-zinc-600 bg-zinc-50",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 transition-all">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Bienvenido, {session.user.name}</h1>
            <p className="text-muted-foreground">Resumen ejecutivo del ERP Mueblería.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.title} className="overflow-hidden border-zinc-200/50 shadow-sm transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mt-1">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
             <Card className="lg:col-span-4 border-zinc-200/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-zinc-500" />
                    Vista General de Operaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center border-t border-zinc-100 bg-zinc-50/50">
                   <div className="text-center space-y-2">
                      <p className="text-zinc-400 text-sm">Visualización de ventas proyectada disponible en la base de datos.</p>
                      <Button variant="outline" className="text-xs">Ver Reportes Detallados</Button>
                   </div>
                </CardContent>
             </Card>

             <Card className="lg:col-span-3 border-zinc-200/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-zinc-500" />
                    Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                      { l: "Nueva Venta", d: "Registrar venta contado/crédito", h: "/ventas" },
                      { l: "Cobrar Cuota", d: "Aplicar pago a cliente", h: "/cobranzas" },
                      { l: "Gestión Inventario", d: "Ver movimientos de stock", h: "/productos" }
                    ].map((btn) => (
                      <a href={btn.h} key={btn.l} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50 transition-colors group">
                        <div className="flex flex-col">
                           <span className="font-semibold text-sm">{btn.l}</span>
                           <span className="text-xs text-zinc-500">{btn.d}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-950 transition-colors" />
                      </a>
                    ))}
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// Simple button stub
function Button({ children, variant, className }: any) {
  return (
    <button className={`px-4 py-2 rounded ${variant === 'outline' ? 'border border-zinc-200' : 'bg-black text-white'} ${className}`}>
      {children}
    </button>
  );
}
