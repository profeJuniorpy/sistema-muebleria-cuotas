import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { AutoPrint } from "@/app/(print)/rpt/recibo/[id]/auto-print";
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

export default async function VentaTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const [sale, company] = await Promise.all([
    prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { name: true, ruc: true, mobile: true, phone: true } },
        seller: { select: { name: true } },
        items: true,
        payments: { orderBy: { date: "asc" } },
        creditPlan: true,
      },
    }),
    prisma.companyConfig.findFirst({ orderBy: { updatedAt: "desc" } }),
  ]);

  if (!sale) notFound();

  const saleDate = new Date(sale.date);
  const dateStr = format(saleDate, "dd/MM/yyyy", { locale: es });
  const timeStr = format(saleDate, "HH:mm", { locale: es });

  const firstPayment = sale.payments[0] ?? null;
  const plan = sale.creditPlan;

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
          COMPROBANTE DE VENTA
        </div>

        <Divider />

        <Line label="N°:" value={sale.number} />
        <Line label="Fecha:" value={dateStr} />
        <Line label="Hora:" value={timeStr} />
        <Line label="Vendedor:" value={sale.seller.name ?? "—"} />

        <Divider />

        {/* Cliente */}
        <div style={{ fontSize: "8pt", marginBottom: "2px", color: "#555" }}>CLIENTE</div>
        <div style={{ fontWeight: 600 }}>{sale.customer.name}</div>
        <div style={{ fontSize: "8pt" }}>CI/RUC: {sale.customer.ruc}</div>
        {(sale.customer.mobile ?? sale.customer.phone) && (
          <div style={{ fontSize: "8pt" }}>
            Tel: {sale.customer.mobile ?? sale.customer.phone}
          </div>
        )}

        <Divider />

        {/* Artículos */}
        <div style={{ fontSize: "8pt", marginBottom: "2px", color: "#555" }}>ARTÍCULOS</div>
        {sale.items.map((item) => (
          <div key={item.id} style={{ margin: "3px 0" }}>
            <div>{item.quantity} x {item.productName}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#555" }}>
              <span>{fmt(Number(item.unitPrice))} c/u</span>
              <span style={{ fontWeight: 600, color: "#000" }}>{fmt(Number(item.subtotal))} GS</span>
            </div>
          </div>
        ))}

        <Divider />

        <Line label="Subtotal:" value={`${fmt(Number(sale.subtotal))} GS`} />
        {Number(sale.discount) > 0 && (
          <Line label="Descuento:" value={`-${fmt(Number(sale.discount))} GS`} />
        )}

        <Divider char="=" />

        <div style={{ textAlign: "center", padding: "4px 0", fontWeight: 700, fontSize: "11pt" }}>
          <div style={{ fontSize: "8pt", fontWeight: 400 }}>TOTAL VENTA</div>
          {fmt(Number(sale.total))} GS
        </div>

        <Divider char="=" />

        {/* Forma de pago */}
        {sale.type === "CONTADO" ? (
          <>
            <Line label="FORMA DE PAGO:" value="CONTADO" />
            {firstPayment && (
              <Line label="Método:" value={METHOD_LABEL[firstPayment.paymentMethod] ?? firstPayment.paymentMethod} />
            )}
          </>
        ) : plan ? (
          <>
            <div style={{ fontSize: "8pt", marginBottom: "2px", color: "#555" }}>PLAN DE CRÉDITO</div>
            <Line label="Entrega inicial:" value={`${fmt(Number(plan.downPayment))} GS`} />
            <Line label="Monto financiado:" value={`${fmt(Number(plan.financedAmount))} GS`} />
            <Line label="Cuotas:" value={`${plan.installments} x ${fmt(Number(plan.installmentAmount))} GS`} />
            <Line label="1er vencimiento:" value={format(new Date(plan.firstDueDate), "dd/MM/yyyy", { locale: es })} />
          </>
        ) : null}

        <Divider />

        <div style={{ textAlign: "center", fontWeight: 700, margin: "4px 0" }}>
          ¡Gracias por su compra!
        </div>
        <div style={{ textAlign: "center", fontSize: "7pt", color: "#555", marginTop: "2px" }}>
          Documento generado por sistema ERP
        </div>
      </div>
    </>
  );
}
