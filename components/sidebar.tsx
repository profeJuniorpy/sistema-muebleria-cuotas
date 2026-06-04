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
  logoUrl?: string | null;
  companyName?: string | null;
}

export default function Sidebar({ role, logoUrl, companyName }: SidebarProps) {
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
    <div className="flex h-full flex-col bg-[#1a3a8c] text-white">
      <div className="px-4 py-5 flex items-center gap-3 border-b border-white/10">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt={companyName ?? "Logo"}
            className="h-12 w-12 rounded-full object-contain bg-white p-0.5 shrink-0 shadow"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <span className="text-white text-lg font-bold">
              {(companyName ?? "E").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-sm font-bold leading-tight text-white">
            {companyName ?? "ERP Mueblería"}
          </h1>
          <p className="text-xs text-blue-200 uppercase tracking-widest mt-0.5">
            {role}
          </p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 pt-3">
        <div className="space-y-0.5">
          {filteredRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white",
                pathname === route.href
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-blue-100"
              )}
            >
              <route.icon className="mr-3 h-5 w-5 shrink-0" />
              {route.label}
            </Link>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-auto p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-blue-100 hover:text-white hover:bg-white/10"
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
