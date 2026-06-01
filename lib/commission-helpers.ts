import { Prisma } from "@prisma/client";
import { Decimal } from "decimal.js";

type TransactionClient = Prisma.TransactionClient;

// ─── Obtiene la tasa efectiva para un vendedor ────────────────────────────────

async function getEffectiveRate(
  tx: TransactionClient,
  sellerId: string,
  saleType: "CONTADO" | "CREDITO"
): Promise<{ rate: number; trigger: string } | null> {
  const [settings, user, userOverride] = await Promise.all([
    tx.commissionSettings.findFirst(),
    tx.user.findUnique({
      where: { id: sellerId },
      select: { commissionRate: true },
    }),
    tx.commissionOverride.findFirst({
      where: { userId: sellerId, category: null },
    }),
  ]);

  if (!settings) return null;

  let rate = 0;

  if (userOverride && Number(userOverride.rate) > 0) {
    rate = Number(userOverride.rate);
  } else if (user && user.commissionRate > 0) {
    rate = user.commissionRate;
  } else {
    rate =
      saleType === "CONTADO"
        ? Number(settings.cashSaleRate)
        : Number(settings.creditSaleRate);
  }

  return { rate, trigger: settings.trigger };
}

// ─── AL_VENDER: se llama al crear una venta ───────────────────────────────────

export async function generateSaleCommission(
  tx: TransactionClient,
  params: {
    saleId: string;
    sellerId: string;
    saleType: "CONTADO" | "CREDITO";
    baseAmount: number;
  }
) {
  const config = await getEffectiveRate(tx, params.sellerId, params.saleType);
  if (!config || config.trigger !== "AL_VENDER" || config.rate === 0) return;

  const existing = await tx.commission.findFirst({
    where: { saleId: params.saleId, triggerType: "AL_VENDER" },
  });
  if (existing) return;

  const amount = new Decimal(params.baseAmount)
    .times(config.rate)
    .dividedBy(100)
    .toDecimalPlaces(0);
  if (amount.lte(0)) return;

  await tx.commission.create({
    data: {
      saleId: params.saleId,
      userId: params.sellerId,
      amount: amount.toNumber(),
      rate: config.rate,
      triggerType: "AL_VENDER",
      status: "PENDIENTE",
    },
  });
}

// ─── AL_COBRAR_CUOTA: se llama al marcar una cuota como PAGADA ────────────────

export async function generateInstallmentCommission(
  tx: TransactionClient,
  params: {
    saleId: string;
    sellerId: string;
    installmentId: string;
    installmentTotal: number;
  }
) {
  const config = await getEffectiveRate(tx, params.sellerId, "CREDITO");
  if (!config || config.trigger !== "AL_COBRAR_CUOTA" || config.rate === 0) return;

  const existing = await tx.commission.findFirst({
    where: { installmentId: params.installmentId },
  });
  if (existing) return;

  const amount = new Decimal(params.installmentTotal)
    .times(config.rate)
    .dividedBy(100)
    .toDecimalPlaces(0);
  if (amount.lte(0)) return;

  await tx.commission.create({
    data: {
      saleId: params.saleId,
      installmentId: params.installmentId,
      userId: params.sellerId,
      amount: amount.toNumber(),
      rate: config.rate,
      triggerType: "AL_COBRAR_CUOTA",
      status: "PENDIENTE",
    },
  });
}

// ─── AL_COMPLETAR: se llama cuando la venta queda totalmente pagada ───────────

export async function generateCompletionCommission(
  tx: TransactionClient,
  params: {
    saleId: string;
    sellerId: string;
    saleTotal: number;
  }
) {
  const config = await getEffectiveRate(tx, params.sellerId, "CREDITO");
  if (!config || config.trigger !== "AL_COMPLETAR" || config.rate === 0) return;

  const existing = await tx.commission.findFirst({
    where: { saleId: params.saleId, triggerType: "AL_COMPLETAR" },
  });
  if (existing) return;

  const amount = new Decimal(params.saleTotal)
    .times(config.rate)
    .dividedBy(100)
    .toDecimalPlaces(0);
  if (amount.lte(0)) return;

  await tx.commission.create({
    data: {
      saleId: params.saleId,
      userId: params.sellerId,
      amount: amount.toNumber(),
      rate: config.rate,
      triggerType: "AL_COMPLETAR",
      status: "PENDIENTE",
    },
  });
}
