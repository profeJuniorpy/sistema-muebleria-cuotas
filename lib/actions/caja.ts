"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { WithdrawalCategory, PaymentMethod } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function calcSystemBalance(cashRegisterId: string, openedAt: Date, closedAt?: Date | null) {
  const dateFilter = closedAt
    ? { gte: openedAt, lte: closedAt }
    : { gte: openedAt };

  const [paymentsAgg, withdrawalsAgg, cashRegister] = await Promise.all([
    prisma.payment.aggregate({
      where: { createdAt: dateFilter },
      _sum: { amount: true },
    }),
    prisma.cashWithdrawal.aggregate({
      where: { cashRegisterId },
      _sum: { amount: true },
    }),
    prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      select: { openingBalance: true },
    }),
  ]);

  const opening = Number(cashRegister?.openingBalance ?? 0);
  const received = Number(paymentsAgg._sum.amount ?? 0);
  const withdrawn = Number(withdrawalsAgg._sum.amount ?? 0);

  return Math.round(opening + received - withdrawn);
}

// ─── Stats / current state ────────────────────────────────────────────────────

export async function getCajaStats() {
  const openCaja = await prisma.cashRegister.findFirst({
    where: { status: "ABIERTA" },
    include: {
      openedByUser: { select: { name: true } },
      _count: { select: { withdrawals: true, counts: true } },
    },
    orderBy: { openedAt: "desc" },
  });

  const totalCajas = await prisma.cashRegister.count();

  if (!openCaja) {
    return { openCaja: null, totalCajas };
  }

  const systemBalance = await calcSystemBalance(openCaja.id, openCaja.openedAt);

  const paymentsAgg = await prisma.payment.aggregate({
    where: { createdAt: { gte: openCaja.openedAt } },
    _sum: { amount: true },
    _count: true,
  });

  const withdrawalsAgg = await prisma.cashWithdrawal.aggregate({
    where: { cashRegisterId: openCaja.id },
    _sum: { amount: true },
    _count: true,
  });

  return {
    openCaja: {
      id: openCaja.id,
      number: openCaja.number,
      openedAt: openCaja.openedAt.toISOString(),
      openedByName: openCaja.openedByUser.name ?? "—",
      openingBalance: Number(openCaja.openingBalance),
      systemBalance,
      paymentsReceived: Number(paymentsAgg._sum.amount ?? 0),
      paymentsCount: paymentsAgg._count,
      withdrawalsTotal: Number(withdrawalsAgg._sum.amount ?? 0),
      withdrawalsCount: withdrawalsAgg._count,
      withdrawalCount: openCaja._count.withdrawals,
      arqueoCount: openCaja._count.counts,
    },
    totalCajas,
  };
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getCajas() {
  const rows = await prisma.cashRegister.findMany({
    include: {
      openedByUser: { select: { name: true } },
      closedByUser: { select: { name: true } },
      _count: { select: { withdrawals: true, counts: true } },
    },
    orderBy: { openedAt: "desc" },
    take: 100,
  });

  return rows.map((c) => ({
    id: c.id,
    number: c.number,
    status: c.status as string,
    openedAt: c.openedAt.toISOString(),
    closedAt: c.closedAt?.toISOString() ?? null,
    openedByName: c.openedByUser.name ?? "—",
    closedByName: c.closedByUser?.name ?? null,
    openingBalance: Number(c.openingBalance),
    closingBalance: c.closingBalance !== null ? Number(c.closingBalance) : null,
    systemBalance: c.systemBalance !== null ? Number(c.systemBalance) : null,
    difference: c.difference !== null ? Number(c.difference) : null,
    withdrawalCount: c._count.withdrawals,
    arqueoCount: c._count.counts,
  }));
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getCajaDetail(id: string) {
  const caja = await prisma.cashRegister.findUnique({
    where: { id },
    include: {
      openedByUser: { select: { name: true } },
      closedByUser: { select: { name: true } },
      withdrawals: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      counts: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!caja) return null;

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: caja.closedAt
        ? { gte: caja.openedAt, lte: caja.closedAt }
        : { gte: caja.openedAt },
    },
    include: {
      customer: { select: { name: true } },
      collector: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const systemBalance = await calcSystemBalance(id, caja.openedAt, caja.closedAt);
  const paymentsTotal = payments.reduce((s, p) => s + Number(p.amount), 0);
  const withdrawalsTotal = caja.withdrawals.reduce((s, w) => s + Number(w.amount), 0);

  return {
    id: caja.id,
    number: caja.number,
    status: caja.status as string,
    openedAt: caja.openedAt.toISOString(),
    closedAt: caja.closedAt?.toISOString() ?? null,
    openedByName: caja.openedByUser.name ?? "—",
    closedByName: caja.closedByUser?.name ?? null,
    openingBalance: Number(caja.openingBalance),
    closingBalance: caja.closingBalance !== null ? Number(caja.closingBalance) : null,
    systemBalance: caja.systemBalance !== null ? Number(caja.systemBalance) : systemBalance,
    difference: caja.difference !== null ? Number(caja.difference) : null,
    notes: caja.notes,

    paymentsTotal: Math.round(paymentsTotal),
    withdrawalsTotal: Math.round(withdrawalsTotal),
    currentSystemBalance: systemBalance,

    payments: payments.map((p) => ({
      id: p.id,
      number: p.number,
      date: p.createdAt.toISOString(),
      customerName: p.customer.name,
      collectorName: p.collector.name ?? "—",
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod as string,
    })),

    withdrawals: caja.withdrawals.map((w) => ({
      id: w.id,
      number: w.number,
      amount: Number(w.amount),
      concept: w.concept,
      category: w.category as string,
      userName: w.user.name ?? "—",
      createdAt: w.createdAt.toISOString(),
    })),

    counts: caja.counts.map((c) => ({
      id: c.id,
      countedAmount: Number(c.countedAmount),
      systemAmount: Number(c.systemAmount),
      difference: Number(c.difference),
      notes: c.notes,
      userName: c.user.name ?? "—",
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

// ─── Open caja ────────────────────────────────────────────────────────────────

const openSchema = z.object({
  userId: z.string(),
  openingBalance: z.number().min(0),
  notes: z.string().optional(),
});

export async function abrirCaja(data: z.infer<typeof openSchema>) {
  try {
    const existing = await prisma.cashRegister.findFirst({
      where: { status: "ABIERTA" },
    });
    if (existing) {
      return { success: false, error: "Ya existe una caja abierta. Cerrá la caja actual antes de abrir una nueva." };
    }

    const count = await prisma.cashRegister.count();
    const number = `CAJ-${String(count + 1).padStart(5, "0")}`;

    const caja = await prisma.cashRegister.create({
      data: {
        number,
        openedBy: data.userId,
        openingBalance: data.openingBalance,
        notes: data.notes,
        status: "ABIERTA",
      },
    });

    revalidatePath("/caja");
    return { success: true, id: caja.id };
  } catch {
    return { success: false, error: "Error al abrir la caja" };
  }
}

// ─── Close caja ───────────────────────────────────────────────────────────────

const closeSchema = z.object({
  cashRegisterId: z.string(),
  userId: z.string(),
  closingBalance: z.number().min(0),
  notes: z.string().optional(),
});

export async function cerrarCaja(data: z.infer<typeof closeSchema>) {
  try {
    const caja = await prisma.cashRegister.findUnique({
      where: { id: data.cashRegisterId },
    });
    if (!caja) return { success: false, error: "Caja no encontrada" };
    if (caja.status === "CERRADA") return { success: false, error: "La caja ya está cerrada" };

    const now = new Date();
    const systemBalance = await calcSystemBalance(caja.id, caja.openedAt, now);
    const difference = data.closingBalance - systemBalance;

    await prisma.cashRegister.update({
      where: { id: data.cashRegisterId },
      data: {
        status: "CERRADA",
        closedBy: data.userId,
        closedAt: now,
        closingBalance: data.closingBalance,
        systemBalance,
        difference,
        notes: data.notes ?? caja.notes,
      },
    });

    revalidatePath("/caja");
    revalidatePath(`/caja/${data.cashRegisterId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Error al cerrar la caja" };
  }
}

// ─── Register withdrawal ──────────────────────────────────────────────────────

const withdrawalSchema = z.object({
  cashRegisterId: z.string(),
  userId: z.string(),
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
  concept: z.string().min(1, "El concepto es requerido"),
  category: z.nativeEnum(WithdrawalCategory),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});

export async function registrarRetiro(data: z.infer<typeof withdrawalSchema>) {
  try {
    const caja = await prisma.cashRegister.findUnique({
      where: { id: data.cashRegisterId },
    });
    if (!caja) return { success: false, error: "Caja no encontrada" };
    if (caja.status === "CERRADA") return { success: false, error: "No se puede registrar un retiro en una caja cerrada" };

    const count = await prisma.cashWithdrawal.count();
    const number = `RET-${String(count + 1).padStart(5, "0")}`;

    await prisma.cashWithdrawal.create({
      data: {
        number,
        cashRegisterId: data.cashRegisterId,
        userId: data.userId,
        amount: data.amount,
        concept: data.concept,
        category: data.category,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
      },
    });

    revalidatePath("/caja");
    revalidatePath(`/caja/${data.cashRegisterId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Error al registrar el retiro" };
  }
}

// ─── Register arqueo ──────────────────────────────────────────────────────────

const arqueoSchema = z.object({
  cashRegisterId: z.string(),
  userId: z.string(),
  countedAmount: z.number().min(0),
  notes: z.string().optional(),
});

export async function registrarArqueo(data: z.infer<typeof arqueoSchema>) {
  try {
    const caja = await prisma.cashRegister.findUnique({
      where: { id: data.cashRegisterId },
    });
    if (!caja) return { success: false, error: "Caja no encontrada" };
    if (caja.status === "CERRADA") return { success: false, error: "No se puede arquear una caja cerrada" };

    const systemAmount = await calcSystemBalance(caja.id, caja.openedAt);
    const difference = data.countedAmount - systemAmount;

    await prisma.cashCount.create({
      data: {
        cashRegisterId: data.cashRegisterId,
        userId: data.userId,
        countedAmount: data.countedAmount,
        systemAmount,
        difference,
        notes: data.notes,
      },
    });

    revalidatePath("/caja");
    revalidatePath(`/caja/${data.cashRegisterId}`);
    return { success: true, systemAmount, difference };
  } catch {
    return { success: false, error: "Error al registrar el arqueo" };
  }
}
