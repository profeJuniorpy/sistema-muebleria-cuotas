"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  BadgeDollarSign,
  Building2,
  CreditCard,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  Phone,
  Save,
  Scale,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  saveCompanyConfig,
  saveCommissionSettings,
  type CompanyConfigData,
  type CommissionSettingsData,
} from "@/lib/actions/config";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const companySchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  ruc: z.string().min(1, "RUC requerido"),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  legalRepresentative: z.string().optional(),
  legalRepresentativeCI: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountType: z.string().optional(),
  timbrado: z.string().optional(),
  establishmentNumber: z.string().optional(),
  dispatchPoint: z.string().optional(),
  logoUrl: z.string().optional(),
  footerText: z.string().optional(),
});

const commissionSchema = z.object({
  cashSaleRate: z.number().min(0).max(100),
  creditSaleRate: z.number().min(0).max(100),
  trigger: z.enum(["AL_VENDER", "AL_COBRAR_CUOTA", "AL_COMPLETAR"]),
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConfigFormProps {
  company: CompanyConfigData;
  commissions: CommissionSettingsData;
  userId: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  AL_VENDER: "Al registrar la venta",
  AL_COBRAR_CUOTA: "Al cobrar cada cuota",
  AL_COMPLETAR: "Al completar el crédito",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfigForm({ company, commissions, userId }: ConfigFormProps) {
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingCommissions, setSavingCommissions] = useState(false);

  // ── Formulario empresa ───────────────────────────────────────────────────────
  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name ?? "",
      ruc: company.ruc ?? "",
      phone: company.phone ?? "",
      mobile: company.mobile ?? "",
      email: company.email ?? "",
      website: company.website ?? "",
      address: company.address ?? "",
      city: company.city ?? "",
      department: company.department ?? "",
      legalRepresentative: company.legalRepresentative ?? "",
      legalRepresentativeCI: company.legalRepresentativeCI ?? "",
      bankName: company.bankName ?? "",
      bankAccount: company.bankAccount ?? "",
      bankAccountType: company.bankAccountType ?? "",
      timbrado: company.timbrado ?? "",
      establishmentNumber: company.establishmentNumber ?? "",
      dispatchPoint: company.dispatchPoint ?? "",
      logoUrl: company.logoUrl ?? "",
      footerText: company.footerText ?? "",
    },
  });

  // ── Formulario comisiones ────────────────────────────────────────────────────
  const commissionForm = useForm<z.infer<typeof commissionSchema>>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      cashSaleRate: commissions.cashSaleRate,
      creditSaleRate: commissions.creditSaleRate,
      trigger: commissions.trigger,
    },
  });

  async function onSaveCompany(values: z.infer<typeof companySchema>) {
    setSavingCompany(true);
    try {
      const result = await saveCompanyConfig(values);
      if (result.success) {
        toast.success("Datos de la empresa guardados correctamente");
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSavingCompany(false);
    }
  }

  async function onSaveCommissions(values: z.infer<typeof commissionSchema>) {
    setSavingCommissions(true);
    try {
      const result = await saveCommissionSettings(values, userId);
      if (result.success) {
        toast.success("Configuración de comisiones guardada");
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSavingCommissions(false);
    }
  }

  const selectedTrigger = commissionForm.watch("trigger");

  return (
    <Tabs defaultValue="empresa">
      <TabsList className="mb-6">
        <TabsTrigger value="empresa" className="gap-2">
          <Building2 className="h-4 w-4" /> Empresa
        </TabsTrigger>
        <TabsTrigger value="comisiones" className="gap-2">
          <BadgeDollarSign className="h-4 w-4" /> Comisiones
        </TabsTrigger>
      </TabsList>

      {/* ── Tab: Empresa ── */}
      <TabsContent value="empresa">
        <Form {...companyForm}>
          <form onSubmit={companyForm.handleSubmit(onSaveCompany)} className="space-y-6">

            {/* Datos básicos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" /> Datos de la Empresa
                </CardTitle>
                <CardDescription>
                  Aparecen en tickets, recibos, contratos y encabezados de documentos.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Razón Social / Nombre *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mueblería San Lucas S.R.L." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="ruc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUC *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="80012345-6" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL del Logo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4" /> Datos de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
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
                  control={companyForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular / WhatsApp</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0981-123456" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="info@empresa.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sitio Web</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="www.empresa.com.py" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" /> Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Av. Mariscal López 1234 c/ Artigas" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Asunción" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Central" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Representación legal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-4 w-4" /> Representación Legal
                </CardTitle>
                <CardDescription>
                  Datos del representante que firma contratos y documentos legales.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="legalRepresentative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Representante Legal</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Juan Carlos Pérez" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="legalRepresentativeCI"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CI del Representante</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1.234.567" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Datos bancarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Landmark className="h-4 w-4" /> Datos Bancarios
                </CardTitle>
                <CardDescription>
                  Para incluir en contratos y comprobantes de transferencia.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={companyForm.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Banco Continental" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Cuenta</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123456789" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="bankAccountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cuenta</FormLabel>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar">
                              {field.value === "CORRIENTE"
                                ? "Cuenta Corriente"
                                : field.value === "AHORRO"
                                ? "Caja de Ahorro"
                                : null}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CORRIENTE">Cuenta Corriente</SelectItem>
                          <SelectItem value="AHORRO">Caja de Ahorro</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Datos fiscales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" /> Datos Fiscales
                </CardTitle>
                <CardDescription>
                  Información para facturas y documentos tributarios (SET Paraguay).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={companyForm.control}
                  name="timbrado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>N° de Timbrado</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345678" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="establishmentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>N° Establecimiento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="001" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="dispatchPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Punto de Expedición</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="001" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="footerText"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Pie de página en documentos</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ej: Válido como comprobante de pago. No se aceptan devoluciones."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingCompany} className="gap-2 min-w-44">
                {savingCompany ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar Datos de Empresa
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>

      {/* ── Tab: Comisiones ── */}
      <TabsContent value="comisiones">
        <Form {...commissionForm}>
          <form onSubmit={commissionForm.handleSubmit(onSaveCommissions)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BadgeDollarSign className="h-4 w-4" /> Tasas de Comisión Globales
                </CardTitle>
                <CardDescription>
                  Se aplican cuando el vendedor no tiene una tasa personalizada configurada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={commissionForm.control}
                    name="cashSaleRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tasa Ventas al CONTADO (%)</FormLabel>
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={commissionForm.control}
                    name="creditSaleRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tasa Ventas al CRÉDITO (%)</FormLabel>
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={commissionForm.control}
                  name="trigger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Momento de generación de comisión</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="max-w-sm">
                            <SelectValue>
                              {field.value ? TRIGGER_LABELS[field.value] : null}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AL_VENDER">Al registrar la venta</SelectItem>
                          <SelectItem value="AL_COBRAR_CUOTA">Al cobrar cada cuota</SelectItem>
                          <SelectItem value="AL_COMPLETAR">Al completar el crédito</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedTrigger === "AL_VENDER" &&
                          "La comisión se genera al registrar la venta, sin importar si el cliente paga o no."}
                        {selectedTrigger === "AL_COBRAR_CUOTA" &&
                          "Se genera una comisión proporcional por cada cuota cobrada."}
                        {selectedTrigger === "AL_COMPLETAR" &&
                          "La comisión se genera únicamente cuando el crédito queda totalmente cancelado."}
                      </p>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" /> Nota sobre tasas personalizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cada vendedor puede tener una tasa de comisión propia configurada en{" "}
                  <strong>Referenciales → Usuarios</strong>. Cuando el vendedor tiene una tasa
                  personalizada mayor a 0%, esa tasa tiene prioridad sobre las globales definidas aquí.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingCommissions} className="gap-2 min-w-44">
                {savingCommissions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar Comisiones
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
