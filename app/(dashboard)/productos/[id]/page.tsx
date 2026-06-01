import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Edit, Package, TrendingUp, ShoppingCart, Truck,
  MapPin, Tag, BarChart3,
} from "lucide-react";
import { getProductDetail } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(n);

const MOV_LABELS: Record<string, { label: string; color: string }> = {
  ENTRADA: { label: "Entrada",  color: "bg-emerald-100 text-emerald-800" },
  SALIDA:  { label: "Salida",   color: "bg-red-100 text-red-800"        },
  AJUSTE:  { label: "Ajuste",   color: "bg-amber-100 text-amber-800"    },
};

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductDetail(params.id);
  if (!product) notFound();

  const isLow = product.stock <= product.minStock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/productos" />}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <Badge variant={product.status === "ACTIVO" ? "default" : "secondary"}>
                {product.status}
              </Badge>
              {isLow && (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  Stock bajo
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-0.5">{product.code}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" render={<Link href={`/productos/${params.id}/editar`} />}>
          <Edit className="h-4 w-4" /> Editar Producto
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Imagen + info */}
        <div className="space-y-4">
          {/* Imagen */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 gap-2">
                <Package className="h-16 w-16" />
                <p className="text-sm text-zinc-400">Sin imagen</p>
              </div>
            )}
          </div>

          {/* Detalles */}
          <Card>
            <CardContent className="pt-4 space-y-2 text-sm">
              {[
                { label: "Categoría",    value: product.category   },
                { label: "Marca",        value: product.brand      },
                { label: "Modelo",       value: product.model      },
                { label: "Unidad",       value: product.unit       },
                { label: "Ubicación",    value: product.location   },
                { label: "Proveedor",    value: product.supplier?.name },
              ]
                .filter((r) => r.value)
                .map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              {product.description && (
                <p className="text-muted-foreground pt-2 border-t leading-relaxed">
                  {product.description}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* KPIs + precios */}
        <div className="lg:col-span-2 space-y-4">
          {/* Precios */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Precio Costo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-red-700">{fmt(product.costPrice)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Precio Contado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-emerald-700">{fmt(product.cashPrice)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Margen {product.margin}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-500" /> Precio Crédito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-blue-700">{fmt(product.creditPrice)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-3 gap-3">
            <Card className={cn(isLow && "border-red-200 bg-red-50/30")}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" /> Stock Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn("text-3xl font-bold", isLow ? "text-red-600" : "")}>
                  {product.stock}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">mínimo: {product.minStock}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <ShoppingCart className="h-3.5 w-3.5 text-blue-500" /> Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{product.salesCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">unidades vendidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-amber-500" /> Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{product.purchasesCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">órdenes de compra</p>
              </CardContent>
            </Card>
          </div>

          {/* Movimientos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Últimos movimientos de stock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-center">Anterior</TableHead>
                    <TableHead className="text-center">Nuevo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-16 text-center text-muted-foreground">
                        Sin movimientos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    product.movements.map((m) => {
                      const cfg = MOV_LABELS[m.type] ?? { label: m.type, color: "" };
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleDateString("es-PY")}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {m.type === "SALIDA" ? `-${m.quantity}` : `+${m.quantity}`}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">{m.previousStock}</TableCell>
                          <TableCell className="text-center font-medium">{m.newStock}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{m.reason ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.userName}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
