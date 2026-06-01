"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, UserPlus } from "lucide-react";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import { CustomerType, RiskLevel } from "@prisma/client";

// ─── Schema ───────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  code: z.string().min(1, "Código requerido"),
  type: z.nativeEnum(CustomerType),
  name: z.string().min(1, "Nombre requerido"),
  ruc: z.string().min(1, "RUC/CI requerido"),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  reference1Name: z.string().optional(),
  reference1Phone: z.string().optional(),
  reference2Name: z.string().optional(),
  reference2Phone: z.string().optional(),
  employer: z.string().optional(),
  position: z.string().optional(),
  monthlyIncome: z.number().min(0, "Mínimo 0"),
  creditLimit: z.number().min(0, "Mínimo 0"),
  riskLevel: z.nativeEnum(RiskLevel),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CustomerFormProps {
  customer?: {
    id: string;
    code: string;
    type: string;
    name: string;
    ruc: string;
    phone: string;
    mobile: string;
    email: string;
    address: string;
    neighborhood: string;
    city: string;
    department: string;
    reference1Name: string;
    reference1Phone: string;
    reference2Name: string;
    reference2Phone: string;
    employer: string;
    position: string;
    monthlyIncome: number;
    creditLimit: number;
    riskLevel: string;
    notes: string;
  };
}

const RISK_LABELS: Record<string, string> = {
  BAJO: "Bajo",
  MEDIO: "Medio",
  ALTO: "Alto",
};

const TYPE_LABELS: Record<string, string> = {
  MINORISTA: "Minorista",
  MAYORISTA: "Mayorista",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerForm({ customer }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!customer;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: isEdit
      ? {
          code: customer.code,
          type: customer.type as CustomerType,
          name: customer.name,
          ruc: customer.ruc,
          phone: customer.phone,
          mobile: customer.mobile,
          email: customer.email,
          address: customer.address,
          neighborhood: customer.neighborhood,
          city: customer.city,
          department: customer.department,
          reference1Name: customer.reference1Name,
          reference1Phone: customer.reference1Phone,
          reference2Name: customer.reference2Name,
          reference2Phone: customer.reference2Phone,
          employer: customer.employer,
          position: customer.position,
          monthlyIncome: customer.monthlyIncome,
          creditLimit: customer.creditLimit,
          riskLevel: customer.riskLevel as RiskLevel,
          notes: customer.notes,
        }
      : {
          code: "CLI-",
          type: "MINORISTA",
          name: "",
          ruc: "",
          riskLevel: "BAJO",
          monthlyIncome: 0,
          creditLimit: 0,
        },
  });

  async function onSubmit(values: CustomerFormValues) {
    setIsLoading(true);
    try {
      const result = isEdit
        ? await updateCustomer(customer!.id, values)
        : await createCustomer(values);

      if (result.success) {
        toast.success(isEdit ? "Cliente actualizado correctamente" : "Cliente registrado correctamente");
        router.push(isEdit ? `/clientes/${customer!.id}` : "/clientes");
        router.refresh();
      } else {
        toast.error((result as any).error || "Ocurrió un error");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── Columna izquierda ── */}
          <div className="space-y-6">
            {/* Datos identificativos */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Datos Identificativos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Interno</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="CLI-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo">
                              {field.value ? TYPE_LABELS[field.value] ?? field.value : null}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CustomerType).map((t) => (
                            <SelectItem key={t} value={t}>
                              {TYPE_LABELS[t] ?? t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo / Razón Social *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan Pérez" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ruc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUC o CI *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1234567-8" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Ubicación y contacto */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Ubicación y Contacto
              </h3>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Av. Principal 123" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barrio</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="021-123456" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0981-123456" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="cliente@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Empleo */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Datos Laborales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empleador</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Empresa S.A." />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Administrativo" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* ── Columna derecha ── */}
          <div className="space-y-6">
            {/* Perfil crediticio */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Perfil Crediticio
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingresos Mensuales (GS)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creditLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Límite de Crédito (GS)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="riskLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel de Riesgo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nivel">
                            {field.value ? RISK_LABELS[field.value] ?? field.value : null}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(RiskLevel).map((level) => (
                          <SelectItem key={level} value={level}>
                            {RISK_LABELS[level] ?? level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Notas adicionales..." />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Referencias */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Referencias Personales
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="reference1Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Ref. 1 — Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reference1Phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Ref. 1 — Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="reference2Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Ref. 2 — Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reference2Phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Ref. 2 — Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2 min-w-40">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              <Save className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {isEdit ? "Guardar Cambios" : "Registrar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
