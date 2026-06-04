import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CompanyConfig {
  name: string;
  ruc: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
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
      <div style={{ borderBottom: "3px solid #1a3a8c", paddingBottom: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {company?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt="Logo"
                style={{ width: 60, height: 60, objectFit: "contain", borderRadius: "50%", border: "2px solid #1a3a8c" }}
              />
            )}
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#1a3a8c" }}>
                {company?.name ?? "Mueblería ERP"}
              </h1>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: "3px 0 0" }}>
                {[company?.ruc ? `RUC: ${company.ruc}` : null, company?.phone, company?.address]
                  .filter(Boolean)
                  .join("  ·  ")}
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "11px", color: "#6b7280" }}>
            <p style={{ margin: 0 }}>Generado: {generatedAt}</p>
            {period && <p style={{ margin: "2px 0 0", fontWeight: 500 }}>Período: {period}</p>}
          </div>
        </div>
      </div>

      {/* Report title */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#1a3a8c", textTransform: "uppercase", letterSpacing: "0.05em", borderLeft: "4px solid #f97316", paddingLeft: "10px" }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 14px" }}>{subtitle}</p>
        )}
      </div>
    </>
  );
}

export function PrintFooter({ company }: { company: CompanyConfig | null }) {
  return (
    <div
      style={{
        borderTop: "2px solid #1a3a8c",
        marginTop: "32px",
        paddingTop: "10px",
        fontSize: "10px",
        color: "#6b7280",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      <span style={{ color: "#f97316", fontWeight: 600 }}>{company?.name ?? "La Familia Comercial"}</span>
      <span style={{ color: "#d1d5db" }}>|</span>
      <span>Documento generado automáticamente por el sistema de gestión</span>
    </div>
  );
}
