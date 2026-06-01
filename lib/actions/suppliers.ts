"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";

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

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getSuppliers() {
  const rows = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { purchases: true, products: true } },
    },
  });

  return rows.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    ruc: s.ruc,
    contactName: s.contactName,
    phone: s.phone,
    email: s.email,
    categories: s.categories,
    paymentTerms: s.paymentTerms,
    notes: s.notes,
    purchasesCount: s._count.purchases,
    productsCount: s._count.products,
    createdAt: s.createdAt.toISOString(),
  }));
}

// ─── Get by id ────────────────────────────────────────────────────────────────

export async function getSupplierById(id: string) {
  const s = await prisma.supplier.findUnique({ where: { id } });
  if (!s) return null;
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    ruc: s.ruc ?? "",
    contactName: s.contactName ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    categories: s.categories ?? "",
    paymentTerms: s.paymentTerms ?? "",
    notes: s.notes ?? "",
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createSupplier(data: z.infer<typeof supplierSchema>) {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        code: data.code,
        name: data.name,
        ruc: data.ruc || null,
        contactName: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        categories: data.categories || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
      },
    });

    revalidatePath("/referenciales/proveedores");
    revalidatePath("/compras/nueva");
    return { success: true, supplier };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "El código ya está en uso" };
    }
    return { success: false, error: "Error al crear el proveedor" };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateSupplier(
  id: string,
  data: z.infer<typeof supplierSchema>
) {
  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        ruc: data.ruc || null,
        contactName: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        categories: data.categories || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
      },
    });

    revalidatePath("/referenciales/proveedores");
    revalidatePath("/compras");
    return { success: true, supplier };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "El código ya está en uso" };
    }
    return { success: false, error: "Error al actualizar el proveedor" };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteSupplier(id: string) {
  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/referenciales/proveedores");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2003") {
      return {
        success: false,
        error: "No se puede eliminar: tiene compras o productos asociados",
      };
    }
    return { success: false, error: "Error al eliminar el proveedor" };
  }
}
