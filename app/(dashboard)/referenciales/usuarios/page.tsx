import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";

import { getUsers } from "@/lib/actions/users";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  CAJERO: "Cajero",
  ALMACEN: "Almacén",
  SUPERVISOR: "Supervisor",
};

const ROLE_CLASS: Record<string, string> = {
  ADMIN: "border-purple-300 text-purple-700 bg-purple-50",
  SUPERVISOR: "border-blue-300 text-blue-700 bg-blue-50",
  VENDEDOR: "border-emerald-300 text-emerald-700 bg-emerald-50",
  CAJERO: "border-amber-300 text-amber-700 bg-amber-50",
  ALMACEN: "border-slate-300 text-slate-700 bg-slate-50",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UsuariosPage() {
  const users = await getUsers();

  const activeCount = users.filter((u) => u.isActive).length;
  const roleCount = new Set(users.map((u) => u.role)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" render={<Link href="/referenciales" />}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuarios y Empleados</h1>
            <p className="text-muted-foreground">
              Gestión de cuentas, roles y tasas de comisión
            </p>
          </div>
        </div>
        <Button render={<Link href="/referenciales/usuarios/nuevo" />} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {users.length - activeCount} inactivo(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" /> Roles asignados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{roleCount}</p>
            <p className="text-xs text-muted-foreground mt-1">de 5 roles disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-center">Rol</TableHead>
                <TableHead className="text-center">Comisión</TableHead>
                <TableHead className="text-center">Ventas</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className={cn(!u.isActive && "opacity-50")}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.phone ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", ROLE_CLASS[u.role])}
                      >
                        {ROLE_LABEL[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {u.commissionRate > 0 ? (
                        <span className="font-medium text-emerald-700">{u.commissionRate}%</span>
                      ) : (
                        <span className="text-muted-foreground">Global</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm">{u.salesCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          u.isActive
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                            : "border-slate-300 text-slate-600"
                        )}
                      >
                        {u.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        render={<Link href={`/referenciales/usuarios/${u.id}`} />}
                      >
                        Editar <ChevronRight className="h-3 w-3" />
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
