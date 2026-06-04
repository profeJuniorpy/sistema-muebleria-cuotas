"use server";

import prisma from "@/lib/prisma";

const CAT_LABELS: Record<string, string> = {
  MUEBLES: "Muebles",
  ELECTRODOMESTICOS: "Electrodomésticos",
  ELECTRONICOS: "Electrónicos",
  COLCHONES: "Colchones",
  OTROS: "Otros",
};

// ─── Products list ────────────────────────────────────────────────────────────

export async function getStorefrontProducts(params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const { search, category, page = 1, limit = 12 } = params ?? {};
  const skip = (page - 1) * limit;

  const where = {
    status: "ACTIVO" as const,
    stock: { gt: 0 },
    ...(category ? { category: category as any } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { brand: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subcategory: true,
        brand: true,
        model: true,
        unit: true,
        cashPrice: true,
        creditPrice: true,
        stock: true,
        imageUrl: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category as string,
      categoryLabel: CAT_LABELS[p.category] ?? p.category,
      subcategory: p.subcategory,
      brand: p.brand,
      model: p.model,
      unit: p.unit as string,
      cashPrice: Number(p.cashPrice),
      creditPrice: Number(p.creditPrice),
      stock: p.stock,
      imageUrl: p.imageUrl,
    })),
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

// ─── Product detail ───────────────────────────────────────────────────────────

export async function getStorefrontProductDetail(id: string) {
  const p = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      subcategory: true,
      brand: true,
      model: true,
      unit: true,
      cashPrice: true,
      creditPrice: true,
      stock: true,
      imageUrl: true,
      status: true,
      supplier: { select: { name: true } },
    },
  });

  if (!p || p.status === "DESCONTINUADO") return null;

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category as string,
    categoryLabel: CAT_LABELS[p.category] ?? p.category,
    subcategory: p.subcategory,
    brand: p.brand,
    model: p.model,
    unit: p.unit as string,
    cashPrice: Number(p.cashPrice),
    creditPrice: Number(p.creditPrice),
    stock: p.stock,
    inStock: p.stock > 0,
    imageUrl: p.imageUrl,
    supplierName: p.supplier?.name ?? null,
  };
}

// ─── Categories with counts ───────────────────────────────────────────────────

export async function getStorefrontCategories() {
  const rows = await prisma.product.groupBy({
    by: ["category"],
    where: { status: "ACTIVO", stock: { gt: 0 } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return rows.map((r) => ({
    category: r.category as string,
    label: CAT_LABELS[r.category] ?? r.category,
    count: r._count.id,
  }));
}

// ─── Company contact ──────────────────────────────────────────────────────────

export async function getCompanyContact() {
  const config = await prisma.companyConfig.findFirst() as any;

  return {
    name: config?.name ?? "Mueblería",
    phone: config?.mobile ?? config?.phone ?? null,
    address: config?.address ?? null,
    city: config?.city ?? null,
    email: config?.email ?? null,
    logoUrl: config?.logoUrl ?? null,
  };
}
