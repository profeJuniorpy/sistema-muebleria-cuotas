"use server";

import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay, subHours } from "date-fns";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { updateOverdueInstallments } from "@/lib/actions/payments";

const fmt = (n: number) => new Intl.NumberFormat("es-PY").format(Math.round(n));

// ─── Queries ──────────────────────────────────────────────────────────────────

async function getInstallmentsDueToday() {
  const now = new Date();
  return prisma.amortizationSchedule.findMany({
    where: {
      dueDate: { gte: startOfDay(now), lte: endOfDay(now) },
      status: { in: ["PENDIENTE", "PARCIAL"] },
    },
    include: {
      creditPlan: {
        include: {
          sale: {
            select: {
              number: true,
              customer: {
                select: { id: true, name: true, mobile: true, callmebotKey: true },
              },
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });
}

async function getOverdueInstallments() {
  return prisma.amortizationSchedule.findMany({
    where: { status: "VENCIDA" },
    include: {
      creditPlan: {
        include: {
          sale: {
            select: {
              number: true,
              customer: {
                select: { id: true, name: true, mobile: true, callmebotKey: true },
              },
            },
          },
        },
      },
    },
  });
}

// ─── Message builders ─────────────────────────────────────────────────────────

function buildDueTodayMessage(
  customerName: string,
  installmentNumber: number,
  saleNumber: string,
  total: number,
  paidAmount: number,
  dueDate: Date
): string {
  const balance = total - paidAmount;
  const dateStr = dueDate.toLocaleDateString("es-PY");
  return (
    `*¡Hola, ${customerName}!* 👋\n\n` +
    `📅 Tu cuota N° ${installmentNumber} de la compra *${saleNumber}* vence *hoy ${dateStr}*.\n` +
    `💰 Monto a pagar: *Gs. ${fmt(balance)}*\n\n` +
    `📍 Podés acercarte a nuestra tienda o escribirnos para coordinar el pago.\n` +
    `¡Gracias por tu confianza! 🙏`
  );
}

function buildOverdueMessage(
  customerName: string,
  count: number,
  total: number
): string {
  return (
    `*Hola, ${customerName}.* ⚠️\n\n` +
    `Tenés *${count} cuota${count > 1 ? "s" : ""} vencida${count > 1 ? "s" : ""}* ` +
    `por un total de *Gs. ${fmt(total)}*.\n\n` +
    `Por favor comunicate con nosotros a la brevedad para regularizar tu situación y evitar recargos.\n` +
    `¡Quedamos a tu disposición! 📞`
  );
}

// ─── Dedup check ──────────────────────────────────────────────────────────────

async function alreadySentRecently(
  customerId: string,
  installmentId: string | null
): Promise<boolean> {
  const since = subHours(new Date(), 22);
  const existing = await prisma.notificationLog.findFirst({
    where: {
      customerId,
      ...(installmentId ? { installmentId } : {}),
      status: "ENVIADO",
      sentAt: { gte: since },
    },
  });
  return !!existing;
}

// ─── Main runner ──────────────────────────────────────────────────────────────

export type NotifStats = {
  sent: number;
  failed: number;
  skipped: number;
  noContact: number;
  total: number;
};

export async function runNotifications(): Promise<NotifStats> {
  // Sincronizar estados de mora antes de consultar
  await updateOverdueInstallments();

  const stats: NotifStats = { sent: 0, failed: 0, skipped: 0, noContact: 0, total: 0 };

  // ── 1. Cuotas que vencen HOY ──────────────────────────────────────────────
  const dueToday = await getInstallmentsDueToday();

  for (const inst of dueToday) {
    stats.total++;
    const customer = inst.creditPlan.sale.customer;
    const phone = customer.mobile;
    const apiKey = customer.callmebotKey;

    if (!phone || !apiKey) {
      await prisma.notificationLog.create({
        data: {
          customerId: customer.id,
          installmentId: inst.id,
          phone: phone ?? "SIN_NUMERO",
          message: "",
          status: "SIN_NUMERO",
        },
      });
      stats.noContact++;
      continue;
    }

    if (await alreadySentRecently(customer.id, inst.id)) {
      stats.skipped++;
      continue;
    }

    const message = buildDueTodayMessage(
      customer.name,
      inst.installmentNumber,
      inst.creditPlan.sale.number,
      Number(inst.total),
      Number(inst.paidAmount),
      inst.dueDate
    );

    const result = await sendWhatsAppMessage(phone, apiKey, message);
    const now = new Date();

    await prisma.notificationLog.create({
      data: {
        customerId: customer.id,
        installmentId: inst.id,
        phone,
        message,
        status: result.success ? "ENVIADO" : "FALLIDO",
        errorMessage: result.error ?? null,
        sentAt: result.success ? now : null,
      },
    });

    result.success ? stats.sent++ : stats.failed++;
  }

  // ── 2. Cuotas VENCIDAS — agrupar por cliente ──────────────────────────────
  const overdueRows = await getOverdueInstallments();

  type OverdueGroup = {
    customer: { id: string; name: string; mobile: string | null; callmebotKey: string | null };
    count: number;
    total: number;
  };

  const byCustomer = new Map<string, OverdueGroup>();
  for (const inst of overdueRows) {
    const c = inst.creditPlan.sale.customer;
    const balance = Number(inst.total) - Number(inst.paidAmount);
    const existing = byCustomer.get(c.id);
    if (existing) {
      existing.count++;
      existing.total += balance;
    } else {
      byCustomer.set(c.id, { customer: c, count: 1, total: balance });
    }
  }

  for (const { customer, count, total } of Array.from(byCustomer.values())) {
    stats.total++;
    const phone = customer.mobile;
    const apiKey = customer.callmebotKey;

    if (!phone || !apiKey) {
      await prisma.notificationLog.create({
        data: {
          customerId: customer.id,
          phone: phone ?? "SIN_NUMERO",
          message: "",
          status: "SIN_NUMERO",
        },
      });
      stats.noContact++;
      continue;
    }

    // Dedup: no renviar aviso de mora si ya se envió hoy
    if (await alreadySentRecently(customer.id, null)) {
      stats.skipped++;
      continue;
    }

    const message = buildOverdueMessage(customer.name, count, total);
    const result = await sendWhatsAppMessage(phone, apiKey, message);
    const now = new Date();

    await prisma.notificationLog.create({
      data: {
        customerId: customer.id,
        phone,
        message,
        status: result.success ? "ENVIADO" : "FALLIDO",
        errorMessage: result.error ?? null,
        sentAt: result.success ? now : null,
      },
    });

    result.success ? stats.sent++ : stats.failed++;
  }

  revalidatePath("/notificaciones");
  return stats;
}

// ─── Get logs ─────────────────────────────────────────────────────────────────

export async function getNotificationLogs(limit = 100) {
  const rows = await prisma.notificationLog.findMany({
    include: { customer: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    customerId: r.customerId,
    customerName: r.customer.name,
    customerCode: r.customer.code,
    phone: r.phone,
    message: r.message,
    status: r.status as string,
    errorMessage: r.errorMessage,
    sentAt: r.sentAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    installmentId: r.installmentId,
  }));
}

export async function getNotifStats() {
  const today = startOfDay(new Date());
  const [todayLogs, totalLogs] = await Promise.all([
    prisma.notificationLog.groupBy({
      by: ["status"],
      where: { createdAt: { gte: today } },
      _count: { id: true },
    }),
    prisma.notificationLog.count(),
  ]);

  const byStatus = Object.fromEntries(
    todayLogs.map((r) => [r.status, r._count.id])
  );

  return {
    todaySent: byStatus["ENVIADO"] ?? 0,
    todayFailed: byStatus["FALLIDO"] ?? 0,
    todayNoContact: byStatus["SIN_NUMERO"] ?? 0,
    totalLogs,
  };
}
