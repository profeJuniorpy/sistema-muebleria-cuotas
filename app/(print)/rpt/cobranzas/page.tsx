import prisma from "@/lib/prisma";
import { getCollectionsReport } from "@/lib/actions/reports";
import { getPeriodDates } from "@/lib/period-utils";
import { PrintActions } from "../../components/print-actions";
import { PrintHeader, PrintFooter } from "../../components/print-header";

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  CHEQUE: "Cheque",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY").format(n);
}

export default async function PrintCobranzasPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period = searchParams.period ?? "thisMonth";
  const { from, to, label } = getPeriodDates(period);

  const [report, company] = await Promise.all([
    getCollectionsReport(from, to),
    prisma.companyConfig.findFirst(),
  ]);

  const thStyle = {
    background: "#f3f4f6",
    fontWeight: 600 as const,
    fontSize: "11px",
    padding: "6px 10px",
    textAlign: "left" as const,
    border: "1px solid #d1d5db",
  };
  const tdStyle = { fontSize: "11px", padding: "5px 10px", border: "1px solid #e5e7eb" };
  const tdRight = { ...tdStyle, textAlign: "right" as const };

  return (
    <>
      <PrintActions />
      <PrintHeader
        company={company}
        title="Reporte de Cobranzas"
        period={label}
        subtitle={`${from.toLocaleDateString("es-PY")} al ${to.toLocaleDateString("es-PY")}`}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Cobrado", value: `${fmt(report.totalCollected)} GS` },
          { label: "Mora Cobrada", value: `${fmt(report.totalMora)} GS` },
          { label: "Pagos Registrados", value: String(report.paymentCount) },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px" }}>
            <p style={{ fontSize: "10px", color: "#6b7280", margin: "0 0 4px" }}>{kpi.label}</p>
            <p style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* By method */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
          Resumen por Método de Pago
        </h3>
        <table style={{ width: "50%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Método</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Pagos</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Monto GS</th>
            </tr>
          </thead>
          <tbody>
            {report.byMethod.map((m, i) => (
              <tr key={m.method} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                <td style={tdStyle}>{METHOD_LABEL[m.method] ?? m.method}</td>
                <td style={tdRight}>{m.count}</td>
                <td style={tdRight}>{fmt(m.amount)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: "#f3f4f6" }}>
              <td style={tdStyle}>Total</td>
              <td style={tdRight}>{report.paymentCount}</td>
              <td style={tdRight}>{fmt(report.totalCollected)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detail */}
      <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
        Detalle de Pagos ({report.recentPayments.length} registros)
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>N° Recibo</th>
            <th style={thStyle}>Fecha</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Venta</th>
            <th style={thStyle}>Método</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Monto GS</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Mora GS</th>
            <th style={thStyle}>Cobrador</th>
          </tr>
        </thead>
        <tbody>
          {report.recentPayments.map((p, i) => (
            <tr key={p.id} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
              <td style={{ ...tdStyle, fontFamily: "monospace" }}>{p.number}</td>
              <td style={tdStyle}>{new Date(p.date).toLocaleDateString("es-PY")}</td>
              <td style={tdStyle}>{p.customer}</td>
              <td style={{ ...tdStyle, fontFamily: "monospace" }}>{p.saleNumber}</td>
              <td style={tdStyle}>{METHOD_LABEL[p.method] ?? p.method}</td>
              <td style={{ ...tdRight, fontWeight: 600 }}>{fmt(p.amount)}</td>
              <td style={tdRight}>{p.mora > 0 ? fmt(p.mora) : "—"}</td>
              <td style={tdStyle}>{p.collector}</td>
            </tr>
          ))}
          {report.recentPayments.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: "16px", color: "#9ca3af", fontSize: "11px" }}>
                Sin cobros en el período
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: "#f3f4f6" }}>
            <td colSpan={5} style={{ ...tdStyle, textAlign: "right" }}>TOTAL</td>
            <td style={tdRight}>{fmt(report.totalCollected)}</td>
            <td style={tdRight}>{fmt(report.totalMora)}</td>
            <td style={tdStyle}></td>
          </tr>
        </tfoot>
      </table>

      <PrintFooter company={company} />
    </>
  );
}
