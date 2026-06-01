"use server";

import prisma from "@/lib/prisma";
import { differenceInDays } from "date-fns";

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ─── Reporte de Ventas ────────────────────────────────────────────────────────

export async function getSalesReport(from: Date, to: Date) {
  const sales = await prisma.sale.findMany({
    where: {
      date: { gte: from, lte: endOfDay(to) },
      status: { not: "CANCELADA" },
    },
    include: {
      customer: { select: { name: true } },
      seller: { select: { name: true } },
      items: { include: { product: { select: { category: true } } } },
    },
    orderBy: { date: "asc" },
  });

  // Agrupado por día
  const byDayMap: Record<string, { total: number; count: number }> = {};
  for (const s of sales) {
    const day = s.date.toISOString().split("T")[0];
    if (!byDayMap[day]) byDayMap[day] = { total: 0, count: 0 };
    byDayMap[day].total += Number(s.total);
    byDayMap[day].count++;
  }
  const byDay = Object.entries(byDayMap)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Agrupado por canal
  const byChannelMap: Record<string, { count: number; amount: number }> = {};
  for (const s of sales) {
    if (!byChannelMap[s.channel]) byChannelMap[s.channel] = { count: 0, amount: 0 };
    byChannelMap[s.channel].count++;
    byChannelMap[s.channel].amount += Number(s.total);
  }
  const byChannel = Object.entries(byChannelMap).map(([channel, v]) => ({
    channel,
    ...v,
  }));

  // Agrupado por categoría de producto
  const byCategoryMap: Record<string, { count: number; amount: number }> = {};
  for (const s of sales) {
    for (const item of s.items) {
      const cat = (item.product?.category ?? "OTROS") as string;
      if (!byCategoryMap[cat]) byCategoryMap[cat] = { count: 0, amount: 0 };
      byCategoryMap[cat].count += item.quantity;
      byCategoryMap[cat].amount += Number(item.subtotal);
    }
  }
  const byCategory = Object.entries(byCategoryMap)
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.amount - a.amount);

  const contado = sales.filter((s) => s.type === "CONTADO");
  const credito = sales.filter((s) => s.type === "CREDITO");
  const totalAmount = sales.reduce((s, v) => s + Number(v.total), 0);

  const topSales = [...sales]
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 15)
    .map((s) => ({
      number: s.number,
      date: s.date.toISOString(),
      customer: s.customer.name,
      seller: s.seller.name ?? "—",
      type: s.type as string,
      status: s.status as string,
      total: Number(s.total),
    }));

  return {
    totalSales: sales.length,
    totalAmount: Math.round(totalAmount),
    avgTicket: sales.length > 0 ? Math.round(totalAmount / sales.length) : 0,
    contadoCount: contado.length,
    contadoAmount: Math.round(contado.reduce((s, v) => s + Number(v.total), 0)),
    creditoCount: credito.length,
    creditoAmount: Math.round(credito.reduce((s, v) => s + Number(v.total), 0)),
    byDay,
    byChannel,
    byCategory,
    topSales,
  };
}

// ─── Reporte de Cobranzas ─────────────────────────────────────────────────────

