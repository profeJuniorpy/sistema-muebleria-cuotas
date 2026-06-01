import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CompanyConfig {
  name: string;
  ruc: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface PrintHeaderProps {
  company: CompanyConfig | null;
  title: string;
  subtitle?: string;
  period?: string;
}

export function PrintHeader({ company, title, subtitle, period }: PrintHeaderProps) {
  const now = new Date();
  const generatedAt = format(now, "dd/MM/yyyy 'a las' HH:mm", { locale: es });

  return (
    <>
      {/* Company info */}
      <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#111" }}>
              {company?.name ?? "Mueblería ERP"}
            </h1>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: "2px 0 0" }}>
              {[company?.ruc ? `RUC: ${company.ruc}` : null, company?.phone, company?.address]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
            <p style={{ margin: 0 }}>Generado: {generatedAt}</p>
            {period && <p style={{ margin: "2px 0 0", fontWeight: 500 }}>Período: {period}</p>}
          </div>
        </div>
      </div>

      {/* Report title */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#111", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0" }}>{subtitle}</p>
        )}
      </div>
    </>
  );
}

export function PrintFooter({ company }: { company: CompanyConfig | null }) {
  return (
    <div
      style={{
        borderTop: "1px solid #e5e7eb",
        marginTop: "32px",
        paddingTop: "10px",
        fontSize: "10px",
        color: "#9ca3af",
        textAlign: "center",
      }}
    >
      {company?.name ?? "Sistema ERP"} — Documento generado automáticamente por el sistema de gestión
    </div>
  );
}
