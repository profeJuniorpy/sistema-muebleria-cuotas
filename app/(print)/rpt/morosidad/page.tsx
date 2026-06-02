import prisma from "@/lib/prisma";
import { getDelinquencyReport } from "@/lib/actions/reports";
import { PrintActions } from "../../components/print-actions";
import { PrintHeader, PrintFooter } from "../../components/print-header";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY").format(n);
}

export default async function PrintMorosidadPage() {
  const [report, company] = await Promise.all([
    getDelinquencyReport(),
    prisma.companyConfig.findFirst(),
  ]);

  const generatedDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });

  const thStyle = {
    background: "#f3f4f6",
    fontWeight: 600 as const,
    fontSize: "11px",
    padding: "6px 8px",
    textAlign: "left" as const,
    border: "1px solid #d1d5db",
  };
  const tdStyle = { fontSize: "11px", padding: "5px 8px", border: "1px solid #e5e7eb", verticalAlign: "top" as const };
  const tdRight = { ...tdStyle, textAlign: "right" as const };
  const tdCenter = { ...tdStyle, textAlign: "center" as const };

  return (
    <>
      <PrintActions />
      <PrintHeader
        company={company}
        title="Estado de Morosidad"
        subtitle={`Clientes con cuotas vencidas al ${generatedDate}`}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Saldo Total Vencido", value: `${fmt(report.totalOverdue)} GS`, color: "#dc2626" },
          { label: "Mora Estimada", value: `${fmt(report.totalEstimatedMora)} GS`, color: "#d97706" },
          { label: "Clientes en Mora", value: String(report.customerCount), color: "#dc2626" },
          { label: "Promedio de Atraso", value: `${report.avgDaysLate} días`, color: "#d97706" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px" }}>
            <p style={{ fontSize: "10px", color: "#6b7280", margin: "0 0 4px" }}>{kpi.label}</p>
            <p style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Delinquency table */}
      <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#374151" }}>
        Clientes con Cuotas Vencidas ({report.customerCount} clientes)
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>RUC / CI</th>
            <th style={thStyle}>Ciudad</th>
            <th style={thStyle}>Contacto</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Cuotas</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Saldo Vencido GS</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Mora Est. GS</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Días Máx.</th>
            <th style={thStyle}>Ventas</th>
          </tr>
        </thead>
        <tbody>
          {report.customers.map((c, i) => (
            <tr
              key={c.customerId}
              style={{
                background: i % 2 === 0 ? "white" : "#fff7f7",
              }}
            >
              <td style={{ ...tdStyle, fontWeight: 600 }}>{c.name}</td>
              <td style={tdStyle}>{c.ruc}</td>
              <td style={tdStyle}>{c.city ?? "—"}</td>
              <td style={tdStyle}>{c.mobile ?? c.phone ?? "—"}</td>
              <td style={{ ...tdCenter, fontWeight: 600, color: "#dc2626" }}>{c.installmentCount}</td>
              <td style={{ ...tdRight, fontWeight: 700, color: "#dc2626" }}>{fmt(c.overdueBalance)}</td>
              <td style={{ ...tdRight, color: "#d97706" }}>{fmt(c.estimatedMora)}</td>
              <td style={{
                ...tdCenter,
                fontWeight: 700,
                color: c.maxDaysLate > 60 ? "#dc2626" : c.maxDaysLate > 30 ? "#d97706" : "#374151",
              }}>
                {c.maxDaysLate}d
              </td>
              <td style={{ ...tdStyle, fontSize: "10px" }}>
                {c.sales.map((s) => `${s.number} (${s.count}c)`).join(", ")}
              </td>
            </tr>
          ))}
          {report.customers.length === 0 && (
            <tr>
              <td colSpan={9} style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: "11px" }}>
                No hay clientes en mora
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, background: "#fef2f2" }}>
            <td colSpan={5} style={{ ...tdStyle, textAlign: "right" }}>TOTALES</td>
            <td style={{ ...tdRight, color: "#dc2626" }}>{fmt(report.totalOverdue)}</td>
            <td style={{ ...tdRight, color: "#d97706" }}>{fmt(report.totalEstimatedMora)}</td>
            <td colSpan={2} style={tdStyle}></td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: "16px", fontSize: "10px", color: "#6b7280", fontStyle: "italic" }}>
        * La mora estimada es calculada con la tasa de mora pactada en cada crédito sobre el saldo vencido.
        El monto real puede variar según la fecha efectiva de pago.
      </div>

      <PrintFooter company={company} />
    </>
  );
}
