import prisma from "@/lib/prisma";
import { getInventoryReport } from "@/lib/actions/reports";
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

export default async function PrintInventarioPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period = searchParams.period ?? "thisMonth";
  const { from, to, label } = getPeriodDates(period);

  const [report, company] = await Promise.all([
    getInventoryReport(from, to),
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
  const tdCenter = { ...tdStyle, textAlign: "center" as const };

  const lowStock = report.byProduct.filter((p) => p.isLow);
  const withMovements = report.byProduct.filter((p) => p.entries > 0 || p.exits > 0);

  return (
    <>
      <PrintActions />
      <PrintHeader
        company={company}
        title="Reporte de Inventario"
        period={label}
        subtitle={`Movimientos del ${from.toLocaleDateString("es-PY")} al ${to.toLocaleDateString("es-PY")} · Stock en tiempo real`}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Movimientos", value: String(report.totalMovements) },
          { label: "Entradas", value: `+${report.totalEntries} unidades`, color: "#059669" },
          { label: "Salidas", value: `-${report.totalExits} unidades`, color: "#2563eb" },
          { label: "Stock Crítico", value: `${report.lowStockCount} productos`, color: report.lowStockCount > 0 ? "#dc2626" : "#059669" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px" }}>
            <p style={{ fontSize: "10px", color: "#6b7280", margin: "0 0 4px" }}>{kpi.label}</p>
            <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: kpi.color ?? "#111" }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#dc2626" }}>
            ⚠ Productos con Stock Crítico ({lowStock.length})
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Código</th>
                <th style={thStyle}>Producto</th>
                <th style={thStyle}>Categoría</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Stock Actual</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Stock Mínimo</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Faltante</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((p, i) => (
                <tr key={p.id} style={{ background: "#fff7f7" }}>
                  <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "10px" }}>{p.code}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                  <td style={tdStyle}>{CAT_LABEL[p.category] ?? p.category}</td>
                  <td style={{ ...tdRight, fontWeight: 700, color: "#dc2626" }}>{p.currentStock}</td>
                  <td style={tdRight}>{p.minStock}</td>
                  <td style={{ ...tdRight, color: "#d97706" }}>
                    {p.minStock - p.currentStock > 0 ? `${p.minStock - p.currentStock}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full product table */}
      <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
        Todos los Productos ({report.byProduct.length})
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Código</th>
            <th style={thStyle}>Producto</th>
            <th style={thStyle}>Categoría</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Stock</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Mín.</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Entradas</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Salidas</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {report.byProduct.map((p, i) => (
            <tr
              key={p.id}
              style={{
                background: p.isLow ? "#fff7f7" : i % 2 === 0 ? "white" : "#f9fafb",
              }}
            >
              <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "10px" }}>{p.code}</td>
              <td style={tdStyle}>{p.name}</td>
              <td style={tdStyle}>{CAT_LABEL[p.category] ?? p.category}</td>
              <td style={{
                ...tdRight,
                fontWeight: 700,
                color: p.isLow ? "#dc2626" : "#111",
              }}>
                {p.currentStock}
              </td>
              <td style={tdRight}>{p.minStock}</td>
              <td style={{ ...tdRight, color: p.entries > 0 ? "#059669" : "#9ca3af" }}>
                {p.entries > 0 ? `+${p.entries}` : "—"}
              </td>
              <td style={{ ...tdRight, color: p.exits > 0 ? "#2563eb" : "#9ca3af" }}>
                {p.exits > 0 ? `-${p.exits}` : "—"}
              </td>
              <td style={tdCenter}>
                {p.isLow
                  ? <span style={{ color: "#dc2626", fontWeight: 600 }}>CRÍTICO</span>
                  : p.status === "AGOTADO"
                  ? <span style={{ color: "#9ca3af" }}>Agotado</span>
                  : <span style={{ color: "#059669" }}>OK</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PrintFooter company={company} />
    </>
  );
}
