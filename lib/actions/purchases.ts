"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PurchaseType, Frequency, PaymentMethod } from "@prisma/client";
import { addWeeks, addDays, addMonths } from "date-fns";
import { Decimal } from "decimal.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSupplierSchedule(
  financedAmount: number,
  installments: number,
  frequency: string,
  firstDueDate: Date
) {
  const base = Math.floor(financedAmount / installments);
  const remainder = financedAmount - base * installments;
  const rows = [];

  for (let i = 0; i < installments; i++) {
    let dueDate: Date;
    if (frequency === "SEMANAL") dueDate = addWeeks(firstDueDate, i);
    else if (frequency === "QUINCENAL") dueDate = addDays(firstDueDate, i * 15);
    else dueDate = addMonths(firstDueDate, i);

    rows.push({
      installmentNumber: i + 1,
      dueDate,
      amount: i === installments - 1 ? base + remainder : base,
      status: "PENDIENTE" as const,
    });
  }
  return rows;
}

// ─── Sync overdue statuses ────────────────────────────────────────────────────

export async function updateOverdueSupplierInstallments() {
  await prisma.supplierAmortizationSchedule.updateMany({
    where: {
      status: { in: ["PENDIENTE", "PARCIAL"] },
      dueDate: { lt: new Date() },
    },
    data: { status: "VENCIDA" },
  });
}

// ─── KPI Stats ────────────────────────────────────────────────────────────────

