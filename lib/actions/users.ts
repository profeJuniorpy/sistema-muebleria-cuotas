"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

// ─── Schema ───────────────────────────────────────────────────────────────────

const userCreateSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
  commissionRate: z.coerce.number().min(0).max(100).default(0),
});

const userUpdateSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(), // vacío = sin cambio
  role: z.nativeEnum(Role),
  phone: z.string().optional(),
  commissionRate: z.coerce.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getUsers() {
  const rows = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      commissionRate: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          sales: true,
          payments: true,
        },
      },
    },
  });

  return rows.map((u) => ({
    id: u.id,
    name: u.name ?? "—",
    email: u.email ?? "—",
    role: u.role as string,
    phone: u.phone,
    commissionRate: u.commissionRate,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    salesCount: u._count.sales,
    paymentsCount: u._count.payments,
  }));
}

// ─── Get by id ────────────────────────────────────────────────────────────────

export async function getUserById(id: string) {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      commissionRate: true,
      isActive: true,
    },
  });
  if (!u) return null;
  return {
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    role: u.role as string,
    phone: u.phone ?? "",
    commissionRate: u.commissionRate,
    isActive: u.isActive,
  };
}

// ─── Counts por rol (para página de roles) ────────────────────────────────────

export async function getUserCountsByRole() {
  const rows = await prisma.user.groupBy({
    by: ["role"],
    _count: { _all: true },
    where: { isActive: true },
  });
  return Object.fromEntries(rows.map((r) => [r.role, r._count._all])) as Record<string, number>;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createUser(data: z.infer<typeof userCreateSchema>) {
  try {
    const hashed = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
        phone: data.phone || null,
        commissionRate: data.commissionRate,
        isActive: true,
      },
    });
    revalidatePath("/referenciales/usuarios");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "El email ya está registrado" };
    }
    return { success: false, error: "Error al crear el usuario" };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUser(id: string, data: z.infer<typeof userUpdateSchema>) {
  try {
    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone || null,
      commissionRate: data.commissionRate,
      isActive: data.isActive,
    };

    if (data.password && data.password.length >= 6) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({ where: { id }, data: updateData });
    revalidatePath("/referenciales/usuarios");
    revalidatePath("/ventas/nueva");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "El email ya está en uso" };
    }
    return { success: false, error: "Error al actualizar el usuario" };
  }
}

// ─── Toggle status ────────────────────────────────────────────────────────────

export async function toggleUserStatus(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { isActive: true } });
    if (!user) return { success: false, error: "Usuario no encontrado" };
    await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
    revalidatePath("/referenciales/usuarios");
    return { success: true };
  } catch {
    return { success: false, error: "Error al cambiar el estado" };
  }
}
