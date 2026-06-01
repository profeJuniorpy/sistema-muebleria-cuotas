"use server";

import prisma from "@/lib/prisma";

// ─── Sync sale statuses based on installment state ────────────────────────────

export async function syncCreditStatuses() {
  // Sales PENDIENTE with any VENCIDA installment → MORA
  const pendingWithMora = await prisma.sale.findMany({
    where: {
      type: "CREDITO",
      status: "PENDIENTE",
      creditPlan: { amortizationTable: { some: { status: "VENCIDA" } } },
    },
    select: { id: true },
  });
  if (pendingWithMora.length > 0) {
    await prisma.sale.updateMany({
      where: { id: { in: pendingWithMora.map((s) => s.id) } },
      data: { status: "MORA" },
    });
  }

  // Sales MORA with no more VENCIDA installments → back to PENDIENTE
  const moraWithoutVencida = await prisma.sale.findMany({
    where: {
      type: "CREDITO",
      status: "MORA",
      creditPlan: { amortizationTable: { none: { status: "VENCIDA" } } },
    },
    select: { id: true },
  });
  if (moraWithoutVencida.length > 0) {
    await prisma.sale.updateMany({
      where: { id: { in: moraWithoutVencida.map((s) => s.id) } },
      data: { status: "PENDIENTE" },
    });
  }
}

// ─── KPI stats ────────────────────────────────────────────────────────────────

export async function getCreditStats() {
  const [activeCount, moraCount, financedAgg, pendingRows] = await Promise.all([
    prisma.sale.count({
      where: { type: "CREDITO", status: { in: ["PENDIENTE", "MORA"] } },
    }),
    prisma.sale.count({
      where: { type: "CREDITO", status: "MORA" },
    }),
    prisma.creditPlan.aggregate({
      where: { sale: { type: "CREDITO", status: { in: ["PENDIENTE", "MORA"] } } },
      _sum: { financedAmount: true },
    }),
    prisma.amortizationSchedule.findMany({
      where: {
        status: { in: ["PENDIENTE", "VENCIDA", "PARCIAL"] },
        creditPlan: { sale: { type: "CREDITO" } },
      },
      select: { total: true, paidAmount: true },
    }),
  ]);

  const totalPendingBalance = pendingRows.reduce(
    (sum, i) => sum + Number(i.total) - Number(i.paidAmount),
    0
  );

  return {
    activeCount,
    moraCount,
    totalFinanced: Number(financedAgg._sum.financedAmount ?? 0),
    totalPendingBalance: Math.round(totalPendingBalance),
  };
}

// ─── Portfolio list ───────────────────────────────────────────────────────────

export async function getCreditsPortfolio(search?: string) {
  const sales = await prisma.sale.findMany({
    where: {
      type: "CREDITO",
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: "insensitive" } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      customer: {
        select: { id: true, name: true, riskLevel: true, mobile: true },
      },
      creditPlan: {
        include: {
          amortizationTable: {
            select: { status: true, total: true, paidAmount: true, dueDate: true },
            orderBy: { installmentNumber: "asc" },
          },
        },
      },
    },
    orderBy: { date: "desc" },
    take: 300,
  });

  return sales.map((sale) => {
    const plan = sale.creditPlan;
    const rows = plan?.amortizationTable ?? [];

    const paidCount = rows.filter((i) => i.status === "PAGADA").length;
    const overdueCount = rows.filter((i) => i.status === "VENCIDA").length;
    const pendingBalance = rows
      .filter((i) => i.status !== "PAGADA")
      .reduce((sum, i) => sum + Number(i.total) - Number(i.paidAmount), 0);

    const nextPending = rows.find(
      (i) => i.status === "VENCIDA" || i.status === "PARCIAL" || i.status === "PENDIENTE"
    );

    return {
      saleId: sale.id,
      saleNumber: sale.number,
      date: sale.date.toISOString(),
      saleStatus: sale.status as string,
      customerId: sale.customer.id,
      customerName: sale.customer.name,
      customerRisk: sale.customer.riskLevel as string,
      customerMobile: sale.customer.mobile,
      financedAmount: Number(plan?.financedAmount ?? 0),
      downPayment: Number(plan?.downPayment ?? 0),
      interestRate: Number(plan?.interestRate ?? 0),
      interestMode: (plan?.interestMode ?? "") as string,
      totalInstallments: plan?.installments ?? 0,
      frequency: (plan?.frequency ?? "") as string,
      installmentAmount: Number(plan?.installmentAmount ?? 0),
      paidInstallments: paidCount,
      overdueInstallments: overdueCount,
      pendingBalance: Math.round(pendingBalance),
      nextDueDate: nextPending ? new Date(nextPending.dueDate).toISOString() : null,
      nextDueAmount: nextPending
        ? Math.round(Number(nextPending.total) - Number(nextPending.paidAmount))
        : null,
    };
  });
}

// ─── Credit detail ────────────────────────────────────────────────────────────

export async function getCreditDetail(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      seller: { select: { name: true } },
      items: true,
      creditPlan: {
        include: {
          amortizationTable: { orderBy: { installmentNumber: "asc" } },
        },
      },
      payments: {
        include: { collector: { select: { name: true } } },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!sale || !sale.creditPlan) return null;

  const plan = sale.creditPlan;
  const rows = plan.amortizationTable;

  const paidCount = rows.filter((i) => i.status === "PAGADA").length;
  const overdueCount = rows.filter((i) => i.status === "VENCIDA").length;
  const pendingBalance = rows
    .filter((i) => i.status !== "PAGADA")
    .reduce((sum, i) => sum + Number(i.total) - Number(i.paidAmount), 0);
  const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    saleId: sale.id,
    saleNumber: sale.number,
    date: sale.date.toISOString(),
    saleStatus: sale.status as string,
    sellerName: sale.seller.name,
    notes: sale.notes,

    customer: {
      id: sale.customer.id,
      name: sale.customer.name,
      ruc: sale.customer.ruc,
      mobile: sale.customer.mobile,
      phone: sale.customer.phone,
      address: sale.customer.address,
      city: sale.customer.city,
      riskLevel: sale.customer.riskLevel as string,
      creditLimit: Number(sale.customer.creditLimit),
    },

    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    total: Number(sale.total),

    plan: {
      downPayment: Number(plan.downPayment),
      financedAmount: Number(plan.financedAmount),
      interestRate: Number(plan.interestRate),
      interestMode: plan.interestMode as string,
      totalInstallments: plan.installments,
      frequency: plan.frequency as string,
      installmentAmount: Number(plan.installmentAmount),
      firstDueDate: plan.firstDueDate.toISOString(),
      lateInterestRate: Number(plan.lateInterestRate),
    },

    paidInstallments: paidCount,
    overdueInstallments: overdueCount,
    pendingBalance: Math.round(pendingBalance),
    totalPaid: Math.round(totalPaid),

    amortizationTable: rows.map((i) => ({
      id: i.id,
      installmentNumber: i.installmentNumber,
      dueDate: i.dueDate.toISOString(),
      principal: Number(i.principal),
      interest: Number(i.interest),
      total: Number(i.total),
      balance: Number(i.balance),
      paidAmount: Number(i.paidAmount),
      status: i.status as string,
      paidAt: i.paidAt?.toISOString() ?? null,
    })),

    payments: sale.payments.map((p) => ({
      id: p.id,
      number: p.number,
      date: p.date.toISOString(),
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod as string,
      lateInterestApplied: Number(p.lateInterestApplied),
      notes: p.notes,
      collectorName: p.collector.name,
    })),
  };
}
