"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

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
import { createProduct, updateProduct } from "@/lib/actions/products";
import { Category, Unit, ProductStatus } from "@prisma/client";
import { ImageUpload } from "@/components/forms/image-upload";

// ─── Schema ───────────────────────────────────────────────────────────────────

const productSchema = z.object({
  code: z.string().min(1, "Código requerido"),
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  category: z.nativeEnum(Category),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  unit: z.nativeEnum(Unit),
  costPrice: z.number().min(0),
  cashPrice: z.number().min(0),
  creditPrice: z.number().min(0),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  location: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  imageUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// ─── Labels ───────────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  MUEBLES: "Muebles",
  ELECTRODOMESTICOS: "Electrodomésticos",
  ELECTRONICOS: "Electrónicos",
  COLCHONES: "Colchones",
  OTROS: "Otros",
};

const UNIT_LABELS: Record<string, string> = {
  UNIDAD: "Unidad",
  JUEGO: "Juego",
  PAR: "Par",
  SET: "Set",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVO: "Activo",
  DESCONTINUADO: "Descontinuado",
  AGOTADO: "Agotado",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  product?: {
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    subcategory: string;
    brand: string;
    model: string;
    unit: string;
    costPrice: number;
    cashPrice: number;
    creditPrice: number;
    stock: number;
    minStock: number;
    location: string;
    supplierId: string;
    status: string;
    imageUrl: string;
  };
  suppliers?: { id: string; name: string; code: string }[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductForm({ product, suppliers = [] }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: isEdit
      ? {
          code: product.code,
          name: product.name,
          description: product.description,
          category: product.category as Category,
          subcategory: product.subcategory,
          brand: product.brand,
          model: product.model,
          unit: product.unit as Unit,
          costPrice: product.costPrice,
          cashPrice: product.cashPrice,
          creditPrice: product.creditPrice,
          stock: product.stock,
          minStock: product.minStock,
          location: product.location,
          supplierId: product.supplierId,
          status: product.status as ProductStatus,
          imageUrl: product.imageUrl,
        }
      : {
          code: "",
          name: "",
          description: "",
          category: "OTROS" as Category,
          unit: "UNIDAD" as Unit,
          costPrice: 0,
          cashPrice: 0,
          creditPrice: 0,
          stock: 0,
          minStock: 5,
          status: "ACTIVO" as ProductStatus,
        },
  });

  async function onSubmit(values: ProductFormValues) {
    setIsLoading(true);
    try {
      const result = isEdit
        ? await updateProduct(product!.id, values)
        : await createProduct(values);

      if (result.success) {
        toast.success(isEdit ? "Producto actualizado correctamente" : "Producto creado correctamente");
        router.push(isEdit ? `/productos/${product!.id}` : "/productos");
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
        {/* ── Datos básicos ── */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Identificación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ART-001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nombre del Producto *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Smart TV 55 Samsung" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Categoría">
                          {field.value ? CAT_LABELS[field.value] ?? field.value : null}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Category).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CAT_LABELS[cat] ?? cat}
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
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategoría</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Living, Dormitorio..." />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          {field.value ? UNIT_LABELS[field.value] ?? field.value : null}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Unit).map((u) => (
                        <SelectItem key={u} value={u}>
                          {UNIT_LABELS[u] ?? u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Samsung, LG..." />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="UN55TU7000..." />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descripción breve del artículo" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* ── Precios ── */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Precios (GS)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio de Costo</FormLabel>
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
              name="cashPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Contado</FormLabel>
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
              name="creditPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Crédito</FormLabel>
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
        </div>

        <Separator />

        {/* ── Inventario ── */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Inventario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {!isEdit && (
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Inicial</FormLabel>
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
            )}
            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Mínimo (alerta)</FormLabel>
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación en depósito</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Estante A-3" />
                  </FormControl>
                </FormItem>
              )}
            />
            {suppliers.length > 0 && (
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => {
                  const selected = suppliers.find((s) => s.id === field.value);
                  return (
                    <FormItem>
                      <FormLabel>Proveedor principal</FormLabel>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin proveedor">
                              {selected ? `${selected.code} – ${selected.name}` : null}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin proveedor</SelectItem>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.code} – {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  );
                }}
              />
            )}
            {isEdit && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select value={field.value ?? "ACTIVO"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue>
                            {field.value ? STATUS_LABELS[field.value] ?? field.value : null}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ProductStatus).map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s] ?? s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* ── Imagen ── */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Imagen del Producto
          </h3>
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    productCode={form.watch("code") || "producto"}
                    onChange={(url) => field.onChange(url ?? "")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2 min-w-40">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
