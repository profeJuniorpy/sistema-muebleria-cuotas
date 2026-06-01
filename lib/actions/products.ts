"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Category, Unit, ProductStatus } from "@prisma/client";

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
  costPrice: z.coerce.number().min(0),
  cashPrice: z.coerce.number().min(0),
  creditPrice: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createProduct(data: z.infer<typeof productSchema>) {
  try {
    const product = await prisma.product.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        brand: data.brand,
        model: data.model,
        unit: data.unit,
        costPrice: data.costPrice,
        cashPrice: data.cashPrice,
        creditPrice: data.creditPrice,
        stock: data.stock,
        minStock: data.minStock,
        location: data.location,
        imageUrl: data.imageUrl,
        supplierId: data.supplierId || null,
        status: "ACTIVO",
      },
    });

    revalidatePath("/productos");
    return { success: true, product };
  } catch (error: any) {
    console.error("Error creating product:", error);
    if (error.code === "P2002") {
      return { success: false, error: "El código ya está en uso" };
    }
    return { success: false, error: "Error al crear el producto" };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateProduct(id: string, data: z.infer<typeof productSchema>) {
  try {
    await prisma.product.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        category: data.category,
        subcategory: data.subcategory || null,
        brand: data.brand || null,
        model: data.model || null,
        unit: data.unit,
        costPrice: data.costPrice,
        cashPrice: data.cashPrice,
        creditPrice: data.creditPrice,
        minStock: data.minStock,
        location: data.location || null,
        imageUrl: data.imageUrl || null,
        supplierId: data.supplierId || null,
        status: data.status ?? "ACTIVO",
      },
    });

    revalidatePath("/productos");
    revalidatePath(`/productos/${id}`);
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "El código ya pertenece a otro producto" };
    }
    return { success: false, error: "Error al actualizar el producto" };
  }
}

// ─── Get by id (for edit form) ────────────────────────────────────────────────

export async function getProductById(id: string) {
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return null;
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description ?? "",
    category: p.category as string,
    subcategory: p.subcategory ?? "",
    brand: p.brand ?? "",
    model: p.model ?? "",
    unit: p.unit as string,
    costPrice: Number(p.costPrice),
    cashPrice: Number(p.cashPrice),
    creditPrice: Number(p.creditPrice),
    stock: p.stock,
    minStock: p.minStock,
    location: p.location ?? "",
    imageUrl: p.imageUrl ?? "",
    supplierId: p.supplierId ?? "",
    status: p.status as string,
  };
}

// ─── Get detail (with movements) ─────────────────────────────────────────────

export async function getProductDetail(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      movements: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true } } },
      },
      _count: { select: { saleItems: true, purchaseItems: true } },
    },
  });

  if (!product) return null;

  const margin =
    Number(product.costPrice) > 0
      ? Math.round(
          ((Number(product.cashPrice) - Number(product.costPrice)) /
            Number(product.costPrice)) *
            100
        )
      : 0;

  return {
    id: product.id,
    code: product.code,
    name: product.name,
    description: product.description,
    category: product.category as string,
    subcategory: product.subcategory,
    brand: product.brand,
    model: product.model,
    unit: product.unit as string,
    costPrice: Number(product.costPrice),
    cashPrice: Number(product.cashPrice),
    creditPrice: Number(product.creditPrice),
    stock: product.stock,
    minStock: product.minStock,
    location: product.location,
    imageUrl: product.imageUrl,
    status: product.status as string,
    margin,
    supplier: product.supplier
      ? { id: product.supplier.id, name: product.supplier.name, code: product.supplier.code }
      : null,
    salesCount: product._count.saleItems,
    purchasesCount: product._count.purchaseItems,
    movements: product.movements.map((m) => ({
      id: m.id,
      type: m.type as string,
      quantity: m.quantity,
      previousStock: m.previousStock,
      newStock: m.newStock,
      reason: m.reason,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      userName: m.user.name,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getProducts(params?: {
  search?: string;
  category?: string;
  status?: string;
}) {
  const { search, category, status } = params ?? {};

  const rows = await prisma.product.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(category ? { category: category as any } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
    },
    orderBy: { name: "asc" },
    take: 500,
  });

  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category as string,
    brand: p.brand,
    unit: p.unit as string,
    costPrice: Number(p.costPrice),
    cashPrice: Number(p.cashPrice),
    creditPrice: Number(p.creditPrice),
    stock: p.stock,
    minStock: p.minStock,
    status: p.status as string,
    location: p.location,
    supplierName: p.supplier?.name ?? null,
    isLowStock: p.stock <= p.minStock,
  }));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStockStats() {
  const [products, lowStockCount, outOfStockCount] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVO" },
      select: { costPrice: true, stock: true, minStock: true },
    }),
    prisma.product.count({
      where: {
        status: "ACTIVO",
        stock: { gt: 0 },
        minStock: { gt: 0 },
      },
    }),
    prisma.product.count({
      where: { status: "ACTIVO", stock: 0 },
    }),
  ]);

  const totalProducts = products.length;
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.costPrice) * p.stock,
    0
  );
  const actualLowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= p.minStock
  ).length;

  return {
    totalProducts,
    lowStockCount: actualLowStock,
    outOfStockCount,
    inventoryValue: Math.round(inventoryValue),
  };
}

// ─── For select dropdowns ─────────────────────────────────────────────────────

export async function getProductsForSelect(opts?: { onlyWithStock?: boolean }) {
  const rows = await prisma.product.findMany({
    where: {
      status: "ACTIVO",
      ...(opts?.onlyWithStock ? { stock: { gt: 0 } } : {}),
    },
    select: {
      id: true,
      code: true,
      name: true,
      stock: true,
      cashPrice: true,
      creditPrice: true,
      costPrice: true,
      unit: true,
    },
    orderBy: { name: "asc" },
  });

  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    stock: p.stock,
    cashPrice: Number(p.cashPrice),
    creditPrice: Number(p.creditPrice),
    costPrice: Number(p.costPrice),
    unit: p.unit as string,
  }));
}

// ─── Archive ──────────────────────────────────────────────────────────────────

export async function archiveProduct(id: string) {
  try {
    await prisma.product.update({
      where: { id },
      data: { status: "DESCONTINUADO" },
    });
    revalidatePath("/productos");
    revalidatePath(`/productos/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Error al archivar el producto" };
  }
}

// ─── Adjust stock ─────────────────────────────────────────────────────────────

const adjustSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().refine((v) => v !== 0, "La cantidad no puede ser 0"),
  reason: z.string().min(1, "Ingresá el motivo del ajuste"),
  userId: z.string(),
});

export async function adjustStock(data: z.infer<typeof adjustSchema>) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { stock: true },
    });
    if (!product) return { success: false, error: "Producto no encontrado" };

    const newStock = Math.max(0, product.stock + data.quantity);

    await prisma.$transaction([
      prisma.product.update({
        where: { id: data.productId },
        data: { stock: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          productId: data.productId,
          type: "AJUSTE",
          quantity: Math.abs(data.quantity),
          previousStock: product.stock,
          newStock,
          reason: data.reason,
          userId: data.userId,
        },
      }),
    ]);

    revalidatePath("/productos");
    revalidatePath(`/productos/${data.productId}`);
    return { success: true, newStock };
  } catch (error: any) {
    return { success: false, error: "Error al ajustar el stock" };
  }
}
