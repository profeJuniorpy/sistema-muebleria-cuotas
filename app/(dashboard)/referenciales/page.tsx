import prisma from "@/lib/prisma";
import { Users, FileLock2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReferencialesPage() {
  const [suppliersCount, usersCount] = await Promise.all([
    prisma.supplier.count(),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  const cards = [
    {
      title: "Proveedores",
      description:
        "Gestión de distribuidores, importadores y sus datos de contacto para compras.",
      icon: Truck,
      href: "/referenciales/proveedores",
      stat: suppliersCount,
      statLabel: "registrados",
      color: "text-primary",
    },
    {
      title: "Usuarios y Empleados",
      description:
        "Control de accesos, información personal y tasas de comisión por vendedor.",
      icon: Users,
      href: "/referenciales/usuarios",
      stat: usersCount,
      statLabel: "activos",
      color: "text-blue-600",
    },
    {
      title: "Roles y Permisos",
      description:
        "Niveles de autorización: qué módulos puede acceder cada tipo de empleado.",
      icon: FileLock2,
      href: "/referenciales/roles",
      stat: 5,
      statLabel: "roles disponibles",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tablas Referenciales</h1>
        <p className="text-muted-foreground">
          Administración de datos base del ERP — proveedores, usuarios y permisos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.href}
            className="hover:bg-muted/40 transition-colors"
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
                <p className="text-2xl font-bold mt-1">
                  {card.stat}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {card.statLabel}
                  </span>
                </p>
              </div>
              <card.icon className={`h-6 w-6 mt-1 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{card.description}</CardDescription>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                render={<Link href={card.href} />}
              >
                Administrar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
