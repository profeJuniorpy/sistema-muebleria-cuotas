"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, ShoppingBag, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createPurchase } from "@/lib/actions/purchases";

// ─── Schema ───────────────────────────────────────────────────────────────────

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  type: z.enum(["CONTADO", "CREDITO"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        quantity: z.number().int().min(1, "Mínimo 1"),
        unitCost: z.number().min(0, "Mínimo 0"),
        discount: z.number().min(0, "Mínimo 0"),
      })
    )
    .min(1, "Agrega al menos un producto"),
  discount: z.number().min(0),
  notes: z.string().optional(),
  creditPlan: z
    .object({
      downPayment: z.number().min(0),
      installments: z.number().int().min(1, "Mínimo 1 cuota"),
      frequency: z.enum(["MENSUAL", "QUINCENAL", "SEMANAL"]),
      firstDueDate: z.string().min(1, "Ingresa una fecha"),
    })
    .optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface PurchaseFormProps {
  suppliers: { id: string; name: string; ruc: string | null }[];
  products: { id: string; name: string; code: string; costPrice: number; category: string }[];
  buyerId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultFirstDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PurchaseForm({ suppliers, products, buyerId }: PurchaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Controlled state for the product-adder select (resets after each selection)
  const [productSelectKey, setProductSelectKey] = useState(0);
  const router = useRouter();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: "",
      type: "CONTADO",
      items: [],
      discount: 0,
      notes: "",
      creditPlan: {
        downPayment: 0,
        installments: 12,
        frequency: "MENSUAL",
        firstDueDate: defaultFirstDueDate(),
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const purchaseType = form.watch("type");
  const creditPlan = form.watch("creditPlan");
  const globalDiscount = form.watch("discount") || 0;

  // Subtotal considerando descuentos por ítem
  const subtotal = useMemo(
    () =>
      watchedItems.reduce(
        (acc, item) =>
          acc + (Number(item.unitCost) - Number(item.discount || 0)) * Number(item.quantity),
        0
      ),
    [watchedItems]
  );
  const total = Math.max(0, subtotal - globalDiscount);

  const installmentPreview = useMemo(() => {
    if (purchaseType !== "CREDITO" || !creditPlan) return 0;
    const financed = total - Number(creditPlan.downPayment || 0);
    const n = Number(creditPlan.installments);
    if (n <= 0 || financed <= 0) return 0;
    return Math.round(financed / n);
  }, [purchaseType, creditPlan, total]);

  function addProduct(productId: string | null) {
    if (!productId) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    append({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitCost: product.costPrice,
      discount: 0,
    });
    // Resetea el select de producto forzando remount
    setProductSelectKey((k) => k + 1);
  }

  async function onSubmit(values: PurchaseFormValues) {
    setIsLoading(true);
    try {
      const payload = {
        supplierId: values.supplierId,
        buyerId,
        type: values.type,
        items: values.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          discount: Number(item.discount ?? 0),
        })),
        discount: Number(values.discount ?? 0),
        notes: values.notes,
        creditPlan:
          values.type === "CREDITO" && values.creditPlan
            ? {
                downPayment: Number(values.creditPlan.downPayment ?? 0),
                installments: Math.round(Number(values.creditPlan.installments)),
                frequency: values.creditPlan.frequency as "MENSUAL" | "QUINCENAL" | "SEMANAL",
                firstDueDate: values.creditPlan.firstDueDate,
              }
            : undefined,
      };

      const result = await createPurchase(payload);

      if (result.success) {
        toast.success("Compra registrada correctamente");
        router.push("/compras");
        router.refresh();
      } else {
        toast.error(result.error || "Error al registrar la compra");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error inesperado al procesar la compra");
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
            {/* Datos generales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" /> Datos de la Compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Proveedor — Select CONTROLADO */}
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => {
                      const selected = suppliers.find((s) => s.id === field.value);
                      return (
                        <FormItem>
                          <FormLabel>Proveedor *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar proveedor">
                                  {selected
                                    ? `${selected.name}${selected.ruc ? ` (${selected.ruc})` : ""}`
                                    : null}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {suppliers.length === 0 ? (
                                <SelectItem value="__none__" disabled>
                                  Sin proveedores — creá uno en Referenciales
                                </SelectItem>
                              ) : (
                                suppliers.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                    {s.ruc ? ` (${s.ruc})` : ""}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Tipo de Compra — Select CONTROLADO */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Compra</FormLabel>
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
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="N° factura, remisión, etc." />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Productos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" /> Productos
                  </div>
                  {/* El select de agregar producto resetea con key */}
                  <Select key={productSelectKey} onValueChange={addProduct} value="">
                    <SelectTrigger className="w-[220px]">
                      <Plus className="h-4 w-4 mr-2" /> Agregar Producto
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          [{p.code}] {p.name}
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
                      <TableHead className="w-36">Costo Unit.</TableHead>
                      <TableHead className="w-28">Desc. Item</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-20 text-center text-muted-foreground"
                        >
                          Sin productos. Agregá usando el selector.
                        </TableCell>
                      </TableRow>
                    ) : (
                      fields.map((field, index) => {
                        const item = watchedItems[index];
                        const lineSubtotal =
                          (Number(item?.unitCost) - Number(item?.discount || 0)) *
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
                                {...form.register(`items.${index}.quantity`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                className="h-8"
                                {...form.register(`items.${index}.unitCost`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                className="h-8"
                                {...form.register(`items.${index}.discount`, {
                                  valueAsNumber: true,
                                })}
                              />
                            </TableCell>
                            <TableCell className="text-right font-bold text-sm">
                              {new Intl.NumberFormat("es-PY").format(
                                isNaN(lineSubtotal) ? 0 : lineSubtotal
                              )}{" "}
                              GS
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
                  <span>Subtotal (neto)</span>
                  <span>{new Intl.NumberFormat("es-PY").format(subtotal)} GS</span>
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
                  <span>{new Intl.NumberFormat("es-PY").format(total)} GS</span>
                </div>
              </CardContent>
            </Card>

            {/* Plan de crédito — Select CONTROLADO */}
            {purchaseType === "CREDITO" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" /> Plan de Pago al Proveedor
                  </CardTitle>
                  <CardDescription>Cuotas sin interés</CardDescription>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                          <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creditPlan.firstDueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Fecha Primera Cuota</FormLabel>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {installmentPreview > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      <p className="text-xs text-emerald-700 font-medium">Cuota estimada</p>
                      <p className="text-xl font-bold text-emerald-900">
                        {new Intl.NumberFormat("es-PY").format(installmentPreview)} GS
                      </p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Monto financiado:{" "}
                        {new Intl.NumberFormat("es-PY").format(
                          Math.max(0, total - Number(creditPlan?.downPayment ?? 0))
                        )}{" "}
                        GS
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-bold"
              disabled={isLoading || fields.length === 0}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              CONFIRMAR COMPRA
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