export async function getPurchaseStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthlyAgg, pendingRows, activeCreditCount, suppliersCount] =
    await Promise.all([
      prisma.purchase.aggregate({
        where: { date: { gte: startOfMonth }, status: { not: "CANCELADA" } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.supplierAmortizationSchedule.findMany({
        where: { status: { in: ["PENDIENTE", "VENCIDA", "PARCIAL"] } },
        select: { amount: true, paidAmount: true },
      }),
      prisma.purchase.count({
        where: { type: "CREDITO", status: { in: ["PENDIENTE", "MORA"] } },
      }),
      prisma.supplier.count(),
    ]);

  const pendingBalance = pendingRows.reduce(
    (s, i) => s + Number(i.amount) - Number(i.paidAmount),
    0
  );

  return {
    monthlyTotal: Number(monthlyAgg._sum.total ?? 0),
    monthlyCount: monthlyAgg._count,
    pendingBalance: Math.round(pendingBalance),
    activeCreditCount,
    suppliersCount,
  };
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getPurchases(search?: string) {
  const rows = await prisma.purchase.findMany({
    where: search
      ? {
          OR: [
            { number: { contains: search, mode: "insensitive" } },
            { supplier: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      supplier: { select: { id: true, name: true } },
      _count: { select: { items: true } },
      creditPlan: {
        include: {
          amortizationTable: {
            select: { amount: true, paidAmount: true, status: true },
          },
        },
      },
    },
    orderBy: { date: "desc" },
    take: 300,
  });

  return rows.map((p) => {
    const pendingBalance =
      p.creditPlan?.amortizationTable
        .filter((i) => i.status !== "PAGADA")
        .reduce((s, i) => s + Number(i.amount) - Number(i.paidAmount), 0) ?? 0;

    return {
      id: p.id,
      number: p.number,
      date: p.date.toISOString(),
      supplierId: p.supplier.id,
      supplierName: p.supplier.name,
      type: p.type as string,
      status: p.status as string,
      total: Number(p.total),
      itemCount: p._count.items,
      pendingBalance: Math.round(pendingBalance),
    };
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

const purchaseItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().min(1),
  unitCost: z.number().min(0),
  discount: z.number().min(0).default(0),
});

const supplierCreditPlanSchema = z.object({
  downPayment: z.number().min(0),
  installments: z.number().int().min(1),
  frequency: z.nativeEnum(Frequency),
  firstDueDate: z.string(),
});

const purchaseSchema = z.object({
  supplierId: z.string(),
  buyerId: z.string(),
  type: z.nativeEnum(PurchaseType),
  items: z.array(purchaseItemSchema).min(1),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
  creditPlan: supplierCreditPlanSchema.optional(),
});

export async function createPurchase(data: z.infer<typeof purchaseSchema>) {
  try {
    // Validación defensiva: crédito sin plan = error explícito
    if (data.type === "CREDITO" && !data.creditPlan) {
      return { success: false, error: "Una compra a crédito requiere un plan de cuotas" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const subtotal = data.items.reduce(
        (sum, item) =>
          sum + (Number(item.unitCost) - Number(item.discount || 0)) * Number(item.quantity),
        0
      );
      const total = subtotal - Number(data.discount || 0);

      const count = await tx.purchase.count();
      const nextNumber = `CMP-${String(count + 1).padStart(5, "0")}`;

      const purchase = await tx.purchase.create({
        data: {
          number: nextNumber,
          supplierId: data.supplierId,
          userId: data.buyerId,
          type: data.type,
          subtotal,
          discount: Number(data.discount || 0),
          total,
          status: "PENDIENTE",
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: Number(item.quantity),
              unitCost: Number(item.unitCost),
              discount: Number(item.discount || 0),
              subtotal:
                (Number(item.unitCost) - Number(item.discount || 0)) * Number(item.quantity),
            })),
          },
        },
      });

      // Incrementar stock + movimientos ENTRADA
      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "ENTRADA",
            quantity: item.quantity,
            previousStock: product.stock,
            newStock: product.stock + item.quantity,
            reason: `Compra ${nextNumber}`,
            referenceId: purchase.id,
            referenceType: "COMPRA",
            userId: data.buyerId,
          },
        });
      }

      if (data.type === "CREDITO" && data.creditPlan) {
        const downPayment = Number(data.creditPlan.downPayment || 0);
        const financedAmount = Math.max(0, total - downPayment);
        const installments = Math.round(Number(data.creditPlan.installments));

        const schedule = generateSupplierSchedule(
          financedAmount,
          installments,
          data.creditPlan.frequency,
          new Date(data.creditPlan.firstDueDate)
        );

        await tx.supplierCreditPlan.create({
          data: {
            purchaseId: purchase.id,
            downPayment,
            financedAmount,
            installments,
            frequency: data.creditPlan.frequency,
            firstDueDate: new Date(data.creditPlan.firstDueDate),
            amortizationTable: {
              create: schedule.map((row) => ({
                installmentNumber: row.installmentNumber,
                dueDate: row.dueDate,
                amount: row.amount,
                status: "PENDIENTE",
              })),
            },
          },
        });
      } else if (data.type === "CONTADO") {
        await tx.purchase.update({
          where: { id: purchase.id },
          data: { status: "COMPLETADA" },
        });
      }

      return purchase;
    });

    revalidatePath("/compras");
    revalidatePath("/productos");
    return { success: true, purchase: result };
  } catch (error: any) {
    console.error("Error en createPurchase:", error);
    return { success: false, error: error.message || "Error al procesar la compra" };
  }
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getPurchaseDetail(id: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      user: { select: { name: true } },
      items: { include: { product: { select: { code: true } } } },
      creditPlan: {
        include: {
          amortizationTable: { orderBy: { installmentNumber: "asc" } },
        },
      },
      payments: { orderBy: { date: "desc" } },
    },
  });

  if (!purchase) return null;

  const plan = purchase.creditPlan;
  const rows = plan?.amortizationTable ?? [];
  const paidCount = rows.filter((i) => i.status === "PAGADA").length;
  const overdueCount = rows.filter((i) => i.status === "VENCIDA").length;
  const pendingBalance = rows
    .filter((i) => i.status !== "PAGADA")
    .reduce((s, i) => s + Number(i.amount) - Number(i.paidAmount), 0);
  const totalPaid = purchase.payments.reduce((s, p) => s + Number(p.amount), 0);

  return {
    id: purchase.id,
    number: purchase.number,
    date: purchase.date.toISOString(),
    type: purchase.type as string,
    status: purchase.status as string,
    subtotal: Number(purchase.subtotal),
    discount: Number(purchase.discount),
    total: Number(purchase.total),
    notes: purchase.notes,
    buyerName: purchase.user.name,

    supplier: {
      id: purchase.supplier.id,
      name: purchase.supplier.name,
      ruc: purchase.supplier.ruc,
      phone: purchase.supplier.phone,
      contactName: purchase.supplier.contactName,
    },

    items: purchase.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      productCode: i.product.code,
      quantity: i.quantity,
      unitCost: Number(i.unitCost),
      discount: Number(i.discount),
      subtotal: Number(i.subtotal),
    })),

    plan: plan
      ? {
          downPayment: Number(plan.downPayment),
          financedAmount: Number(plan.financedAmount),
          installments: plan.installments,
          frequency: plan.frequency as string,
          installmentAmount: rows[0] ? Number(rows[0].amount) : 0,
          firstDueDate: plan.firstDueDate.toISOString(),
        }
      : null,

    paidInstallments: paidCount,
    overdueInstallments: overdueCount,
    pendingBalance: Math.round(pendingBalance),
    totalPaid: Math.round(totalPaid),

    amortizationTable: rows.map((i) => ({
      id: i.id,
      installmentNumber: i.installmentNumber,
      dueDate: i.dueDate.toISOString(),
      amount: Number(i.amount),
      paidAmount: Number(i.paidAmount),
      status: i.status as string,
      paidAt: i.paidAt?.toISOString() ?? null,
    })),

    payments: purchase.payments.map((p) => ({
      id: p.id,
      number: p.number,
      date: p.date.toISOString(),
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod as string,
      notes: p.notes,
    })),
  };
}

