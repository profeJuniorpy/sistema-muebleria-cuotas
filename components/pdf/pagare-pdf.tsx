import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { amountToWordsPYG } from "@/lib/number-to-words";

const BRAND_BLUE = "#1a3a8c";
const BRAND_ORANGE = "#f97316";
const BRAND_LIGHT = "#dbeafe";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#222",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: BRAND_BLUE,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BRAND_BLUE,
    marginRight: 10,
  },
  companyName: { fontSize: 13, fontWeight: "bold", color: BRAND_BLUE },
  companyInfo: { fontSize: 8, color: "#6b7280", marginTop: 1 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 4,
    color: BRAND_BLUE,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 8,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 18,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  amountBox: {
    borderWidth: 1.5,
    borderColor: BRAND_BLUE,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  amountLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase" },
  amountValue: { fontSize: 18, fontWeight: "bold", color: BRAND_ORANGE, marginTop: 2 },
  metaBox: { fontSize: 9, textAlign: "right" },
  paragraph: { textAlign: "justify", lineHeight: 1.7, marginBottom: 14 },
  bold: { fontWeight: "bold" },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 4,
    fontSize: 9.5,
    backgroundColor: BRAND_LIGHT,
    color: BRAND_BLUE,
    padding: 3,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_ORANGE,
  },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  infoItem: { width: "50%", marginBottom: 4 },
  infoLabel: { fontSize: 7.5, color: "#6b7280" },
  infoValue: { fontSize: 9.5, fontWeight: "bold" },
  clause: { textAlign: "justify", lineHeight: 1.6, marginBottom: 8, fontSize: 8.5 },
  signatureSection: {
    marginTop: 70,
    flexDirection: "row",
    justifyContent: "center",
  },
  signatureBox: {
    width: "60%",
    borderTopWidth: 1.5,
    borderTopColor: "#333",
    paddingTop: 6,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 7,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 5,
  },
});

interface PagarePDFProps {
  pagareNumber: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  debtor: {
    name: string;
    ruc: string;
    address?: string | null;
    city?: string | null;
  };
  creditor: {
    name: string;
    ruc: string;
    address?: string | null;
    city?: string | null;
  };
  saleNumber: string;
  lateInterestRate?: number;
  logoUrl?: string;
}

const fmtGs = (n: number) => new Intl.NumberFormat("es-PY").format(Math.round(n));
const fmtDate = (d: Date) => d.toLocaleDateString("es-PY", { day: "2-digit", month: "long", year: "numeric" });

export default function PagarePDF({
  pagareNumber,
  issueDate,
  dueDate,
  amount,
  debtor,
  creditor,
  saleNumber,
  lateInterestRate,
  logoUrl,
}: PagarePDFProps) {
  const placeOfIssue = creditor.city || "Coronel Oviedo";
  const placeOfPayment = creditor.address
    ? `${creditor.address}${creditor.city ? `, ${creditor.city}` : ""}`
    : creditor.city || placeOfIssue;

  return (
    <Document>
      <Page style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.companyName}>{creditor.name}</Text>
              <Text style={styles.companyInfo}>RUC: {creditor.ruc}</Text>
              {creditor.address && <Text style={styles.companyInfo}>{creditor.address}</Text>}
            </View>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "right" }}>
              Ref. Venta N°: {saleNumber}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>PAGARÉ</Text>
        <Text style={styles.subtitle}>A LA ORDEN — REPÚBLICA DEL PARAGUAY</Text>

        {/* Amount + reference */}
        <View style={styles.topRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Importe</Text>
            <Text style={styles.amountValue}>Gs. {fmtGs(amount)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text>Pagaré N°: {pagareNumber}</Text>
            <Text style={{ marginTop: 3 }}>
              {placeOfIssue}, {fmtDate(issueDate)}
            </Text>
            <Text style={{ marginTop: 3 }}>Vencimiento: {fmtDate(dueDate)}</Text>
          </View>
        </View>

        {/* Main body */}
        <Text style={styles.paragraph}>
          Por este PAGARÉ debo y pagaré incondicionalmente, sin protesto, a la orden de{" "}
          <Text style={styles.bold}>{creditor.name}</Text>, con RUC N° {creditor.ruc}, o a quien
          sus legítimos derechos represente, en la ciudad de {placeOfPayment}, el día{" "}
          <Text style={styles.bold}>{fmtDate(dueDate)}</Text>, la cantidad de{" "}
          <Text style={styles.bold}>Guaraníes {amountToWordsPYG(amount)}</Text> (Gs.{" "}
          {fmtGs(amount)}), por igual valor recibido a mi entera satisfacción en concepto de
          saldo de precio de mercaderías adquiridas a crédito, según Venta N° {saleNumber}.
        </Text>

        <Text style={styles.sectionTitle}>DATOS DEL DEUDOR</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nombre y Apellido / Razón Social</Text>
            <Text style={styles.infoValue}>{debtor.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>C.I. / RUC</Text>
            <Text style={styles.infoValue}>{debtor.ruc}</Text>
          </View>
          <View style={{ width: "100%", marginBottom: 4 }}>
            <Text style={styles.infoLabel}>Domicilio</Text>
            <Text style={styles.infoValue}>
              {debtor.address || "S/D"}{debtor.city ? `, ${debtor.city}` : ""}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>CLÁUSULAS</Text>
        <Text style={styles.clause}>
          1. El presente pagaré se emite sin necesidad de protesto por falta de pago, requisito
          al cual el suscriptor renuncia expresamente, de conformidad con el Decreto-Ley N°
          4987/62 y sus modificaciones, que regula la Letra de Cambio y el Pagaré en la República
          del Paraguay.
        </Text>
        {Number(lateInterestRate) > 0 && (
          <Text style={styles.clause}>
            2. En caso de mora en el pago a su vencimiento, el saldo adeudado devengará un interés
            punitorio del <Text style={styles.bold}>{Number(lateInterestRate)}% diario</Text>{" "}
            hasta su cancelación total, sin necesidad de interpelación judicial o extrajudicial
            alguna.
          </Text>
        )}
        <Text style={styles.clause}>
          {Number(lateInterestRate) > 0 ? "3" : "2"}. El deudor se somete, para todos los efectos
          legales derivados del presente documento, a la jurisdicción de los tribunales ordinarios
          de la ciudad de {placeOfIssue}, República del Paraguay, con renuncia expresa a cualquier
          otro fuero o jurisdicción que pudiera corresponderle.
        </Text>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={{ fontWeight: "bold" }}>{debtor.name}</Text>
            <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 2 }}>
              C.I./RUC: {debtor.ruc} — FIRMA DEL DEUDOR
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {creditor.name} — Documento generado automáticamente el {fmtDate(new Date())}. Válido
          como título de crédito conforme a la legislación paraguaya vigente.
        </Text>
      </Page>
    </Document>
  );
}
