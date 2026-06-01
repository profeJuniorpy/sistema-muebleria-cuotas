import Link from "next/link";
import {
  ChevronLeft,
  FileLock2,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import { getUserCountsByRole } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Definición de roles y permisos ──────────────────────────────────────────

type RoleDef = {
  key: string;
  label: string;
  description: string;
  color: string;
  badgeClass: string;
  modules: { name: string; access: "completo" | "lectura" | "no" }[];
};

const ROLES: RoleDef[] = [
  {
    key: "ADMIN",
    label: "Administrador",
    description: "Acceso completo al sistema. Gestiona usuarios, configuración global y todos los módulos.",
    color: "text-purple-700",
    badgeClass: "border-purple-300 text-purple-700 bg-purple-50",
    modules: [
      { name: "Dashboard", access: "completo" },
      { name: "Ventas", access: "completo" },
      { name: "Clientes", access: "completo" },
      { name: "Productos / Stock", access: "completo" },
      { name: "Cobranzas", access: "completo" },
      { name: "Créditos", access: "completo" },
      { name: "Comisiones", access: "completo" },
      { name: "Reportes", access: "completo" },
      { name: "Compras", access: "completo" },
      { name: "Referenciales", access: "completo" },
      { name: "Configuración", access: "completo" },
    ],
  },
  {
    key: "SUPERVISOR",
    label: "Supervisor",
    description: "Supervisión de operaciones. Accede a todos los módulos comerciales y reportes.",
    color: "text-blue-700",
    badgeClass: "border-blue-300 text-blue-700 bg-blue-50",
    modules: [
      { name: "Dashboard", access: "completo" },
      { name: "Ventas", access: "completo" },
      { name: "Clientes", access: "completo" },
      { name: "Productos / Stock", access: "completo" },
      { name: "Cobranzas", access: "completo" },
      { name: "Créditos", access: "completo" },
      { name: "Comisiones", access: "completo" },
      { name: "Reportes", access: "completo" },
      { name: "Compras", access: "completo" },
      { name: "Referenciales", access: "no" },
      { name: "Configuración", access: "no" },
    ],
  },
  {
    key: "VENDEDOR",
    label: "Vendedor",
    description: "Registro de ventas y gestión de clientes. Ve sus propias comisiones.",
    color: "text-emerald-700",
    badgeClass: "border-emerald-300 text-emerald-700 bg-emerald-50",
    modules: [
      { name: "Dashboard", access: "completo" },
      { name: "Ventas", access: "completo" },
      { name: "Clientes", access: "completo" },
      { name: "Productos / Stock", access: "lectura" },
      { name: "Cobranzas", access: "no" },
      { name: "Créditos", access: "no" },
      { name: "Comisiones", access: "lectura" },
      { name: "Reportes", access: "no" },
      { name: "Compras", access: "no" },
      { name: "Referenciales", access: "no" },
      { name: "Configuración", access: "no" },
    ],
  },
  {
    key: "CAJERO",
    label: "Cajero",
    description: "Registra cobros y gestiona cuotas. Acceso a reportes básicos.",
    color: "text-amber-700",
    badgeClass: "border-amber-300 text-amber-700 bg-amber-50",
    modules: [
      { name: "Dashboard", access: "completo" },
      { name: "Ventas", access: "no" },
      { name: "Clientes", access: "lectura" },
      { name: "Productos / Stock", access: "no" },
      { name: "Cobranzas", access: "completo" },
      { name: "Créditos", access: "completo" },
      { name: "Comisiones", access: "no" },
      { name: "Reportes", access: "lectura" },
      { name: "Compras", access: "no" },
      { name: "Referenciales", access: "no" },
      { name: "Configuración", access: "no" },
    ],
  },
  {
    key: "ALMACEN",
    label: "Almacén",
    description: "Gestión de stock y registro de compras a proveedores.",
    color: "text-slate-700",
    badgeClass: "border-slate-300 text-slate-700 bg-slate-50",
    modules: [
      { name: "Dashboard", access: "completo" },
      { name: "Ventas", access: "no" },
      { name: "Clientes", access: "no" },
      { name: "Productos / Stock", access: "completo" },
      { name: "Cobranzas", access: "no" },
      { name: "Créditos", access: "no" },
      { name: "Comisiones", access: "no" },
      { name: "Reportes", access: "no" },
      { name: "Compras", access: "completo" },
      { name: "Referenciales", access: "no" },
      { name: "Configuración", access: "no" },
    ],
  },
];

const ACCESS_BADGE = {
  completo: "border-emerald-300 text-emerald-700 bg-emerald-50",
  lectura: "border-blue-300 text-blue-700 bg-blue-50",
  no: "border-slate-200 text-slate-400",
};

const ACCESS_LABEL = {
  completo: "Completo",
  lectura: "Solo lectura",
  no: "Sin acceso",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RolesPage() {
  const counts = await getUserCountsByRole();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href="/referenciales" />}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
          <p className="text-muted-foreground">
            Niveles de acceso y módulos habilitados por rol
          </p>
        </div>
      </div>

      {/* Resumen de roles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ROLES.map((role) => (
          <Card key={role.key}>
            <CardContent className="pt-4 pb-3 text-center">
              <FileLock2 className={cn("h-6 w-6 mx-auto mb-2", role.color)} />
              <p className={cn("font-semibold text-sm", role.color)}>{role.label}</p>
              <p className="text-2xl font-bold mt-1">{counts[role.key] ?? 0}</p>
              <p className="text-xs text-muted-foreground">usuario(s) activo(s)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detalle de cada rol */}
      <div className="space-y-4">
        {ROLES.map((role) => (
          <Card key={role.key}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <CardTitle className={cn("text-base", role.color)}>{role.label}</CardTitle>
                  <Badge variant="outline" className={cn("text-xs", role.badgeClass)}>
                    {counts[role.key] ?? 0} usuario(s)
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead className="text-center">Nivel de Acceso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {role.modules.map((mod) => (
                    <TableRow key={mod.name}>
                      <TableCell className="text-sm">{mod.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", ACCESS_BADGE[mod.access])}
                        >
                          {mod.access === "completo" && (
                            <ShieldCheck className="h-3 w-3 mr-1" />
                          )}
                          {mod.access === "no" && (
                            <ShieldAlert className="h-3 w-3 mr-1" />
                          )}
                          {ACCESS_LABEL[mod.access]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <Users className="h-4 w-4 shrink-0" />
        Los roles están definidos en el sistema y no pueden modificarse desde la interfaz.
        Para reasignar el rol de un usuario, editá su perfil en{" "}
        <Link href="/referenciales/usuarios" className="underline hover:text-foreground">
          Usuarios y Empleados
        </Link>.
      </div>
    </div>
  );
}
