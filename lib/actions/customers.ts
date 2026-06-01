"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { CustomerType, RiskLevel } from "@prisma/client";

// ─── Schema ───────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  code: z.string().min(1, "Código requerido"),
  type: z.nativeEnum(CustomerType),
  name: z.string().min(1, "Nombre requerido"),
  ruc: z.string().min(1, "RUC/CI requerido"),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  department: z.string().optional(),
  reference1Name: z.string().optional(),
  reference1Phone: z.string().optional(),
  reference2Name: z.string().optional(),
  reference2Phone: z.string().optional(),
  employer: z.string().optional(),
  position: z.string().optional(),
  monthlyIncome: z.coerce.number().min(0).default(0),
  creditLimit: z.coerce.number().min(0).default(0),
  riskLevel: z.nativeEnum(RiskLevel).default("BAJO"),
  notes: z.string().optional(),
});

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCustomer(data: z.infer<typeof customerSchema>) {
  try {
    const customer = await prisma.customer.create({
      data: {
        code: data.code,
        type: data.type,
        name: data.name,
        ruc: data.ruc,
        phone: data.phone,
        mobile: data.mobile,
        email: data.email || null,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        department: data.department,
        reference1Name: data.reference1Name,
        reference1Phone: data.reference1Phone,
        reference2Name: data.reference2Name,
        reference2Phone: data.reference2Phone,
        employer: data.employer,
        position: data.position,
        monthlyIncome: data.monthlyIncome,
        creditLimit: data.creditLimit,
        riskLevel: data.riskLevel,
        notes: data.notes,
      },
    });

    revalidatePath("/clientes");
    return { success: true, customer };
  } catch (error: any) {
    console.error("Error creating customer:", error);
    if (error.code === "P2002") {
      return { success: false, error: "El RUC o el Código ya existen" };
    }
    return { success: false, error: "Error al registrar el cliente" };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateCustomer(id: string, data: z.infer<typeof customerSchema>) {
  try {
    await prisma.customer.update({
      where: { id },
      data: {
        code: data.code,
        type: data.type,
        name: data.name,
        ruc: data.ruc,
        phone: data.phone || null,
        mobile: data.mobile || null,
        email: data.email || null,
        address: data.address || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        department: data.department || null,
        reference1Name: data.reference1Name || null,
        reference1Phone: data.reference1Phone || null,
        reference2Name: data.reference2Name || null,
        reference2Phone: data.reference2Phone || null,
        employer: data.employer || null,
        position: data.position || null,
        monthlyIncome: data.monthlyIncome,
        creditLimit: data.creditLimit,
        riskLevel: data.riskLevel,
        notes: data.notes || null,
      },
    });

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "El RUC o Código ya pertenece a otro cliente" };
    }
    return { success: false, error: "Error al actualizar el cliente" };
  }
}

// ─── Get by id (for edit form) ────────────────────────────────────────────────

export async function getCustomerById(id: string) {
  const c = await prisma.customer.findUnique({ where: { id } });
  if (!c) return null;
  return {
    id: c.id,
    code: c.code,
    type: c.type as string,
    name: c.name,
    ruc: c.ruc,
    phone: c.phone ?? "",
    mobile: c.mobile ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    neighborhood: c.neighborhood ?? "",
    city: c.city ?? "",
    department: c.department ?? "",
    reference1Name: c.reference1Name ?? "",
    reference1Phone: c.reference1Phone ?? "",
    reference2Name: c.reference2Name ?? "",
    reference2Phone: c.reference2Phone ?? "",
    employer: c.employer ?? "",
    position: c.position ?? "",
    monthlyIncome: Number(c.monthlyIncome),
    creditLimit: Number(c.creditLimit),
    riskLevel: c.riskLevel as string,
    notes: c.notes ?? "",
  };
}

// ─── Get customer detail (expediente) ────────────────────────────────────────

