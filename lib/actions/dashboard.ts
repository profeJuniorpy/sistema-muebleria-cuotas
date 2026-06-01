"use server";

import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardStats() {
  try {
    const now = new Date();
    const startMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);

    const [
      totalSales,
      customerCount,
      pendingInstallments,
      lowStockProducts,
      salesByMonth
    ] = await Promise.all([
      // Ventas del mes
      prisma.sale.aggregate({
        where: {
          date: {
            gte: startMonth,
            lte: endMonth,
          },
          status: "COMPLETADA",
        },
        _sum: {
          total: true,
        },
      }),
      // Cantidad de clientes
      prisma.customer.count(),
      // Saldo pendiente total
      prisma.amortizationSchedule.aggregate({
        where: {
          status: {
            in: ["PENDIENTE", "VENCIDA", "PARCIAL"],
          },
        },
        _sum: {
          total: true,
          paidAmount: true,
        },
      }),
      // Productos con stock bajo (ej. menos de 5)
      prisma.product.count({
        where: {
          stock: {
            lte: 5,
          },
          status: "ACTIVO",
        },
      }),
      // Datos para el gráfico (últimos 6 meses)
      prisma.sale.groupBy({
        by: ['date'],
        _sum: {
          total: true
        },
        orderBy: {
          date: 'asc'
        },
        take: 100 // Simplificado para demo
      })
    ]);

    const balanceTotal = (pendingInstallments._sum.total?.toNumber() || 0) - (pendingInstallments._sum.paidAmount?.toNumber() || 0);

    return {
      monthlySales: totalSales._sum.total?.toNumber() || 0,
      totalCustomers: customerCount,
      pendingBalance: balanceTotal,
      lowStockCount: lowStockProducts,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      monthlySales: 0,
      totalCustomers: 0,
      pendingBalance: 0,
      lowStockCount: 0,
    };
  }
}
