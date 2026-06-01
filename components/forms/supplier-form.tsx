"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Save, Truck } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";

// ─── Schema ───────────────────────────────────────────────────────────────────

const supplierSchema = z.object({
  code: z.string().min(1, "Código requerido"),
  name: z.string().min(1, "Nombre requerido"),
  ruc: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  categories: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SupplierFormProps {
  supplier?: {
    id: string;
    code: string;
    name: string;
    ruc: string;
    contactName: string;
    phone: string;
    email: string;
    categories: string;
    paymentTerms: string;
    notes: string;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SupplierForm({ supplier }: SupplierFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!supplier;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: supplier?.code ?? "PROV-",
      name: supplier?.name ?? "",
      ruc: supplier?.ruc ?? "",
      contactName: supplier?.contactName ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      categories: supplier?.categories ?? "",
      paymentTerms: supplier?.paymentTerms ?? "",
      notes: supplier?.notes ?? "",
    },
  });

  async function onSubmit(values: SupplierFormValues) {
    setIsLoading(true);
    try {
      const result = isEdit
        ? await updateSupplier(supplier!.id, values)
        : await createSupplier(values);

      if (result.success) {
        toast.success(
          isEdit ? "Proveedor actualizado correctamente" : "Proveedor creado correctamente"
        );
        router.push("/referenciales/proveedores");
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al guardar el proveedor");
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
          {/* Datos Principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" /> Datos del Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="PROV-001" />
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
                      <FormLabel>RUC</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="80012345-6" />
                      </FormControl>
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
                    <FormLabel>Razón Social / Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Distribuidora XYZ S.A." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Contacto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan Pérez" />
                    </FormControl>
                  </FormItem>
                )}
              />
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contacto@empresa.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Datos Comerciales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos Comerciales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorías que provee</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Muebles, Colchones, Electrodomésticos"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condición de Pago</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: 30 días, contado, 3 cuotas sin interés"
                      />
                    </FormControl>
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
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/referenciales/proveedores")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? "Guardar Cambios" : "Crear Proveedor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
