import prisma from "@/lib/prisma";
import { getProfitReport } from "@/lib/actions/reports";
import { getPeriodDates } from "@/lib/period-utils";
import { PrintActions } from "../../components/print-actions";
import { PrintHeader, PrintFooter } from "../../components/print-header";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = {
  MUEBLES: "Muebles",
  ELECTRODOMESTICOS: "Electrodomésticos",
  ELECTRONICOS: "Electrónicos",
  COLCHONES: "Colchones",
  OTROS: "Otros",
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY").format(n);
}

export default async function PrintGananciasPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period = searchParams.period ?? "thisMonth";
  const { from, to, label } = getPeriodDates(period);

  const [report, company] = await Promise.all([
    getProfitReport(from, to),
    prisma.companyConfig.findFirst({ orderBy: { updatedAt: "desc" } }),
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

  const marginColor = report.margin >= 20 ? "#059669" : report.margin >= 10 ? "#d97706" : "#dc2626";

  return (
    <>
      <PrintActions />
      <PrintHeader
        company={company}
        title="Reporte de Ganancias"
        period={label}
        subtitle={`${from.toLocaleDateString("es-PY")} al ${to.toLocaleDateString("es-PY")}`}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Ingresos del Período", value: `${fmt(report.periodRevenue)} GS`, sub: `${report.salesCount} venta(s)`, color: "#1d4ed8" },
          { label: "Costo de Ventas", value: `${fmt(report.periodCost)} GS`, sub: "costo de productos vendidos", color: "#dc2626" },
          { label: "Ganancia Bruta", value: `${fmt(report.periodProfit)} GS`, sub: "", color: report.periodProfit >= 0 ? "#059669" : "#dc2626" },
          { label: "Margen Bruto", value: `${report.margin}%`, sub: "ganancia / ingresos", color: marginColor },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px" }}>
            <p style={{ fontSize: "10px", color: "#6b7280", margin: "0 0 4px" }}>{kpi.label}</p>
            <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: kpi.color }}>{kpi.value}</p>
            {kpi.sub && <p style={{ fontSize: "9px", color: "#9ca3af", margin: "2px 0 0" }}>{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* Valor del inventario */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "#1e40af" }}>
          Valor del Inventario Actual
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { label: "Productos Activos", value: String(report.inventoryValue.totalProducts), color: "#111827" },
            { label: "Valor a Costo", value: `${fmt(report.inventoryValue.costValue)} GS`, color: "#dc2626" },
            { label: "Valor a Precio de Venta", value: `${fmt(report.inventoryValue.saleValue)} GS`, color: "#1d4ed8" },
            { label: "Ganancia Potencial", value: `${fmt(report.inventoryValue.potentialProfit)} GS`, color: "#059669" },
          ].map((item) => (
            <div key={item.label} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "10px" }}>
              <p style={{ fontSize: "9px", color: "#6b7280", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
              <p style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ganancia por categoría */}
      {report.byCategory.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
            Ganancia por Categoría — {label}
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Categoría</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ingresos GS</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Costo GS</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ganancia GS</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Margen</th>
              </tr>
            </thead>
            <tbody>
              {report.byCategory.map((c, i) => (
                <tr key={c.category} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                  <td style={tdStyle}>{CAT_LABEL[c.category] ?? c.category}</td>
                  <td style={{ ...tdRight, color: "#1d4ed8", fontWeight: 600 }}>{fmt(c.revenue)}</td>
                  <td style={{ ...tdRight, color: "#dc2626" }}>{fmt(c.cost)}</td>
                  <td style={{ ...tdRight, color: "#059669", fontWeight: 700 }}>{fmt(c.profit)}</td>
                  <td style={{ ...tdRight, color: c.margin >= 20 ? "#059669" : c.margin >= 10 ? "#d97706" : "#dc2626", fontWeight: 600 }}>
                    {c.margin}%
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, background: "#f3f4f6" }}>
                <td style={tdStyle}>TOTAL</td>
                <td style={{ ...tdRight, color: "#1d4ed8" }}>{fmt(report.periodRevenue)}</td>
                <td style={{ ...tdRight, color: "#dc2626" }}>{fmt(report.periodCost)}</td>
                <td style={{ ...tdRight, color: "#059669" }}>{fmt(report.periodProfit)}</td>
                <td style={{ ...tdRight, color: marginColor }}>{report.margin}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Evolución mensual */}
      {report.byMonth.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
            Evolución Mensual — últimos 12 meses
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Mes</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ingresos GS</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Costo GS</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ganancia GS</th>
              </tr>
            </thead>
            <tbody>
              {report.byMonth.map((m, i) => (
                <tr key={m.month} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                  <td style={tdStyle}>{m.month}</td>
                  <td style={{ ...tdRight, color: "#1d4ed8" }}>{fmt(m.revenue)}</td>
                  <td style={{ ...tdRight, color: "#dc2626" }}>{fmt(m.cost)}</td>
                  <td style={{ ...tdRight, color: m.profit >= 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>{fmt(m.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle diario del período */}
      {report.byDay.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
            Detalle Diario — {label}
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Fecha</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ingresos GS</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Costo GS</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Ganancia GS</th>
              </tr>
            </thead>
            <tbody>
              {report.byDay.map((d, i) => (
                <tr key={d.date} style={{ background: i % 2 === 0 ? "white" : "#f9fafb" }}>
                  <td style={tdStyle}>{new Date(d.date).toLocaleDateString("es-PY")}</td>
                  <td style={{ ...tdRight, color: "#1d4ed8" }}>{fmt(d.revenue)}</td>
                  <td style={{ ...tdRight, color: "#dc2626" }}>{fmt(d.cost)}</td>
                  <td style={{ ...tdRight, color: d.profit >= 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>{fmt(d.profit)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, background: "#f3f4f6" }}>
                <td style={tdStyle}>TOTAL</td>
                <td style={{ ...tdRight, color: "#1d4ed8" }}>{fmt(report.periodRevenue)}</td>
                <td style={{ ...tdRight, color: "#dc2626" }}>{fmt(report.periodCost)}</td>
                <td style={{ ...tdRight, color: report.periodProfit >= 0 ? "#059669" : "#dc2626" }}>{fmt(report.periodProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <PrintFooter company={company} />
    </>
  );
}
