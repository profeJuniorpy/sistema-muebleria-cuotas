import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { AutoPrint } from "@/app/(print)/rpt/recibo/[id]/auto-print";
import { PrintActions } from "@/app/(print)/components/print-actions";

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "EFECTIVO",
  TRANSFERENCIA: "TRANSFERENCIA",
  TARJETA: "TARJETA",
  CHEQUE: "CHEQUE",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY").format(Math.round(n));
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function Divider({ char = "─" }: { char?: string }) {
  return (
    <div
      style={{
        borderBottom: `1px ${char === "=" ? "solid" : "dashed"} #000`,
        margin: "5px 0",
      }}
    />
  );
}

export default async function ReciboProveedorPage({
  params,
}: {
  params: { id: string };
}) {
  const [payment, company] = await Promise.all([
    prisma.supplierPayment.findUnique({
      where: { id: params.id },
      include: {
        supplier: { select: { name: true, ruc: true, phone: true } },
        purchase: { select: { number: true, type: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.companyConfig.findFirst(),
  ]);

  if (!payment) notFound();

  const paymentDate = new Date(payment.date);
  const dateStr = format(paymentDate, "dd/MM/yyyy", { locale: es });
  const timeStr = format(paymentDate, "HH:mm", { locale: es });
  const amount = Number(payment.amount);

  return (
    <>
      <AutoPrint />

      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 3mm 2mm;
          }
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

      {/* Ticket */}
      <div
        className="ticket-wrap"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "9pt",
          lineHeight: 1.5,
          color: "#000",
        }}
      >
        {/* Encabezado empresa */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontWeight: 700, fontSize: "11pt", textTransform: "uppercase" }}>
            {company?.name ?? "MUEBLERÍA ERP"}
          </div>
          {company?.ruc && <div style={{ fontSize: "8pt" }}>RUC: {company.ruc}</div>}
          {company?.address && <div style={{ fontSize: "8pt" }}>{company.address}</div>}
          {company?.phone && <div style={{ fontSize: "8pt" }}>Tel: {company.phone}</div>}
        </div>

        <Divider char="=" />

        <div style={{ textAlign: "center", fontWeight: 700, fontSize: "10pt", margin: "4px 0" }}>
          COMPROBANTE DE PAGO
        </div>
        <div style={{ textAlign: "center", fontSize: "8pt", color: "#555", marginBottom: "4px" }}>
          PAGO A PROVEEDOR
        </div>

        <Divider />

        <Line label="N°:" value={payment.number} />
        <Line label="Fecha:" value={dateStr} />
        <Line label="Hora:" value={timeStr} />

        <Divider />

        <div style={{ fontSize: "8pt", marginBottom: "2px", color: "#555" }}>PROVEEDOR</div>
        <div style={{ fontWeight: 600 }}>{payment.supplier.name}</div>
        {payment.supplier.ruc && (
          <div style={{ fontSize: "8pt" }}>RUC: {payment.supplier.ruc}</div>
        )}
        {payment.supplier.phone && (
          <div style={{ fontSize: "8pt" }}>Tel: {payment.supplier.phone}</div>
        )}

        <Divider />

        <Line label="COMPRA N°:" value={payment.purchase.number} />
        <Line label="TIPO:" value={payment.purchase.type} />

        <Divider />

        <div style={{ fontSize: "8pt", marginBottom: "2px", color: "#555" }}>DETALLE PAGO</div>
        <Line
          label="Método:"
          value={METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod}
        />
        {payment.notes && (
          <div style={{ fontSize: "8pt", marginBottom: "2px" }}>Obs: {payment.notes}</div>
        )}

        <Divider char="=" />

        <div
          style={{
            textAlign: "center",
            padding: "4px 0",
            fontWeight: 700,
            fontSize: "11pt",
          }}
        >
          <div style={{ fontSize: "8pt", fontWeight: 400 }}>TOTAL PAGADO</div>
          {fmt(amount)} GS
        </div>

        <Divider char="=" />

        <div style={{ textAlign: "center", fontSize: "8pt", margin: "4px 0" }}>
          Registrado por: <strong>{payment.user?.name ?? "—"}</strong>
        </div>

        <Divider />

        <div style={{ textAlign: "center", fontWeight: 700, margin: "4px 0" }}>
          Comprobante de Pago
        </div>
        <div style={{ textAlign: "center", fontSize: "7pt", color: "#555", marginTop: "2px" }}>
          Documento generado por sistema ERP
        </div>
      </div>
    </>
  );
}
