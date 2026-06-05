"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { Decimal } from "decimal.js";
import { addDays, differenceInDays } from "date-fns";
import {
  generateInstallmentCommission,
  generateCompletionCommission,
} from "@/lib/commission-helpers";

const paymentSchema = z.object({
  customerId: z.string(),
  saleId: z.string(),
  installmentIds: z.array(z.string()),
  amount: z.coerce.number().min(1),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
  receivedBy: z.string(),
});

export async function registerPayment(data: z.infer<typeof paymentSchema>) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const installments = await tx.amortizationSchedule.findMany({
        where: { id: { in: data.installmentIds } },
        include: { creditPlan: true },
      });

      let totalMora = new Decimal(0);
      const now = new Date();

      for (const inst of installments) {
        if (now > inst.dueDate && inst.status !== "PAGADA") {
          const daysLate = differenceInDays(now, inst.dueDate);
          if (daysLate > 0) {
            const rate = new Decimal(inst.creditPlan.lateInterestRate).dividedBy(100);
            const installmentBalance = new Decimal(inst.total.toString()).minus(
              inst.paidAmount.toString()
            );
            const mora = installmentBalance.times(rate).times(daysLate).dividedBy(30);
            totalMora = totalMora.plus(mora);
          }
        }
      }

      const count = await tx.payment.count();
      const nextNumber = `REC-${String(count + 1).padStart(5, "0")}`;

      const payment = await tx.payment.create({
        data: {
          number: nextNumber,
          customerId: data.customerId,
          saleId: data.saleId,
          receivedBy: data.receivedBy,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          lateInterestApplied: totalMora.toDecimalPlaces(0).toNumber(),
          notes: data.notes,
        },
      });

      let remainingPayment = new Decimal(data.amount);
      const newlyPaidInstallments: Array<{ id: string; total: number }> = [];

      for (const instId of data.installmentIds) {
        const inst = await tx.amortizationSchedule.findUnique({ where: { id: instId } });
        if (!inst) continue;

        const balance = new Decimal(inst.total.toString()).minus(inst.paidAmount.toString());

        if (remainingPayment.gte(balance)) {
          await tx.amortizationSchedule.update({
            where: { id: instId },
            data: { paidAmount: inst.total, status: "PAGADA", paidAt: now },
          });
          newlyPaidInstallments.push({ id: instId, total: Number(inst.total) });
          remainingPayment = remainingPayment.minus(balance);
        } else if (remainingPayment.gt(0)) {
          await tx.amortizationSchedule.update({
            where: { id: instId },
            data: {
              paidAmount: new Decimal(inst.paidAmount.toString())
                .plus(remainingPayment)
                .toNumber(),
              status: "PARCIAL",
            },
          });
          remainingPayment = new Decimal(0);
        }
      }

      // Obtener vendedor de la venta para comisiones
      const saleForCommission = await tx.sale.findUnique({
        where: { id: data.saleId },
        select: { sellerId: true, total: true },
      });

      if (saleForCommission) {
        // AL_COBRAR_CUOTA: comisión por cada cuota recién pagada
        for (const { id, total } of newlyPaidInstallments) {
          await generateInstallmentCommission(tx, {
            saleId: data.saleId,
            sellerId: saleForCommission.sellerId,
            installmentId: id,
            installmentTotal: total,
          });
        }
      }

      const pendingInstallments = await tx.amortizationSchedule.count({
        where: {
          creditPlan: { saleId: data.saleId },
          status: { not: "PAGADA" },
        },
      });

      if (pendingInstallments === 0) {
        await tx.sale.update({
          where: { id: data.saleId },
          data: { status: "COMPLETADA" },
        });

        // AL_COMPLETAR: comisión única cuando el crédito queda totalmente pagado
        if (saleForCommission) {
          await generateCompletionCommission(tx, {
            saleId: data.saleId,
            sellerId: saleForCommission.sellerId,
            saleTotal: Number(saleForCommission.total),
          });
        }
      }

      return payment;
    }, { timeout: 15000 });

    revalidatePath("/cobranzas");
    revalidatePath("/clientes");
    revalidatePath("/ventas");
    revalidatePath("/comisiones");
    revalidatePath(`/creditos/${data.saleId}`);

    // Serializar explícitamente: los campos Decimal y Date de Prisma no son
    // serializables por Next.js Server Actions si se retornan crudos.
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
    console.error("Error registering payment:", error);
    return { success: false as const, error: error.message || "Error al registrar el pago" };
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function updateOverdueInstallments() {
  await prisma.amortizationSchedule.updateMany({
    where: {
      status: { in: ["PENDIENTE", "PARCIAL"] },
      dueDate: { lt: new Date() },
    },
    data: { status: "VENCIDA" },
  });
}

