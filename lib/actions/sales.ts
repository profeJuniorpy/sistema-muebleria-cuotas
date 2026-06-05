"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { SaleType, SaleChannel, InterestMode, Frequency } from "@prisma/client";
import { calculateAmortization } from "@/lib/calculations";
import { generateSaleCommission } from "@/lib/commission-helpers";

const saleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
});

const creditPlanSchema = z.object({
  downPayment: z.number().min(0),
  interestRate: z.number().min(0),
  interestMode: z.nativeEnum(InterestMode),
  installments: z.number().int().min(1),
  frequency: z.nativeEnum(Frequency),
  firstDueDate: z.string(),
  lateInterestRate: z.number().min(0),
});

const saleSchema = z.object({
  customerId: z.string(),
  sellerId: z.string(),
  type: z.nativeEnum(SaleType),
  channel: z.nativeEnum(SaleChannel).default("TIENDA"),
  items: z.array(saleItemSchema),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
  creditPlan: creditPlanSchema.optional(),
});

export async function createSale(data: z.infer<typeof saleSchema>) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calcular totales
      const subtotal = data.items.reduce(
        (sum, item) => sum + (item.unitPrice - (item.discount || 0)) * item.quantity,
        0
      );
      const total = subtotal - data.discount;

      // 2. Número de venta
      const count = await tx.sale.count();
      const nextNumber = `VTA-${String(count + 1).padStart(5, "0")}`;

      // 3. Crear venta
      const sale = await tx.sale.create({
        data: {
          number: nextNumber,
          customerId: data.customerId,
          sellerId: data.sellerId,
          type: data.type,
          channel: data.channel,
          subtotal,
          discount: data.discount,
          total,
          status: "PENDIENTE",
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              subtotal: (item.unitPrice - item.discount) * item.quantity,
            })),
          },
        },
      });

      // 4. Descontar stock y registrar movimientos
      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para el producto: ${product?.name || item.productId}`
          );
        }
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
            newStock: product.stock - item.quantity,
            reason: `Venta ${nextNumber}`,
            referenceId: sale.id,
            referenceType: "VENTA",
            userId: data.sellerId,
          },
        });
      }

      // 5. Plan de crédito o completar venta al contado
      if (data.type === "CREDITO" && data.creditPlan) {
        const financedAmount = total - data.creditPlan.downPayment;
        const schedule = calculateAmortization(
          financedAmount,
          data.creditPlan.interestRate,
          data.creditPlan.installments,
          data.creditPlan.frequency,
          data.creditPlan.interestMode,
          new Date(data.creditPlan.firstDueDate)
        );
        const installmentAmount = schedule[0].total;

        await tx.creditPlan.create({
          data: {
            saleId: sale.id,
            downPayment: data.creditPlan.downPayment,
            financedAmount,
            interestRate: data.creditPlan.interestRate,
            interestMode: data.creditPlan.interestMode,
            installments: data.creditPlan.installments,
            frequency: data.creditPlan.frequency,
            installmentAmount,
            firstDueDate: new Date(data.creditPlan.firstDueDate),
            lateInterestRate: data.creditPlan.lateInterestRate,
            amortizationTable: {
              create: schedule.map((row) => ({
                installmentNumber: row.installmentNumber,
                dueDate: row.dueDate,
                principal: row.principal,
                interest: row.interest,
                total: row.total,
                balance: row.balance,
                status: "PENDIENTE",
              })),
            },
          },
        });
      } else if (data.type === "CONTADO") {
        await tx.sale.update({
          where: { id: sale.id },
          data: { status: "COMPLETADA" },
        });
      }

      // 6. Generar comisión AL_VENDER (si aplica según configuración)
      await generateSaleCommission(tx, {
        saleId: sale.id,
        sellerId: data.sellerId,
        saleType: data.type,
        baseAmount: total,
      });

      return sale;
    }, { timeout: 15000 });

    revalidatePath("/ventas");
    revalidatePath("/productos");
    revalidatePath("/comisiones");
    return { success: true, sale: result };
  } catch (error: any) {
    console.error("Error detallado en createSale:", {
      message: error.message,
      stack: error.stack,
      data: data,
    });
    return { success: false, error: error.message || "Error al procesar la venta" };
  }
}