export async function getCollectionsReport(from: Date, to: Date) {
  const payments = await prisma.payment.findMany({
    where: { date: { gte: from, lte: endOfDay(to) } },
    include: {
      customer: { select: { name: true } },
      sale: { select: { number: true } },
      collector: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  // Por día
  const byDayMap: Record<string, { amount: number; count: number }> = {};
  for (const p of payments) {
    const day = p.date.toISOString().split("T")[0];
    if (!byDayMap[day]) byDayMap[day] = { amount: 0, count: 0 };
    byDayMap[day].amount += Number(p.amount);
    byDayMap[day].count++;
  }
  const byDay = Object.entries(byDayMap)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Por método de pago
  const byMethodMap: Record<string, { amount: number; count: number }> = {};
  for (const p of payments) {
    const m = p.paymentMethod as string;
    if (!byMethodMap[m]) byMethodMap[m] = { amount: 0, count: 0 };
    byMethodMap[m].amount += Number(p.amount);
    byMethodMap[m].count++;
  }
  const byMethod = Object.entries(byMethodMap)
    .map(([method, v]) => ({ method, ...v }))
    .sort((a, b) => b.amount - a.amount);

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalMora = payments.reduce((s, p) => s + Number(p.lateInterestApplied), 0);

  return {
    totalCollected: Math.round(totalCollected),
    totalMora: Math.round(totalMora),
    paymentCount: payments.length,
    byDay,
    byMethod,
    recentPayments: [...payments].reverse().slice(0, 50).map((p) => ({
      id: p.id,
      number: p.number,
      date: p.date.toISOString(),
      customer: p.customer.name,
      saleNumber: p.sale.number,
      method: p.paymentMethod as string,
      amount: Number(p.amount),
      mora: Number(p.lateInterestApplied),
      collector: p.collector.name ?? "—",
    })),
  };
}

// ─── Reporte de Morosidad ─────────────────────────────────────────────────────

export async function getDelinquencyReport() {
  const now = new Date();

  const overdueRows = await prisma.amortizationSchedule.findMany({
    where: { status: "VENCIDA" },
    include: {
      creditPlan: {
        include: {
          sale: {
            include: {
              customer: {
                select: {
                  id: true, name: true, ruc: true,
                  mobile: true, phone: true, city: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const byCustomer: Record<
    string,
    {
      customerId: string;
      name: string;
      ruc: string;
      mobile: string | null;
      phone: string | null;
      city: string | null;
      overdueBalance: number;
      estimatedMora: number;
      maxDaysLate: number;
      installmentCount: number;
      salesMap: Record<string, { number: string; balance: number; count: number }>;
    }
  > = {};

  for (const inst of overdueRows) {
    const customer = inst.creditPlan.sale.customer;
    const balance = Number(inst.total) - Number(inst.paidAmount);
    const daysLate = Math.max(0, differenceInDays(now, inst.dueDate));
    const rate = Number(inst.creditPlan.lateInterestRate);
    const mora = balance * (rate / 100) * (daysLate / 30);

    if (!byCustomer[customer.id]) {
      byCustomer[customer.id] = {
        customerId: customer.id,
        name: customer.name,
        ruc: customer.ruc,
        mobile: customer.mobile,
        phone: customer.phone,
        city: customer.city,
        overdueBalance: 0,
        estimatedMora: 0,
        maxDaysLate: 0,
        installmentCount: 0,
        salesMap: {},
      };
    }

    const c = byCustomer[customer.id];
    c.overdueBalance += balance;
    c.estimatedMora += mora;
    c.maxDaysLate = Math.max(c.maxDaysLate, daysLate);
    c.installmentCount++;

    const saleNum = inst.creditPlan.sale.number;
    if (!c.salesMap[saleNum]) c.salesMap[saleNum] = { number: saleNum, balance: 0, count: 0 };
    c.salesMap[saleNum].balance += balance;
    c.salesMap[saleNum].count++;
  }

  const customers = Object.values(byCustomer)
    .map((c) => ({
      customerId: c.customerId,
      name: c.name,
      ruc: c.ruc,
      mobile: c.mobile,
      phone: c.phone,
      city: c.city,
      overdueBalance: Math.round(c.overdueBalance),
      estimatedMora: Math.round(c.estimatedMora),
      maxDaysLate: c.maxDaysLate,
      installmentCount: c.installmentCount,
      sales: Object.values(c.salesMap).map((s) => ({
        number: s.number,
        balance: Math.round(s.balance),
        count: s.count,
      })),
    }))
    .sort((a, b) => b.overdueBalance - a.overdueBalance);

  const totalOverdue = customers.reduce((s, c) => s + c.overdueBalance, 0);
  const totalEstimatedMora = customers.reduce((s, c) => s + c.estimatedMora, 0);
  const avgDaysLate =
    customers.length > 0
      ? Math.round(customers.reduce((s, c) => s + c.maxDaysLate, 0) / customers.length)
      : 0;

  return {
    totalOverdue,
    totalEstimatedMora,
    customerCount: customers.length,
    avgDaysLate,
    customers,
  };
}

// ─── Reporte de Ganancias ─────────────────────────────────────────────────────

export async function getProfitReport(from: Date, to: Date) {
  const now = new Date();

  // ── Sales in period with item costs ──
  const sales = await prisma.sale.findMany({
    where: {
      date: { gte: from, lte: endOfDay(to) },
      status: { not: "CANCELADA" },
    },
    include: {
      items: {
        include: { product: { select: { costPrice: true, category: true } } },
      },
    },
    orderBy: { date: "asc" },
  });

  // ── Per-sale revenue, cost, profit ──
  function saleFinancials(s: (typeof sales)[number]) {
    const revenue = Number(s.total);
    const cost = s.items.reduce(
      (sum, i) => sum + Number(i.product?.costPrice ?? 0) * i.quantity,
      0
    );
    return { revenue, cost, profit: revenue - cost };
  }

  const periodRevenue = sales.reduce((s, v) => s + saleFinancials(v).revenue, 0);
  const periodCost = sales.reduce((s, v) => s + saleFinancials(v).cost, 0);
  const periodProfit = periodRevenue - periodCost;
  const margin =
    periodRevenue > 0 ? Math.round((periodProfit / periodRevenue) * 100 * 10) / 10 : 0;

  // ── Daily breakdown within period ──
  const byDayMap: Record<string, { revenue: number; cost: number; profit: number }> = {};
  for (const s of sales) {
    const day = s.date.toISOString().split("T")[0];
    const { revenue, cost, profit } = saleFinancials(s);
    if (!byDayMap[day]) byDayMap[day] = { revenue: 0, cost: 0, profit: 0 };
    byDayMap[day].revenue += revenue;
    byDayMap[day].cost += cost;
    byDayMap[day].profit += profit;
  }
  const byDay = Object.entries(byDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue),
      cost: Math.round(v.cost),
      profit: Math.round(v.profit),
    }));

  // ── By category ──
  const byCatMap: Record<string, { revenue: number; cost: number }> = {};
  for (const s of sales) {
    for (const i of s.items) {
      const cat = (i.product?.category ?? "OTROS") as string;
      if (!byCatMap[cat]) byCatMap[cat] = { revenue: 0, cost: 0 };
      byCatMap[cat].revenue += Number(i.subtotal);
      byCatMap[cat].cost += Number(i.product?.costPrice ?? 0) * i.quantity;
    }
  }
  const byCategory = Object.entries(byCatMap)
    .map(([category, v]) => ({
      category,
      revenue: Math.round(v.revenue),
      cost: Math.round(v.cost),
      profit: Math.round(v.revenue - v.cost),
      margin:
        v.revenue > 0
          ? Math.round(((v.revenue - v.cost) / v.revenue) * 100 * 10) / 10
          : 0,
    }))
    .sort((a, b) => b.profit - a.profit);

  // ── Monthly: last 12 months ──
  const monthly: { month: string; revenue: number; cost: number; profit: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mFrom = new Date(d.getFullYear(), d.getMonth(), 1);
    const mTo = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    monthly.push({ month: label, revenue: 0, cost: 0, profit: 0 });
    const idx = monthly.length - 1;

    const rows = await prisma.saleItem.findMany({
      where: {
        sale: {
          date: { gte: mFrom, lte: mTo },
          status: { not: "CANCELADA" },
        },
      },
      include: { product: { select: { costPrice: true } } },
    });
    for (const r of rows) {
      const rev = Number(r.subtotal);
      const cost = Number(r.product?.costPrice ?? 0) * r.quantity;
      monthly[idx].revenue += rev;
      monthly[idx].cost += cost;
      monthly[idx].profit += rev - cost;
    }
    monthly[idx].revenue = Math.round(monthly[idx].revenue);
    monthly[idx].cost = Math.round(monthly[idx].cost);
    monthly[idx].profit = Math.round(monthly[idx].profit);
  }

  const byMonth = monthly;
  const bySemester = monthly.slice(-6);

  // ── Annual: last 5 years ──
  const byYear: { year: string; revenue: number; cost: number; profit: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const yr = now.getFullYear() - i;
    const yFrom = new Date(yr, 0, 1);
    const yTo = new Date(yr, 11, 31, 23, 59, 59);
    const rows = await prisma.saleItem.findMany({
      where: {
        sale: {
          date: { gte: yFrom, lte: yTo },
          status: { not: "CANCELADA" },
        },
      },
      include: { product: { select: { costPrice: true } } },
    });
    let rev = 0, cost = 0;
    for (const r of rows) {
      rev += Number(r.subtotal);
      cost += Number(r.product?.costPrice ?? 0) * r.quantity;
    }
    byYear.push({
      year: String(yr),
      revenue: Math.round(rev),
      cost: Math.round(cost),
      profit: Math.round(rev - cost),
    });
  }

  // ── Inventory value ──
  const products = await prisma.product.findMany({
    where: { status: "ACTIVO" },
    select: { stock: true, costPrice: true, cashPrice: true },
  });
  const costValue = products.reduce(
    (s, p) => s + Number(p.costPrice) * p.stock,
    0
  );
  const saleValue = products.reduce(
    (s, p) => s + Number(p.cashPrice) * p.stock,
    0
  );

  return {
    // Period KPIs
    periodRevenue: Math.round(periodRevenue),
    periodCost: Math.round(periodCost),
    periodProfit: Math.round(periodProfit),
    margin,
    salesCount: sales.length,

    // Breakdowns
    byDay,
    byCategory,
    byMonth,
    bySemester,
    byYear,

    // Inventory
    inventoryValue: {
      totalProducts: products.length,
      costValue: Math.round(costValue),
      saleValue: Math.round(saleValue),
      potentialProfit: Math.round(saleValue - costValue),
    },
  };
}

// ─── Reporte de Inventario ────────────────────────────────────────────────────

export async function getInventoryReport(from: Date, to: Date) {
  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { status: { not: "DESCONTINUADO" } },
      select: {
        id: true, code: true, name: true,
        category: true, stock: true, minStock: true, status: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      where: { createdAt: { gte: from, lte: endOfDay(to) } },
      select: { productId: true, type: true, quantity: true },
    }),
  ]);

  const movByProduct: Record<string, { entries: number; exits: number }> = {};
  for (const m of movements) {
    if (!movByProduct[m.productId]) movByProduct[m.productId] = { entries: 0, exits: 0 };
    if (m.type === "ENTRADA") movByProduct[m.productId].entries += m.quantity;
    else if (m.type === "SALIDA") movByProduct[m.productId].exits += m.quantity;
  }

  const byProduct = products.map((p) => {
    const mov = movByProduct[p.id] ?? { entries: 0, exits: 0 };
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category as string,
      currentStock: p.stock,
      minStock: p.minStock,
      status: p.status as string,
      entries: mov.entries,
      exits: mov.exits,
      isLow: p.stock <= p.minStock && p.status === "ACTIVO",
    };
  });

  // Bajo stock primero, luego por mayor rotación
  byProduct.sort((a, b) => {
    if (a.isLow !== b.isLow) return a.isLow ? -1 : 1;
    return b.exits - a.exits;
  });

  const totalEntries = Object.values(movByProduct).reduce((s, m) => s + m.entries, 0);
  const totalExits = Object.values(movByProduct).reduce((s, m) => s + m.exits, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock && p.status === "ACTIVO").length;

  return {
    totalMovements: movements.length,
    totalEntries,
    totalExits,
    lowStockCount,
    byProduct,
  };
}