// ─── Register supplier payment ────────────────────────────────────────────────

const supplierPaymentSchema = z.object({
  purchaseId: z.string(),
  supplierId: z.string(),
  installmentIds: z.array(z.string()),
  amount: z.coerce.number().min(1),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
  userId: z.string(),
});

export async function registerSupplierPayment(
  data: z.infer<typeof supplierPaymentSchema>
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.supplierPayment.count();
      const number = `PAG-${String(count + 1).padStart(5, "0")}`;

      const payment = await tx.supplierPayment.create({
        data: {
          number,
          purchaseId: data.purchaseId,
          supplierId: data.supplierId,
          userId: data.userId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        },
      });

      let remaining = new Decimal(data.amount);
      const now = new Date();

      for (const instId of data.installmentIds) {
        const inst = await tx.supplierAmortizationSchedule.findUnique({
          where: { id: instId },
        });
        if (!inst) continue;

        const balance = new Decimal(inst.amount.toString()).minus(
          inst.paidAmount.toString()
        );

        if (remaining.gte(balance)) {
          await tx.supplierAmortizationSchedule.update({
            where: { id: instId },
            data: { paidAmount: inst.amount, status: "PAGADA", paidAt: now },
          });
          remaining = remaining.minus(balance);
        } else if (remaining.gt(0)) {
          await tx.supplierAmortizationSchedule.update({
            where: { id: instId },
            data: {
              paidAmount: new Decimal(inst.paidAmount.toString())
                .plus(remaining)
                .toNumber(),
              status: "PARCIAL",
            },
          });
          remaining = new Decimal(0);
        }
      }

      const pending = await tx.supplierAmortizationSchedule.count({
        where: {
          creditPlan: { purchaseId: data.purchaseId },
          status: { not: "PAGADA" },
        },
      });

      if (pending === 0) {
        await tx.purchase.update({
          where: { id: data.purchaseId },
          data: { status: "COMPLETADA" },
        });
      }

      return payment;
    });

    revalidatePath("/compras");
    revalidatePath(`/compras/${data.purchaseId}`);

    // Serializar explícitamente: los campos Decimal y Date de Prisma
    // no son serializables por Next.js Server Actions si se retornan crudos.
    return {
      success: true as const,
      payment: {
        id: result.id,
        number: result.number,
        amount: Number(result.amount),
        date: result.date.toISOString(),
        paymentMethod: result.paymentMethod as string,
      },
    };
  } catch (error: any) {
    console.error("Error en registerSupplierPayment:", error);
    return { success: false as const, error: error.message ?? "Error al registrar el pago" };
  }
}

// ─── Cancel purchase ──────────────────────────────────────────────────────────

export async function cancelPurchase(purchaseId: string) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        items: true,
        creditPlan: { include: { amortizationTable: true } },
      },
    });

    if (!purchase) return { success: false, error: "Compra no encontrada" };
    if (purchase.status === "COMPLETADA") {
      return { success: false, error: "No se puede cancelar una compra ya completada" };
    }

    await prisma.$transaction(async (tx) => {
      // Revertir stock
      for (const item of purchase.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "SALIDA",
            quantity: item.quantity,
            previousStock: product.stock,
            newStock: Math.max(0, product.stock - item.quantity),
            reason: `Cancelación compra ${purchase.number}`,
            referenceId: purchaseId,
            referenceType: "CANCELACION_COMPRA",
            userId: purchase.userId,
          },
        });
      }

      // Cancelar cuotas pendientes si hay plan de crédito
      if (purchase.creditPlan) {
        await tx.supplierAmortizationSchedule.updateMany({
          where: {
            creditPlanId: purchase.creditPlan.id,
            status: { in: ["PENDIENTE", "VENCIDA", "PARCIAL"] },
          },
          data: { status: "PENDIENTE" },
        });
      }

      await tx.purchase.update({
        where: { id: purchaseId },
        data: { status: "CANCELADA" },
      });
    });

    revalidatePath("/compras");
    revalidatePath("/productos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message ?? "Error al cancelar la compra" };
  }
}

// ─── Supplier installments for payment dialog ─────────────────────────────────

export async function getSupplierInstallments(purchaseId: string) {
  const rows = await prisma.supplierAmortizationSchedule.findMany({
    where: {
      creditPlan: { purchaseId },
      status: { in: ["PENDIENTE", "VENCIDA", "PARCIAL"] },
    },
    orderBy: { installmentNumber: "asc" },
  });

  return rows.map((i) => ({
    id: i.id,
    installmentNumber: i.installmentNumber,
    dueDate: i.dueDate.toISOString(),
    amount: Number(i.amount),
    paidAmount: Number(i.paidAmount),
    balance: Number(i.amount) - Number(i.paidAmount),
    status: i.status as string,
  }));
}