export async function getCustomerDetail(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { date: "desc" },
        include: {
          items: { select: { productName: true, quantity: true } },
          creditPlan: {
            include: {
              amortizationTable: {
                select: { status: true, total: true, paidAmount: true, dueDate: true },
              },
            },
          },
          _count: { select: { payments: true } },
        },
      },
      payments: {
        orderBy: { date: "desc" },
        take: 10,
        include: {
          sale: { select: { number: true } },
          collector: { select: { name: true } },
        },
      },
    },
  });

  if (!customer) return null;

  // Totales de deuda
  let totalDebt = 0;
  let totalPaid = 0;
  let overdueCount = 0;
  let pendingCount = 0;

  for (const sale of customer.sales) {
    if (!sale.creditPlan) continue;
    for (const inst of sale.creditPlan.amortizationTable) {
      const balance = Number(inst.total) - Number(inst.paidAmount);
      totalDebt += Number(inst.total);
      totalPaid += Number(inst.paidAmount);
      if (inst.status === "VENCIDA") overdueCount++;
      if (inst.status === "PENDIENTE" || inst.status === "VENCIDA" || inst.status === "PARCIAL") {
        pendingCount++;
      }
    }
  }

  return {
    id: customer.id,
    code: customer.code,
    type: customer.type as string,
    name: customer.name,
    ruc: customer.ruc,
    phone: customer.phone,
    mobile: customer.mobile,
    email: customer.email,
    address: customer.address,
    neighborhood: customer.neighborhood,
    city: customer.city,
    department: customer.department,
    reference1Name: customer.reference1Name,
    reference1Phone: customer.reference1Phone,
    reference2Name: customer.reference2Name,
    reference2Phone: customer.reference2Phone,
    employer: customer.employer,
    position: customer.position,
    monthlyIncome: Number(customer.monthlyIncome),
    creditLimit: Number(customer.creditLimit),
    riskLevel: customer.riskLevel as string,
    notes: customer.notes,
    callmebotKey: customer.callmebotKey,
    createdAt: customer.createdAt.toISOString(),

    // Totales calculados
    totalDebt: Math.round(totalDebt),
    totalPaid: Math.round(totalPaid),
    pendingBalance: Math.round(totalDebt - totalPaid),
    overdueInstallments: overdueCount,
    pendingInstallments: pendingCount,

    sales: customer.sales.map((s) => ({
      id: s.id,
      number: s.number,
      date: s.date.toISOString(),
      type: s.type as string,
      status: s.status as string,
      total: Number(s.total),
      paymentsCount: s._count.payments,
      itemSummary: s.items
        .slice(0, 2)
        .map((i) => `${i.productName} x${i.quantity}`)
        .join(", "),
      creditSummary: s.creditPlan
        ? {
            installments: s.creditPlan.installments,
            paid: s.creditPlan.amortizationTable.filter((i) => i.status === "PAGADA").length,
            overdue: s.creditPlan.amortizationTable.filter((i) => i.status === "VENCIDA").length,
          }
        : null,
    })),

    recentPayments: customer.payments.map((p) => ({
      id: p.id,
      number: p.number,
      date: p.date.toISOString(),
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod as string,
      saleNumber: p.sale.number,
      collectorName: p.collector.name,
    })),
  };
}

// ─── CallMeBot key ────────────────────────────────────────────────────────────

export async function updateCustomerCallmebotKey(id: string, callmebotKey: string | null) {
  try {
    await prisma.customer.update({
      where: { id },
      data: { callmebotKey: callmebotKey || null },
    });
    revalidatePath(`/clientes/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Error al guardar la clave" };
  }
}

export async function getCustomerCallmebotKey(id: string) {
  const c = await prisma.customer.findUnique({
    where: { id },
    select: { callmebotKey: true, mobile: true },
  });
  return { callmebotKey: c?.callmebotKey ?? null, mobile: c?.mobile ?? null };
}