export async function getCobranzasStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [overdueData, upcomingCount, monthlyPayments] = await Promise.all([
    prisma.amortizationSchedule.findMany({
      where: { status: "VENCIDA" },
      select: {
        total: true,
        paidAmount: true,
        creditPlan: { select: { sale: { select: { customerId: true } } } },
      },
    }),
    prisma.amortizationSchedule.count({
      where: {
        status: { in: ["PENDIENTE", "PARCIAL"] },
        dueDate: { gte: now, lte: addDays(now, 7) },
      },
    }),
    prisma.payment.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const overdueBalance = overdueData.reduce(
    (sum, i) => sum + Number(i.total) - Number(i.paidAmount),
    0
  );
  const customersInMora = new Set(overdueData.map((i) => i.creditPlan.sale.customerId)).size;

  return {
    overdueBalance,
    customersInMora,
    upcomingCount,
    collectedThisMonth: Number(monthlyPayments._sum.amount ?? 0),
    paymentsCount: monthlyPayments._count,
  };
}

export async function getPendingInstallments(search?: string) {
  const rows = await prisma.amortizationSchedule.findMany({
    where: {
      status: { in: ["PENDIENTE", "VENCIDA", "PARCIAL"] },
      ...(search
        ? {
            creditPlan: {
              sale: {
                customer: { name: { contains: search, mode: "insensitive" } },
              },
            },
          }
        : {}),
    },
    include: {
      creditPlan: {
        include: {
          sale: {
            select: {
              id: true,
              number: true,
              customer: { select: { id: true, name: true, mobile: true } },
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 300,
  });

  return rows.map((i) => ({
    id: i.id,
    installmentNumber: i.installmentNumber,
    dueDate: i.dueDate.toISOString(),
    total: Number(i.total),
    paidAmount: Number(i.paidAmount),
    balance: Number(i.total) - Number(i.paidAmount),
    status: i.status as string,
    lateInterestRate: Number(i.creditPlan.lateInterestRate),
    saleId: i.creditPlan.sale.id,
    saleNumber: i.creditPlan.sale.number,
    customerId: i.creditPlan.sale.customer.id,
    customerName: i.creditPlan.sale.customer.name,
    customerMobile: i.creditPlan.sale.customer.mobile,
  }));
}

export async function getPaymentHistory(search?: string) {
  const rows = await prisma.payment.findMany({
    where: search
      ? {
          OR: [
            { number: { contains: search, mode: "insensitive" } },
            { customer: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      customer: { select: { id: true, name: true } },
      sale: { select: { id: true, number: true } },
      collector: { select: { name: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return rows.map((p) => ({
    id: p.id,
    number: p.number,
    date: p.date.toISOString(),
    amount: Number(p.amount),
    lateInterestApplied: Number(p.lateInterestApplied),
    paymentMethod: p.paymentMethod as string,
    notes: p.notes,
    customerId: p.customer.id,
    customerName: p.customer.name,
    saleId: p.sale.id,
    saleNumber: p.sale.number,
    collectorName: p.collector.name,
  }));
}

export async function getCustomersWithPendingInstallments() {
  return prisma.customer.findMany({
    where: {
      sales: {
        some: {
          creditPlan: {
            amortizationTable: {
              some: { status: { in: ["PENDIENTE", "VENCIDA", "PARCIAL"] } },
            },
          },
        },
      },
    },
    select: { id: true, name: true, mobile: true, ruc: true },
    orderBy: { name: "asc" },
  });
}

export async function getSalesWithPendingInstallments(customerId: string) {
  const sales = await prisma.sale.findMany({
    where: {
      customerId,
      type: "CREDITO",
      creditPlan: {
        amortizationTable: {
          some: { status: { in: ["PENDIENTE", "VENCIDA", "PARCIAL"] } },
        },
      },
    },
    include: {
      creditPlan: {
        include: {
          amortizationTable: {
            where: { status: { in: ["PENDIENTE", "VENCIDA", "PARCIAL"] } },
            orderBy: { installmentNumber: "asc" },
          },
        },
      },
    },
  });

  return sales.map((s) => ({
    id: s.id,
    number: s.number,
    lateInterestRate: Number(s.creditPlan?.lateInterestRate ?? 0),
    installments:
      s.creditPlan?.amortizationTable.map((i) => ({
        id: i.id,
        installmentNumber: i.installmentNumber,
        dueDate: i.dueDate.toISOString(),
        total: Number(i.total),
        paidAmount: Number(i.paidAmount),
        balance: Number(i.total) - Number(i.paidAmount),
        status: i.status as string,
      })) ?? [],
  }));
}
