"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { CommissionTrigger } from "@prisma/client";

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getCommissionsStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pendingAgg, paidThisMonth, generatedThisMonth, sellerGroups] =
    await Promise.all([
      prisma.commission.aggregate({
        where: { status: "PENDIENTE" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { status: "PAGADA", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.commission.groupBy({
        by: ["userId"],
        where: { status: "PENDIENTE" },
        _count: true,
      }),
    ]);

  return {
    pendingTotal: Number(pendingAgg._sum.amount ?? 0),
    pendingCount: pendingAgg._count,
    sellersWithPending: sellerGroups.length,
    paidThisMonth: Number(paidThisMonth._sum.amount ?? 0),
    generatedThisMonth: Number(generatedThisMonth._sum.amount ?? 0),
    generatedCount: generatedThisMonth._count,
  };
}

// ─── Resumen agrupado por vendedor ────────────────────────────────────────────

export async function getSellerSummaries() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const commissions = await prisma.commission.findMany({
    include: {
      recipient: {
        select: { id: true, name: true, email: true, commissionRate: true },
      },
      sale: { select: { number: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byUser: Record<
    string,
    {
      sellerId: string;
      sellerName: string;
      sellerEmail: string;
      sellerRate: number;
      pendingCount: number;
      pendingAmount: number;
      paidThisMonthAmount: number;
      totalAmount: number;
      pendingCommissionIds: string[];
    }
  > = {};

  for (const c of commissions) {
    const key = c.userId;
    if (!byUser[key]) {
      byUser[key] = {
        sellerId: c.recipient.id,
        sellerName: c.recipient.name ?? "Sin nombre",
        sellerEmail: c.recipient.email ?? "",
        sellerRate: c.recipient.commissionRate,
        pendingCount: 0,
        pendingAmount: 0,
        paidThisMonthAmount: 0,
        totalAmount: 0,
        pendingCommissionIds: [],
      };
    }

    const amount = Number(c.amount);
    byUser[key].totalAmount += amount;

    if (c.status === "PENDIENTE") {
      byUser[key].pendingCount++;
      byUser[key].pendingAmount += amount;
      byUser[key].pendingCommissionIds.push(c.id);
    }

    if (c.status === "PAGADA" && c.paidAt && c.paidAt >= startOfMonth) {
      byUser[key].paidThisMonthAmount += amount;
    }
  }

  return Object.values(byUser).sort((a, b) => b.pendingAmount - a.pendingAmount);
}

// ─── Listado detallado de comisiones ─────────────────────────────────────────

export async function getAllCommissions(search?: string) {
  const rows = await prisma.commission.findMany({
    where: search
      ? {
          OR: [
            {
              recipient: {
                name: { contains: search, mode: "insensitive" },
              },
            },
            {
              sale: { number: { contains: search, mode: "insensitive" } },
            },
          ],
        }
      : undefined,
    include: {
      recipient: { select: { name: true } },
      sale: {
        select: {
          number: true,
          type: true,
          customer: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return rows.map((c) => ({
    id: c.id,
    createdAt: c.createdAt.toISOString(),
    saleId: c.saleId,
    saleNumber: c.sale.number,
    saleType: c.sale.type as string,
    customerName: c.sale.customer.name,
    triggerType: c.triggerType as string,
    sellerName: c.recipient.name ?? "—",
    amount: Number(c.amount),
    rate: Number(c.rate),
    status: c.status as string,
    paidAt: c.paidAt?.toISOString() ?? null,
  }));
}

// ─── Liquidación ──────────────────────────────────────────────────────────────

export async function liquidateCommissions(commissionIds: string[], paidBy: string) {
  if (commissionIds.length === 0) return { success: false, error: "Sin comisiones" };

  try {
    await prisma.commission.updateMany({
      where: { id: { in: commissionIds }, status: "PENDIENTE" },
      data: { status: "PAGADA", paidAt: new Date(), paidBy },
    });

    revalidatePath("/comisiones");
    return { success: true, count: commissionIds.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Configuración global ─────────────────────────────────────────────────────

export async function getCommissionSettings() {
  const settings = await prisma.commissionSettings.findFirst();
  if (!settings) return null;
  return {
    id: settings.id,
    cashSaleRate: Number(settings.cashSaleRate),
    creditSaleRate: Number(settings.creditSaleRate),
    trigger: settings.trigger as string,
  };
}

const settingsSchema = z.object({
  cashSaleRate: z.coerce.number().min(0).max(100),
  creditSaleRate: z.coerce.number().min(0).max(100),
  trigger: z.nativeEnum(CommissionTrigger),
  updatedBy: z.string(),
});

export async function saveCommissionSettings(
  data: z.infer<typeof settingsSchema>
) {
  try {
    const parsed = settingsSchema.parse(data);
    const existing = await prisma.commissionSettings.findFirst();

    if (existing) {
      await prisma.commissionSettings.update({
        where: { id: existing.id },
        data: {
          cashSaleRate: parsed.cashSaleRate,
          creditSaleRate: parsed.creditSaleRate,
          trigger: parsed.trigger,
          updatedBy: parsed.updatedBy,
        },
      });
    } else {
      await prisma.commissionSettings.create({
        data: {
          cashSaleRate: parsed.cashSaleRate,
          creditSaleRate: parsed.creditSaleRate,
          trigger: parsed.trigger,
          updatedBy: parsed.updatedBy,
        },
      });
    }

    revalidatePath("/comisiones");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Vendedores con sus tasas personales ─────────────────────────────────────

export async function getSellersWithRates() {
  const sellers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["VENDEDOR", "SUPERVISOR", "ADMIN"] },
    },
    select: { id: true, name: true, email: true, commissionRate: true, role: true },
    orderBy: { name: "asc" },
  });

  return sellers.map((s) => ({
    id: s.id,
    name: s.name ?? "Sin nombre",
    email: s.email ?? "",
    role: s.role as string,
    commissionRate: s.commissionRate,
  }));
}

export async function updateSellerRate(userId: string, rate: number) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { commissionRate: rate },
    });
    revalidatePath("/comisiones");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
