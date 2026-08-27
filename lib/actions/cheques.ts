"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { ChequeType, ChequeStatus } from "@prisma/client";

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getChequeStats() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [pendingEmitidos, pendingRecibidos, upcoming, rejected] = await Promise.all([
    prisma.cheque.aggregate({
      where: { type: "EMITIDO", status: "PENDIENTE" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.cheque.aggregate({
      where: { type: "RECIBIDO", status: "PENDIENTE" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.cheque.count({
      where: { status: "PENDIENTE", dueDate: { gte: now, lte: in7Days } },
    }),
    prisma.cheque.count({
      where: { status: "RECHAZADO" },
    }),
  ]);

  return {
    pendingEmitidosTotal: Number(pendingEmitidos._sum.amount ?? 0),
    pendingEmitidosCount: pendingEmitidos._count,
    pendingRecibidosTotal: Number(pendingRecibidos._sum.amount ?? 0),
    pendingRecibidosCount: pendingRecibidos._count,
    upcomingCount: upcoming,
    rejectedCount: rejected,
  };
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getCheques(filters?: { type?: string; status?: string; search?: string }) {
  const rows = await prisma.cheque.findMany({
    where: {
      ...(filters?.type ? { type: filters.type as ChequeType } : {}),
      ...(filters?.status ? { status: filters.status as ChequeStatus } : {}),
      ...(filters?.search
        ? {
            OR: [
              { number: { contains: filters.search, mode: "insensitive" as const } },
              { partyName: { contains: filters.search, mode: "insensitive" as const } },
              { bankName: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      customer: { select: { name: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 300,
  });

  return rows.map((c) => ({
    id: c.id,
    number: c.number,
    type: c.type as string,
    bankName: c.bankName,
    amount: Number(c.amount),
    issueDate: c.issueDate.toISOString(),
    dueDate: c.dueDate.toISOString(),
    status: c.status as string,
    partyName: c.partyName,
    partyDocument: c.partyDocument,
    concept: c.concept,
    customerName: c.customer?.name ?? null,
    supplierName: c.supplier?.name ?? null,
  }));
}

export async function getChequeDetail(id: string) {
  const c = await prisma.cheque.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      registrar: { select: { name: true } },
    },
  });
  if (!c) return null;

  return {
    id: c.id,
    number: c.number,
    type: c.type as string,
    bankName: c.bankName,
    amount: Number(c.amount),
    issueDate: c.issueDate.toISOString(),
    dueDate: c.dueDate.toISOString(),
    status: c.status as string,
    partyName: c.partyName,
    partyDocument: c.partyDocument,
    concept: c.concept,
    notes: c.notes,
    clearedAt: c.clearedAt?.toISOString() ?? null,
    customer: c.customer,
    supplier: c.supplier,
    registeredByName: c.registrar.name,
    createdAt: c.createdAt.toISOString(),
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────

const chequeSchema = z.object({
  type: z.nativeEnum(ChequeType),
  number: z.string().min(1, "Ingresá el número de cheque"),
  bankName: z.string().min(1, "Ingresá el banco"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  partyName: z.string().min(1, "Ingresá el beneficiario / librador"),
  partyDocument: z.string().optional(),
  concept: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

export type ChequeFormData = z.infer<typeof chequeSchema>;

export async function createCheque(data: ChequeFormData, userId: string) {
  try {
    const parsed = chequeSchema.parse(data);

    await prisma.cheque.create({
      data: {
        type: parsed.type,
        number: parsed.number,
        bankName: parsed.bankName,
        amount: parsed.amount,
        issueDate: new Date(parsed.issueDate),
        dueDate: new Date(parsed.dueDate),
        partyName: parsed.partyName,
        partyDocument: parsed.partyDocument || null,
        concept: parsed.concept || null,
        customerId: parsed.customerId || null,
        supplierId: parsed.supplierId || null,
        notes: parsed.notes || null,
        registeredBy: userId,
        status: "PENDIENTE",
      },
    });

    revalidatePath("/cheques");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.issues?.[0]?.message ?? "Error al registrar el cheque",
    };
  }
}

// ─── Status transitions ────────────────────────────────────────────────────────

export async function updateChequeStatus(id: string, status: ChequeStatus) {
  try {
    await prisma.cheque.update({
      where: { id },
      data: {
        status,
        clearedAt: status === "COBRADO" ? new Date() : status === "PENDIENTE" ? null : undefined,
      },
    });
    revalidatePath("/cheques");
    revalidatePath(`/cheques/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el estado del cheque" };
  }
}
