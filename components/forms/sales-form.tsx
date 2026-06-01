"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Calculator, ShoppingCart, User, CreditCard, Save, BadgeDollarSign } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateAmortization } from "@/lib/calculations";
import { createSale } from "@/lib/actions/sales";
import { InterestMode, Frequency, SaleType, SaleChannel } from "@prisma/client";

// ─── Schema ───────────────────────────────────────────────────────────────────

const saleSchema = z.object({
  customerId: z.string().min(1, "Selecciona un cliente"),
  sellerId: z.string().min(1, "Selecciona un vendedor"),
  type: z.enum(["CONTADO", "CREDITO"]),
  channel: z.enum(["TIENDA", "VISITA", "TELEFONICA"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
        discount: z.number().min(0),
      })
    )
    .min(1, "Agrega al menos un producto"),
  discount: z.number().min(0),
  notes: z.string().optional(),
  creditPlan: z
    .object({
      downPayment: z.number().min(0),
      interestRate: z.number().min(0),
      interestMode: z.enum(["FRANCES", "SIMPLE", "SALDO_DECRECIENTE"]),
      installments: z.number().int().min(1),
      frequency: z.enum(["MENSUAL", "QUINCENAL", "SEMANAL"]),
      firstDueDate: z.string().min(1),
      lateInterestRate: z.number().min(0),
    })
    .optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SalesFormProps {
  customers: { id: string; name: string; ruc: string }[];
  products: {
    id: string;
    name: string;
    stock: number;
    cashPrice: number | string;
    creditPrice: number | string;
  }[];
  sellers: { id: string; name: string; commissionRate: number }[];
  currentUserId: string;
  globalRates: {
    cashRate: number;
    creditRate: number;
    trigger: string;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY").format(Math.round(n));
}

const TRIGGER_LABEL: Record<string, string> = {
  AL_VENDER: "Al vender",
  AL_COBRAR_CUOTA: "Al cobrar cuota",
  AL_COMPLETAR: "Al completar crédito",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SalesForm({
  customers,
  products,
  sellers,
  currentUserId,
  globalRates,
}: SalesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [productSelectKey, setProductSelectKey] = useState(0);
  const router = useRouter();

  const firstDueDefault = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: "",
      sellerId: currentUserId,
      type: "CONTADO",
      channel: "TIENDA",
      items: [],
      discount: 0,
      notes: "",
      creditPlan: {
        downPayment: 0,
        interestRate: 5,
        interestMode: "FRANCES",
        installments: 12,
        frequency: "MENSUAL",
        firstDueDate: firstDueDefault(),
        lateInterestRate: 0.1,
      },
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const watchedItems = form.watch("items");
  const saleType = form.watch("type");
  const creditPlan = form.watch("creditPlan");
  const globalDiscount = form.watch("discount") ?? 0;
  const selectedSellerId = form.watch("sellerId");

  const subtotal = useMemo(
    () =>
      watchedItems.reduce(
        (acc, item) =>
          acc + (Number(item.unitPrice) - Number(item.discount ?? 0)) * Number(item.quantity),
        0
      ),
    [watchedItems]
  );
  const total = Math.max(0, subtotal - Number(globalDiscount));

  // Comisión estimada según tasa del vendedor seleccionado
  const selectedSeller = sellers.find((s) => s.id === selectedSellerId);
  const effectiveRate = useMemo(() => {
    if (!selectedSeller) return 0;
    if (selectedSeller.commissionRate > 0) return selectedSeller.commissionRate;
    if (!globalRates) return 0;
    return saleType === "CONTADO" ? globalRates.cashRate : globalRates.creditRate;
  }, [selectedSeller, globalRates, saleType]);

  const commissionPreview = useMemo(
    () => (effectiveRate > 0 && total > 0 ? Math.round((total * effectiveRate) / 100) : 0),
    [effectiveRate, total]
  );

  const amortizationPreview = useMemo(() => {
    if (saleType !== "CREDITO" || !creditPlan) return [];
    const financed = total - Number(creditPlan.downPayment ?? 0);
    if (financed <= 0 || Number(creditPlan.installments) <= 0) return [];
    try {
      return calculateAmortization(
        financed,
        Number(creditPlan.interestRate),
        Math.round(Number(creditPlan.installments)),
        creditPlan.frequency as Frequency,
        creditPlan.interestMode as InterestMode,
        new Date(creditPlan.firstDueDate)
      );
    } catch {
      return [];
    }
  }, [saleType, creditPlan, total]);

  function addProductToCart(productId: string | null) {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const price =
      saleType === "CONTADO"
        ? Number(product.cashPrice)
        : Number(product.creditPrice);
    append({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: price,
      discount: 0,
    });
    setProductSelectKey((k) => k + 1);
  }

  async function onSubmit(values: SaleFormValues) {
    setIsLoading(true);
    try {
      const result = await createSale({
        customerId: values.customerId,
        sellerId: values.sellerId,
        type: values.type as SaleType,
        channel: values.channel as SaleChannel,
        items: values.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: Math.round(Number(item.quantity)),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount ?? 0),
        })),
        discount: Number(values.discount ?? 0),
        notes: values.notes,
        creditPlan:
          values.type === "CREDITO" && values.creditPlan
            ? {
                downPayment: Number(values.creditPlan.downPayment ?? 0),
                interestRate: Number(values.creditPlan.interestRate),
                interestMode: values.creditPlan.interestMode as InterestMode,
                installments: Math.round(Number(values.creditPlan.installments)),
                frequency: values.creditPlan.frequency as Frequency,
                firstDueDate: values.creditPlan.firstDueDate,
                lateInterestRate: Number(values.creditPlan.lateInterestRate),
              }
            : undefined,
      });

      if (result.success) {
        toast.success("Venta procesada exitosamente");
        router.push("/ventas");
        router.refresh();
      } else {
        toast.error(result.error || "Error al procesar la venta");
      }
    } catch {
      toast.error("Error inesperado al procesar la venta");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Columna izquierda ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos de la venta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Datos de la Venta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cliente */}
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => {
                      const selected = customers.find((c) => c.id === field.value);
                      return (
                        <FormItem>
                          <FormLabel>Cliente *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente">
                                  {selected ? `${selected.name} (${selected.ruc})` : null}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} ({c.ruc})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Vendedor */}
                  <FormField
                    control={form.control}
                    name="sellerId"
                    render={({ field }) => {
                      const selected = sellers.find((s) => s.id === field.value);
                      return (
                        <FormItem>
                          <FormLabel>Vendedor *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar vendedor">
                                  {selected
                                    ? `${selected.name}${selected.commissionRate > 0 ? ` — ${selected.commissionRate}%` : ""}`
                                    : null}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sellers.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                  {s.commissionRate > 0 ? ` — ${s.commissionRate}% comisión` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Venta</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CONTADO">CONTADO</SelectItem>
                            <SelectItem value="CREDITO">CRÉDITO</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Canal */}
                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canal de Venta</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TIENDA">Tienda</SelectItem>
                            <SelectItem value="VISITA">Visita</SelectItem>
                            <SelectItem value="TELEFONICA">Telefónica</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Notas opcionales..." />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Carrito */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" /> Carrito
                  </div>
                  <Select key={productSelectKey} value="" onValueChange={addProductToCart}>
                    <SelectTrigger className="w-[250px]">
                      <Plus className="h-4 w-4 mr-2" /> Agregar Producto
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} ({p.stock} disp.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="w-24">Cant.</TableHead>
                      <TableHead className="w-36">P. Unit. GS</TableHead>
                      <TableHead className="w-28">Desc. GS</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground h-20">
                          El carrito está vacío. Agregá productos desde el selector.
                        </TableCell>
                      </TableRow>
                    ) : (
                      fields.map((field, index) => {
                        const item = watchedItems[index];
                        const lineTotal =
                          (Number(item?.unitPrice) - Number(item?.discount ?? 0)) *
                          Number(item?.quantity);
                        return (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium text-sm">
                              {item?.productName}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={1}
                                className="h-8"
                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                className="h-8"
                                {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                className="h-8"
                                {...form.register(`items.${index}.discount`, { valueAsNumber: true })}
                              />
                            </TableCell>
                            <TableCell className="text-right font-bold text-sm">
                              {fmt(isNaN(lineTotal) ? 0 : lineTotal)} GS
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* ── Columna derecha ── */}
          <div className="space-y-6">
            {/* Resumen financiero */}
            <Card className="bg-zinc-900 text-white">
              <CardHeader>
                <CardTitle className="text-base">Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-zinc-400 text-sm">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)} GS</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400 text-sm">
                  <span>Descuento Global</span>
                  <Input
                    type="number"
                    min={0}
                    className="w-28 h-7 bg-zinc-800 border-zinc-700 text-white text-right text-sm"
                    {...form.register("discount", { valueAsNumber: true })}
                  />
                </div>
                <Separator className="bg-zinc-700" />
                <div className="flex justify-between text-2xl font-bold text-emerald-400">
                  <span>TOTAL</span>
                  <span>{fmt(total)} GS</span>
                </div>

                {/* Comisión estimada */}
                {commissionPreview > 0 && selectedSeller && (
                  <>
                    <Separator className="bg-zinc-700" />
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1 text-yellow-400">
                          <BadgeDollarSign className="h-3.5 w-3.5" />
                          Comisión {selectedSeller.name.split(" ")[0]}
                          {effectiveRate > 0 ? ` (${effectiveRate}%)` : ""}
                        </span>
                        <span className="font-semibold text-yellow-400">
                          {fmt(commissionPreview)} GS
                        </span>
                      </div>
                      {globalRates && (
                        <p className="text-xs text-zinc-500">
                          Trigger: {TRIGGER_LABEL[globalRates.trigger] ?? globalRates.trigger}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Plan de crédito */}
            {saleType === "CREDITO" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" /> Plan de Crédito
                  </CardTitle>
                  <CardDescription>Parámetros de financiamiento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="creditPlan.downPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Entrega Inicial (GS)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              className="h-8"
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="creditPlan.interestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">% Interés Mens.</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.1"
                              className="h-8"
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="creditPlan.installments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">N° Cuotas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              className="h-8"
                              value={field.value ?? 12}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="creditPlan.lateInterestRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">% Mora diaria</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="h-8"
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Frecuencia — Select CONTROLADO */}
                  <FormField
                    control={form.control}
                    name="creditPlan.frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Frecuencia</FormLabel>
                        <Select value={field.value ?? "MENSUAL"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MENSUAL">Mensual</SelectItem>
                            <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                            <SelectItem value="SEMANAL">Semanal</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Modalidad — Select CONTROLADO */}
                  <FormField
                    control={form.control}
                    name="creditPlan.interestMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Modalidad de interés</FormLabel>
                        <Select value={field.value ?? "FRANCES"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FRANCES">Francés (cuota fija)</SelectItem>
                            <SelectItem value="SIMPLE">Simple</SelectItem>
                            <SelectItem value="SALDO_DECRECIENTE">Sobre saldo</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creditPlan.firstDueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Primera Cuota</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-8"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {amortizationPreview.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      <div className="flex justify-between items-baseline">
                        <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                          <Calculator className="h-3 w-3" /> Cuota proyectada
                        </p>
                        <p className="text-xl font-bold text-emerald-900">
                          {fmt(amortizationPreview[0].total)} GS
                        </p>
                      </div>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Financiado: {fmt(total - Number(creditPlan?.downPayment ?? 0))} GS ·{" "}
                        {creditPlan?.installments} cuotas {creditPlan?.frequency?.toLowerCase()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold"
              disabled={isLoading || fields.length === 0}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              CONFIRMAR VENTA
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
