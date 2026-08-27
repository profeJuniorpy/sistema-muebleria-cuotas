"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  BadgeDollarSign,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  Image as ImageIcon,
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
import { Checkbox } from "@/components/ui/checkbox";
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
  saveStorefrontCreditConfig,
  saveStorefrontBanner,
  type CompanyConfigData,
  type CommissionSettingsData,
  type StorefrontCreditConfigData,
  type StorefrontBannerData,
} from "@/lib/actions/config";
import { LogoUpload } from "@/components/forms/logo-upload";
import { BannerUpload } from "@/components/forms/banner-upload";
import { calculateInstallmentQuote } from "@/lib/calculations";
import type { InterestMode } from "@prisma/client";

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

const storefrontCreditSchema = z.object({
  interestRate: z.number().min(0).max(100),
  interestMode: z.enum(["FRANCES", "SIMPLE", "SALDO_DECRECIENTE"]),
  installmentOptions: z
    .string()
    .min(1, "Ingresá al menos una cantidad de cuotas")
    .regex(/^\d+(\s*,\s*\d+)*$/, "Usá números separados por coma, ej: 3,6,12,18,24"),
});

const storefrontBannerSchema = z.object({
  enabled: z.boolean(),
  imageUrl: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConfigFormProps {
  company: CompanyConfigData;
  commissions: CommissionSettingsData;
  storefrontCredit: StorefrontCreditConfigData;
  storefrontBanner: StorefrontBannerData;
  userId: string;
}

const INTEREST_MODE_LABELS: Record<string, string> = {
  FRANCES: "Francés (cuota fija)",
  SIMPLE: "Simple (cuota fija)",
  SALDO_DECRECIENTE: "Saldo decreciente (cuota inicial más alta)",
};

const fmtGs = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(n);

const TRIGGER_LABELS: Record<string, string> = {
  AL_VENDER: "Al registrar la venta",
  AL_COBRAR_CUOTA: "Al cobrar cada cuota",
  AL_COMPLETAR: "Al completar el crédito",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfigForm({ company, commissions, storefrontCredit, storefrontBanner, userId }: ConfigFormProps) {
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingCommissions, setSavingCommissions] = useState(false);
  const [savingStorefrontCredit, setSavingStorefrontCredit] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);

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

  // ── Formulario cuotas de la tienda ───────────────────────────────────────────
  const storefrontCreditForm = useForm<z.infer<typeof storefrontCreditSchema>>({
    resolver: zodResolver(storefrontCreditSchema),
    defaultValues: {
      interestRate: storefrontCredit.interestRate,
      interestMode: storefrontCredit.interestMode,
      installmentOptions: storefrontCredit.installmentOptions,
    },
  });

  // ── Formulario banner de la tienda ───────────────────────────────────────────
  const bannerForm = useForm<z.infer<typeof storefrontBannerSchema>>({
    resolver: zodResolver(storefrontBannerSchema),
    defaultValues: {
      enabled: storefrontBanner.enabled,
      imageUrl: storefrontBanner.imageUrl ?? "",
      title: storefrontBanner.title ?? "",
      subtitle: storefrontBanner.subtitle ?? "",
      ctaText: storefrontBanner.ctaText ?? "",
      ctaLink: storefrontBanner.ctaLink ?? "",
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

  async function onSaveStorefrontCredit(values: z.infer<typeof storefrontCreditSchema>) {
    setSavingStorefrontCredit(true);
    try {
      const result = await saveStorefrontCreditConfig(values);
      if (result.success) {
        toast.success("Configuración de cuotas de la tienda guardada");
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSavingStorefrontCredit(false);
    }
  }

  async function onSaveBanner(values: z.infer<typeof storefrontBannerSchema>) {
    setSavingBanner(true);
    try {
      const result = await saveStorefrontBanner(values);
      if (result.success) {
        toast.success("Banner de la tienda guardado");
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setSavingBanner(false);
    }
  }

  const selectedTrigger = commissionForm.watch("trigger");
  const bannerEnabled = bannerForm.watch("enabled");
  const bannerImageUrl = bannerForm.watch("imageUrl");

  const watchedRate = storefrontCreditForm.watch("interestRate");
  const watchedMode = storefrontCreditForm.watch("interestMode");
  const watchedOptions = storefrontCreditForm.watch("installmentOptions");
  const previewOptions = useMemo(() => {
    const periodsList = (watchedOptions ?? "")
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0)
      .slice(0, 8);
    const samplePrice = 1_000_000; // Gs. 1.000.000 de ejemplo
    return periodsList.map((periods) =>
      calculateInstallmentQuote(samplePrice, Number(watchedRate) || 0, periods, watchedMode as InterestMode)
    );
  }, [watchedOptions, watchedRate, watchedMode]);

  return (
    <Tabs defaultValue="empresa">
      <TabsList className="mb-6">
        <TabsTrigger value="empresa" className="gap-2">
          <Building2 className="h-4 w-4" /> Empresa
        </TabsTrigger>
        <TabsTrigger value="comisiones" className="gap-2">
          <BadgeDollarSign className="h-4 w-4" /> Comisiones
        </TabsTrigger>
        <TabsTrigger value="cuotas-tienda" className="gap-2">
          <Calculator className="h-4 w-4" /> Cuotas (Tienda)
        </TabsTrigger>
        <TabsTrigger value="banner-tienda" className="gap-2">
          <ImageIcon className="h-4 w-4" /> Banner (Tienda)
        </TabsTrigger>
      </TabsList>

      {/* ── Tab: Empresa ── */}
      <TabsContent value="empresa">
        <Form {...companyForm}>
          <form onSubmit={companyForm.handleSubmit(onSaveCompany)} className="space-y-6">

            {/* Logo de la empresa */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-primary">
                  <Building2 className="h-4 w-4" /> Logo de la Empresa
                </CardTitle>
                <CardDescription>
                  Aparece en encabezados de informes, recibos, contratos y en la tienda online.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={companyForm.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LogoUpload
                          value={field.value}
                          onChange={(url) => field.onChange(url ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

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

      {/* ── Tab: Cuotas (Tienda) ── */}
      <TabsContent value="cuotas-tienda">
        <Form {...storefrontCreditForm}>
          <form onSubmit={storefrontCreditForm.handleSubmit(onSaveStorefrontCredit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-4 w-4" /> Simulador de Cuotas de la Tienda Online
                </CardTitle>
                <CardDescription>
                  Define la tasa de interés y las cantidades de cuotas que los clientes pueden
                  ver y comparar en la ficha de cada producto de la tienda (como en bristol.com.py).
                  Se aplica sobre el precio a crédito de cada producto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={storefrontCreditForm.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tasa de interés mensual (%)</FormLabel>
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
                    control={storefrontCreditForm.control}
                    name="interestMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sistema de amortización</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue>
                                {field.value ? INTEREST_MODE_LABELS[field.value] : null}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FRANCES">Francés (cuota fija)</SelectItem>
                            <SelectItem value="SIMPLE">Simple (cuota fija)</SelectItem>
                            <SelectItem value="SALDO_DECRECIENTE">
                              Saldo decreciente (cuota inicial más alta)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={storefrontCreditForm.control}
                  name="installmentOptions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidades de cuotas ofrecidas</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="3,6,12,18,24" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Números separados por coma, ej: 3,6,12,18,24. Se muestran en ese orden en la tienda.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-3">
                    Vista previa (ejemplo con {fmtGs(1_000_000)} a crédito)
                  </p>
                  {previewOptions.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {previewOptions.map((q) => (
                        <div
                          key={q.installments}
                          className="rounded-xl border border-zinc-200 p-3 text-center"
                        >
                          <p className="text-xs text-muted-foreground">{q.installments} cuotas de</p>
                          <p className="font-bold text-zinc-900">{fmtGs(q.installmentAmount)}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Total: {fmtGs(q.totalAmount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Ingresá al menos una cantidad de cuotas válida para ver la vista previa.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingStorefrontCredit} className="gap-2 min-w-44">
                {savingStorefrontCredit ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar Cuotas de la Tienda
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>

      {/* ── Tab: Banner (Tienda) ── */}
      <TabsContent value="banner-tienda">
        <Form {...bannerForm}>
          <form onSubmit={bannerForm.handleSubmit(onSaveBanner)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4" /> Banner Principal de la Tienda
                </CardTitle>
                <CardDescription>
                  Imagen destacada que aparece en la portada de la tienda online (/tienda), ideal
                  para publicar ofertas y promociones. Si está desactivado, se muestra el banner
                  por defecto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={bannerForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        Mostrar este banner en la tienda online
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={bannerForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagen del banner</FormLabel>
                      <FormControl>
                        <BannerUpload
                          value={field.value}
                          onChange={(url) => field.onChange(url ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={bannerForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Liquidación de Verano" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bannerForm.control}
                    name="subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtítulo (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Hasta 30% de descuento en muebles seleccionados" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bannerForm.control}
                    name="ctaText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto del botón (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ver ofertas" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bannerForm.control}
                    name="ctaLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enlace del botón (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="/tienda/catalogo?category=MUEBLES" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ruta interna (ej: /tienda/catalogo) o URL completa.
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                {bannerEnabled && bannerImageUrl && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Vista previa</p>
                    <div className="relative w-full aspect-[16/6] rounded-xl overflow-hidden bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bannerImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                      <div className="relative h-full flex flex-col items-start justify-center px-8 gap-2">
                        {bannerForm.watch("title") && (
                          <p className="text-2xl font-extrabold text-white drop-shadow">
                            {bannerForm.watch("title")}
                          </p>
                        )}
                        {bannerForm.watch("subtitle") && (
                          <p className="text-sm text-white/90 drop-shadow">
                            {bannerForm.watch("subtitle")}
                          </p>
                        )}
                        {bannerForm.watch("ctaText") && (
                          <span className="mt-1 inline-block rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900">
                            {bannerForm.watch("ctaText")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingBanner} className="gap-2 min-w-44">
                {savingBanner ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar Banner
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
