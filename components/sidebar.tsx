"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  CreditCard,
  History,
  TrendingUp,
  Settings,
  LogOut,
  PackagePlus,
  BadgeDollarSign,
  FileText,
  Menu,
  Database,
  Truck,
  Wallet,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
      roles: ["ADMIN", "VENDEDOR", "CAJERO", "ALMACEN", "SUPERVISOR"],
    },
    {
      label: "Ventas",
      icon: ShoppingCart,
      href: "/ventas",
      roles: ["ADMIN", "VENDEDOR", "SUPERVISOR"],
    },
    {
      label: "Clientes",
      icon: Users,
      href: "/clientes",
      roles: ["ADMIN", "VENDEDOR", "CAJERO", "SUPERVISOR"],
    },
    {
      label: "Productos / Stock",
      icon: Package,
      href: "/productos",
      roles: ["ADMIN", "VENDEDOR", "ALMACEN", "SUPERVISOR"],
    },
    {
      label: "Cobranzas",
      icon: CreditCard,
      href: "/cobranzas",
      roles: ["ADMIN", "CAJERO", "SUPERVISOR"],
    },
    {
      label: "Créditos",
      icon: History,
      href: "/creditos",
      roles: ["ADMIN", "CAJERO", "SUPERVISOR"],
    },
    {
      label: "Comisiones",
      icon: BadgeDollarSign,
      href: "/comisiones",
      roles: ["ADMIN", "VENDEDOR", "SUPERVISOR"],
    },
    {
      label: "Caja",
      icon: Wallet,
      href: "/caja",
      roles: ["ADMIN", "CAJERO", "SUPERVISOR"],
    },
    {
      label: "Notificaciones",
      icon: Bell,
      href: "/notificaciones",
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      label: "Reportes",
      icon: TrendingUp,
      href: "/reportes",
      roles: ["ADMIN", "SUPERVISOR", "CAJERO"],
    },
    {
      label: "Compras",
      icon: Truck,
      href: "/compras",
      roles: ["ADMIN", "ALMACEN", "SUPERVISOR"],
    },
    {
      label: "Referenciales",
      icon: Database,
      href: "/referenciales",
      roles: ["ADMIN"],
    },
    {
      label: "Configuración",
      icon: Settings,
      href: "/configuracion",
      roles: ["ADMIN"],
    },
  ];

  const filteredRoutes = routes.filter((route) => route.roles.includes(role));

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-zinc-950 text-white">
      <div className="px-6 py-8">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Mueblería ERP
        </h1>
        <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">
          {role} Panel
        </p>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {filteredRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 hover:text-white",
                pathname === route.href
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400"
              )}
            >
              <route.icon className="mr-3 h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-auto p-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={() => signOut()}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon" className="bg-white" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 b-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
