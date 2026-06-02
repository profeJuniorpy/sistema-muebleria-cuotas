import prisma from "@/lib/prisma";
import { getSalesReport } from "@/lib/actions/reports";
import { getPeriodDates } from "@/lib/period-utils";
import { PrintActions } from "../../components/print-actions";
import { PrintHeader, PrintFooter } from "../../components/print-header";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { CONTADO: "Contado", CREDITO: "Crédito" };
const CHANNEL_LABEL: Record<string, string> = { TIENDA: "Tienda", VISITA: "Visita", TELEFONICA: "Telefónica" };
const STATUS_LABEL: Record<string, string> = { COMPLETADA: "Completada", PENDIENTE: "Pendiente", MORA: "En Mora", CANCELADA: "Cancelada" };
const CAT_LABEL: Record<string, string> = { MUEBLES: "Muebles", ELECTRODOMESTICOS: "Electrodomésticos", ELECTRONICOS: "Electrónicos", COLCHONES: "Colchones", OTROS: "Otros" };

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY").format(n);
}

export default async function PrintVentasPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period = searchParams.period ?? "thisMonth";
  const { from, to, label } = getPeriodDates(period);

  const [report, company] = await Promise.all([
    getSalesReport(from, to),
    prisma.companyConfig.findFirst(),
  ]);

  const thStyle = {
    background: "#f3f4f6",
    fontWeight: 600,
    fontSize: "11px",
    padding: "6px 10px",
    textAlign: "left" as const,
    border: "1px solid #d1d5db",
  };
  const tdStyle = {
    fontSize: "11px",
    padding: "5px 10px",
    border: "1px solid #e5e7eb",
    verticalAlign: "top" as const,
  };
  const tdRight = { ...tdStyle, textAlign: "right" as const };
  const tdCenter = { ...tdStyle, textAlign: "center" as const };

  return (
    <>
      <PrintActions />
      <PrintHeader
        company={company}
        title="Reporte de Ventas"
        period={label}
        subtitle={`${from.toLocaleDateString("es-PY")} al ${to.toLocaleDateString("es-PY")}`}
      />

      {/* KPI summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Ventas", value: String(report.totalSales) },
          { label: "Monto Total", value: `${fmt(report.totalAmount)} GS` },
          { label: "Ticket Promedio", value: `${fmt(report.avgTicket)} GS` },
          { label: "Crédito Otorgado", value: `${fmt(report.creditoAmount)} GS` },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px" }}
          >
            <p style={{ fontSize: "10px", color: "#6b7280", margin: "0 0 4px" }}>{kpi.label}</p>
            <p style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Sales by type */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>Por Tipo de Venta</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Tipo</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ventas</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Monto GS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Contado</td>
                <td style={tdRight}>{report.contadoCount}</td>
                <td style={tdRight}>{fmt(report.contadoAmount)}</td>
              </tr>
              <tr style={{ background: "#f9fafb" }}>
                <td style={tdStyle}>Crédito</td>
                <td style={tdRight}>{report.creditoCount}</td>
                <td style={tdRight}>{fmt(report.creditoAmount)}</td>
              </tr>
              <tr style={{ fontWeight: 700 }}>
                <td style={tdStyle}>Total</td>
                <td style={tdRight}>{report.totalSales}</td>
                <td style={tdRight}>{fmt(report.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>Por Canal</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Canal</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ventas</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Monto GS</th>
              </tr>
            </thead>
            <tbody>
              {report.byChannel.map((c, i) => (
                <tr key={c.channel} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                  <td style={tdStyle}>{CHANNEL_LABEL[c.channel] ?? c.channel}</td>
                  <td style={tdRight}>{c.count}</td>
                  <td style={tdRight}>{fmt(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category */}
      {report.byCategory.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>Por Categoría de Producto</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Categoría</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Unidades</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Monto GS</th>
              </tr>
            </thead>
            <tbody>
              {report.byCategory.map((c, i) => (
                <tr key={c.category} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                  <td style={tdStyle}>{CAT_LABEL[c.category] ?? c.category}</td>
                  <td style={tdRight}>{c.count}</td>
                  <td style={tdRight}>{fmt(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All sales */}
      <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
        Detalle de Ventas del Período ({report.topSales.length} registros)
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>N° Venta</th>
            <th style={thStyle}>Fecha</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Vendedor</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Tipo</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Total GS</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {report.topSales.map((s, i) => (
            <tr key={s.number} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
              <td style={{ ...tdStyle, fontFamily: "monospace" }}>{s.number}</td>
              <td style={tdStyle}>{new Date(s.date).toLocaleDateString("es-PY")}</td>
              <td style={tdStyle}>{s.customer}</td>
              <td style={tdStyle}>{s.seller}</td>
              <td style={tdCenter}>{TYPE_LABEL[s.type] ?? s.type}</td>
              <td style={{ ...tdRight, fontWeight: 600 }}>{fmt(s.total)}</td>
              <td style={tdCenter}>{STATUS_LABEL[s.status] ?? s.status}</td>
            </tr>
          ))}
          {report.topSales.length === 0 && (
            <tr>
              <td colSpan={7} style={{ ...tdCenter, color: "#9ca3af", padding: "16px" }}>
                Sin ventas en el período
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: "#f3f4f6" }}>
            <td colSpan={5} style={{ ...tdStyle, textAlign: "right" }}>TOTAL</td>
            <td style={tdRight}>{fmt(report.totalAmount)}</td>
            <td style={tdStyle}></td>
          </tr>
        </tfoot>
      </table>

      <PrintFooter company={company} />
    </>
  );
}
