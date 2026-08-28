import { notFound } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { AutoPrint } from "./auto-print";
import { PrintActions } from "@/app/(print)/components/print-actions";

export const dynamic = "force-dynamic";

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "EFECTIVO",
  TRANSFERENCIA: "TRANSFERENCIA",
  TARJETA: "TARJETA",
  CHEQUE: "CHEQUE",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY").format(Math.round(n));
}

function Line({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600, color: highlight ? "#b91c1c" : undefined }}>{value}</span>
    </div>
  );
}

function Divider({ char = "─" }: { char?: string }) {
  return (
    <div
      style={{ borderBottom: `1px ${char === "=" ? "solid" : "dashed"} #000`, margin: "5px 0" }}
    />
  );
}

export default async function ReceiptTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const [payment, company] = await Promise.all([
    prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { name: true, ruc: true, mobile: true, phone: true } },
        sale: {
          select: {
            number: true,
            type: true,
            items: { select: { productName: true, quantity: true } },
          },
        },
        collector: { select: { name: true } },
      },
    }),
    prisma.companyConfig.findFirst({ orderBy: { updatedAt: "desc" } }),
  ]);

  if (!payment) notFound();

  const paymentDate = new Date(payment.date);
  const dateStr = format(paymentDate, "dd/MM/yyyy", { locale: es });
  const timeStr = format(paymentDate, "HH:mm", { locale: es });
  const mora = Number(payment.lateInterestApplied);
  const amount = Number(payment.amount);

  // ── Cuotas pagadas en esta transacción ──────────────────────────────────────
  // La relación Payment → AmortizationSchedule no existe en el esquema.
  // Buscamos cuotas de la misma venta cuyo paidAt caiga dentro de una ventana
  // de ±60 s respecto a la fecha del pago (la transacción es atómica).
  const windowMs = 60_000;
  const windowStart = new Date(paymentDate.getTime() - windowMs);
  const windowEnd = new Date(paymentDate.getTime() + windowMs);

  const paidInstallments = await prisma.amortizationSchedule.findMany({
    where: {
      creditPlan: { saleId: payment.saleId },
      status: "PAGADA",
      paidAt: { gte: windowStart, lte: windowEnd },
    },
    orderBy: { installmentNumber: "asc" },
    select: {
      installmentNumber: true,
      dueDate: true,
      total: true,
      paidAt: true,
    },
  });

  // ── Saldo restante y cuotas pendientes después de este pago ─────────────────
  const [remainingRows, totalInstallments] = await Promise.all([
    prisma.amortizationSchedule.findMany({
      where: {
        creditPlan: { saleId: payment.saleId },
        status: { in: ["PENDIENTE", "VENCIDA", "PARCIAL"] },
      },
      select: { total: true, paidAmount: true },
    }),
    prisma.amortizationSchedule.count({
      where: { creditPlan: { saleId: payment.saleId } },
    }),
  ]);
  const remainingBalance = remainingRows.reduce(
    (sum, i) => sum + Number(i.total) - Number(i.paidAmount),
    0
  );
  const pendingCount = remainingRows.length;

  // ── Máximo atraso entre las cuotas pagadas ──────────────────────────────────
  let maxDaysLate = 0;
  for (const inst of paidInstallments) {
    if (inst.paidAt && inst.paidAt > inst.dueDate) {
      const days = differenceInDays(inst.paidAt, inst.dueDate);
      if (days > maxDaysLate) maxDaysLate = days;
    }
  }

  const cuotasLabel =
    paidInstallments.length > 0
      ? paidInstallments.map((i) => `#${i.installmentNumber}`).join(", ")
      : null;

  return (
    <>
      <AutoPrint />

      <style>{`
        @media print {
          @page { size: 58mm auto; margin: 3mm 2mm; }
          body { background: white !important; }
          .print-container {
            padding: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
            background: white !important;
            min-height: unset !important;
          }
          .ticket-wrap { border: none !important; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
        }
        @media screen {
          .ticket-wrap {
            width: 218px;
            margin: 24px auto;
            background: white;
            border: 1px dashed #aaa;
            padding: 10px;
          }
        }
      `}</style>

      <PrintActions />

      <div
        className="ticket-wrap"
        style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "9pt", lineHeight: 1.5, color: "#000" }}
      >
        {/* Encabezado empresa */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          {company?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt="Logo" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: "50%", margin: "0 auto 4px", display: "block", border: "1px solid #1a3a8c" }} />
          )}
          <div style={{ fontWeight: 700, fontSize: "11pt", textTransform: "uppercase", color: "#1a3a8c" }}>
            {company?.name ?? "MUEBLERÍA ERP"}
          </div>
          {company?.ruc && <div style={{ fontSize: "8pt" }}>RUC: {company.ruc}</div>}
          {company?.address && <div style={{ fontSize: "8pt" }}>{company.address}</div>}
          {company?.phone && <div style={{ fontSize: "8pt" }}>Tel: {company.phone}</div>}
        </div>

        <Divider char="=" />

        <div style={{ textAlign: "center", fontWeight: 700, fontSize: "10pt", margin: "4px 0" }}>
          RECIBO DE PAGO
        </div>

        <Divider />

        <Line label="N°:" value={payment.number} />
        <Line label="Fecha:" value={dateStr} />
        <Line label="Hora:" value={timeStr} />

        <Divider />

        {/* Cliente */}
        <div style={{ fontSize: "8pt", marginBottom: "2px", color: "#555" }}>CLIENTE</div>
        <div style={{ fontWeight: 600 }}>{payment.customer.name}</div>
        <div style={{ fontSize: "8pt" }}>CI/RUC: {payment.customer.ruc}</div>
        {(payment.customer.mobile ?? payment.customer.phone) && (
          <div style={{ fontSize: "8pt" }}>
            Tel: {payment.customer.mobile ?? payment.customer.phone}
          </div>
        )}

        <Divider />

        {/* Artículos / concepto */}
        {payment.sale.items.length > 0 && (
          <>
            <div style={{ fontSize: "8pt", marginBottom: "2px", color: "#555" }}>
              CONCEPTO / ARTÍCULOS
            </div>
            {payment.sale.items.map((item, idx) => (
              <div key={idx} style={{ fontSize: "8pt" }}>
                {item.quantity} x {item.productName}
              </div>
            ))}
            <Divider />
          </>
        )}

        {/* Venta */}
        <Line label="VENTA N°:" value={payment.sale.number} />
        <Line label="TIPO:" value={payment.sale.type} />

        {/* Cuotas pagadas / pendientes */}
        {cuotasLabel && (
          <Line label="CUOTA(S) PAGADA(S):" value={cuotasLabel} />
        )}
        {payment.sale.type === "CREDITO" && totalInstallments > 0 && (
          <Line
            label="CUOTAS PENDIENTES:"
            value={`${pendingCount} de ${totalInstallments}`}
          />
        )}

        <Divider />

        {/* Detalle del pago */}
        <div style={{ fontSize: "8pt", marginBottom: "2px", color: "#555" }}>DETALLE DE PAGO</div>
        <Line label="Método:" value={METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod} />
        {payment.notes && (
          <div style={{ fontSize: "8pt", marginBottom: "2px" }}>Obs: {payment.notes}</div>
        )}

        <Divider char="=" />

        {/* Montos */}
        <Line label="COBRADO:" value={`${fmt(amount)} GS`} />

        {mora > 0 && (
          <>
            <Line label="MORA APLICADA:" value={`${fmt(mora)} GS`} highlight />
            {maxDaysLate > 0 && (
              <Line label="DÍAS DE ATRASO:" value={`${maxDaysLate} días`} highlight />
            )}
          </>
        )}

        <Divider char="=" />

        {/* Total cobrado */}
        <div style={{ textAlign: "center", padding: "4px 0", fontWeight: 700, fontSize: "11pt" }}>
          <div style={{ fontSize: "8pt", fontWeight: 400 }}>TOTAL COBRADO</div>
          {fmt(amount)} GS
        </div>

        <Divider char="=" />

        {/* Saldo restante */}
        {payment.sale.type === "CREDITO" && (
          <>
            <div
              style={{
                textAlign: "center",
                padding: "3px 0",
                fontSize: "8pt",
              }}
            >
              <div style={{ color: "#555" }}>SALDO PENDIENTE</div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "10pt",
                  color: remainingBalance > 0 ? "#b45309" : "#15803d",
                }}
              >
                {remainingBalance > 0 ? `${fmt(remainingBalance)} GS` : "DEUDA CANCELADA"}
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Cobrador */}
        <div style={{ textAlign: "center", fontSize: "8pt", margin: "4px 0" }}>
          Cobrado por: <strong>{payment.collector.name ?? "—"}</strong>
        </div>

        <Divider />

        <div style={{ textAlign: "center", fontWeight: 700, margin: "4px 0" }}>
          ¡Gracias por su pago!
        </div>
        <div style={{ textAlign: "center", fontSize: "7pt", color: "#555", marginTop: "2px" }}>
          Documento generado por sistema ERP
        </div>
      </div>
    </>
  );
}
