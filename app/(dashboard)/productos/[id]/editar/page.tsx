import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getProductById } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProductForm from "@/components/forms/product-form";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, suppliers] = await Promise.all([
    getProductById(params.id),
    prisma.supplier.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" render={<Link href={`/productos/${params.id}`} />}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Producto</h1>
          <p className="text-muted-foreground">
            {product.code} — {product.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
          <CardDescription>
            Modificá los datos del producto. El stock solo puede ajustarse desde la ficha de movimientos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} suppliers={suppliers} />
        </CardContent>
      </Card>
    </div>
  );
}
