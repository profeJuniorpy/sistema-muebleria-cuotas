"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createUser, updateUser } from "@/lib/actions/users";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const baseSchema = {
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "VENDEDOR", "CAJERO", "ALMACEN", "SUPERVISOR"]),
  phone: z.string().optional(),
  commissionRate: z.coerce.number().min(0).max(100).default(0),
};

const createSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const editSchema = z.object({
  ...baseSchema,
  password: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

// ─── Labels de roles ──────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  CAJERO: "Cajero",
  ALMACEN: "Almacén",
  SUPERVISOR: "Supervisor",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserFormProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string;
    commissionRate: number;
    isActive: boolean;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserForm({ user }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const isEdit = !!user;

  const form = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    defaultValues: isEdit
      ? {
          name: user.name,
          email: user.email,
          role: user.role as any,
          phone: user.phone,
          commissionRate: user.commissionRate,
          isActive: user.isActive,
          password: "",
        }
      : {
          name: "",
          email: "",
          role: "VENDEDOR" as any,
          phone: "",
          commissionRate: 0,
          password: "",
        },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(values: any) {
    setIsLoading(true);
    try {
      const result = isEdit
        ? await updateUser(user!.id, values)
        : await createUser(values);

      if (result.success) {
        toast.success(isEdit ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
        router.push("/referenciales/usuarios");
        router.refresh();
      } else {
        toast.error((result as any).error ?? "Error al guardar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Datos personales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> Datos del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan Pérez" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="usuario@empresa.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0981-123456" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Contraseña */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contraseña {isEdit ? "(dejar vacío para no cambiar)" : "*"}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder={isEdit ? "••••••" : "Mínimo 6 caracteres"}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Rol y configuración */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rol y Permisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rol */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol">
                            {field.value ? ROLE_LABELS[field.value] ?? field.value : null}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comisión (solo visible para VENDEDOR y SUPERVISOR) */}
              {(selectedRole === "VENDEDOR" || selectedRole === "SUPERVISOR") && (
                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tasa de Comisión (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          placeholder="0"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Si es 0, se usa la tasa global de comisiones.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Estado activo (solo en edición) */}
              {isEdit && (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name={"isActive" as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          value={String(field.value)}
                          onValueChange={(v) => field.onChange(v === "true")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue>
                                {field.value ? "Activo" : "Inactivo"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Activo</SelectItem>
                            <SelectItem value="false">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Info del rol seleccionado */}
              {selectedRole && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                  {selectedRole === "ADMIN" && (
                    <p>Acceso completo al sistema. Puede gestionar usuarios, configuración y todos los módulos.</p>
                  )}
                  {selectedRole === "VENDEDOR" && (
                    <p>Accede a Ventas, Clientes, Productos y sus propias Comisiones.</p>
                  )}
                  {selectedRole === "CAJERO" && (
                    <p>Accede a Clientes, Cobranzas, Créditos y Reportes.</p>
                  )}
                  {selectedRole === "ALMACEN" && (
                    <p>Accede a Productos/Stock y Compras.</p>
                  )}
                  {selectedRole === "SUPERVISOR" && (
                    <p>Accede a todos los módulos operativos excepto Referenciales y Configuración.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/referenciales/usuarios")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
