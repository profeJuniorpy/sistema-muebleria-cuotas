import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

const BRAND_BLUE = "#1a3a8c";
const BRAND_ORANGE = "#f97316";
const BRAND_LIGHT = "#dbeafe";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#333",
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 3,
    borderBottomColor: BRAND_BLUE,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: BRAND_BLUE,
    marginRight: 10,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: BRAND_BLUE,
  },
  companyInfo: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: BRAND_BLUE,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_ORANGE,
    paddingBottom: 6,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 10,
    backgroundColor: BRAND_LIGHT,
    color: BRAND_BLUE,
    padding: 3,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_ORANGE,
  },
  paragraph: {
    textAlign: "justify",
    lineHeight: 1.5,
    marginBottom: 8,
  },
  bold: {
    fontWeight: "bold",
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: BRAND_BLUE,
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_BLUE,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_BLUE,
    fontWeight: "bold",
    padding: 4,
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    padding: 3,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    padding: 3,
    backgroundColor: "#f8fafc",
  },
  signatureSection: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 2,
    borderTopColor: BRAND_BLUE,
    paddingTop: 5,
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

interface ContractPDFProps {
  sale: any;
  customer: any;
  creditPlan: any;
  items: any[];
  schedule: any[];
  company: any;
  logoUrl?: string;
}

export default function ContractPDF({ sale, customer, creditPlan, items, schedule, company, logoUrl }: ContractPDFProps) {
  return (
    <Document>
      <Page style={styles.page}>
        {/* Header with logo */}
        <View style={styles.contractHeader}>
          <View style={styles.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companyInfo}>RUC: {company.ruc}</Text>
              <Text style={styles.companyInfo}>{company.address}</Text>
              <Text style={styles.companyInfo}>Tel: {company.phone}</Text>
            </View>
          </View>
          <View>
            <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "right" }}>
              Fecha: {new Date(sale.date).toLocaleDateString()}
            </Text>
            <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "right", marginTop: 2 }}>
              Venta N°: {sale.number}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>CONTRATO DE COMPRAVENTA A CRÉDITO</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I. PARTES CONTRATANTES</Text>
          <Text style={styles.paragraph}>
            En la ciudad de Coronel Oviedo, República del Paraguay, a los {new Date(sale.date).toLocaleDateString()}, entre <Text style={styles.bold}>{company.name}</Text>, con RUC {company.ruc}, en adelante denominada "LA EMPRESA", y el Sr./Sra. <Text style={styles.bold}>{customer.name}</Text>, con CI/RUC <Text style={styles.bold}>{customer.ruc}</Text>, con domicilio en {customer.address}, {customer.city}, en adelante denominado "EL CLIENTE", celebran el presente contrato de compraventa sujeto a las siguientes cláusulas.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>II. OBJETO DEL CONTRATO</Text>
          <Text style={styles.paragraph}>
            LA EMPRESA vende a favor de EL CLIENTE los siguientes artículos:
          </Text>
          {items.map((item, idx) => (
            <Text key={idx} style={{ marginLeft: 10 }}>- {item.quantity} x {item.productName} (G. {new Intl.NumberFormat().format(item.unitPrice)})</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>III. CONDICIONES FINANCIERAS</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <View style={{ width: "50%", marginBottom: 5 }}>
              <Text>Precio Total: G. {new Intl.NumberFormat().format(sale.total)}</Text>
            </View>
            <View style={{ width: "50%", marginBottom: 5 }}>
              <Text>Entrega Inicial: G. {new Intl.NumberFormat().format(creditPlan.downPayment)}</Text>
            </View>
            <View style={{ width: "50%", marginBottom: 5 }}>
              <Text>Monto Financiado: G. {new Intl.NumberFormat().format(creditPlan.financedAmount)}</Text>
            </View>
            <View style={{ width: "50%", marginBottom: 5 }}>
              <Text>Cantidad de Cuotas: {creditPlan.installments}</Text>
            </View>
            <View style={{ width: "50%", marginBottom: 5 }}>
              <Text>Monto por Cuota: G. {new Intl.NumberFormat().format(creditPlan.installmentAmount)}</Text>
            </View>
            <View style={{ width: "50%", marginBottom: 5 }}>
              <Text>Tasa de Interés: {Number(creditPlan.interestRate)}% ({creditPlan.interestMode})</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IV. CLÁUSULA DE MORA</Text>
          <Text style={styles.paragraph}>
            El atraso en el pago de cualquier cuota generará automáticamente un interés por mora del <Text style={styles.bold}>{Number(creditPlan.lateInterestRate)}% diario</Text> sobre el saldo de la cuota vencida, sin necesidad de interpelación alguna.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>V. PLAN DE PAGOS (AMORTIZACIÓN)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: 40 }]}>N°</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Vencimiento</Text>
              <Text style={[styles.tableHeaderText, { width: 80, textAlign: "right" }]}>Capital</Text>
              <Text style={[styles.tableHeaderText, { width: 80, textAlign: "right" }]}>Interés</Text>
              <Text style={[styles.tableHeaderText, { width: 80, textAlign: "right" }]}>TOTAL</Text>
            </View>
            {schedule.slice(0, 15).map((row: any, idx: number) => (
              <View key={row.installmentNumber} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={{ width: 40 }}>{row.installmentNumber}</Text>
                <Text style={{ flex: 1 }}>{new Date(row.dueDate).toLocaleDateString()}</Text>
                <Text style={{ width: 80, textAlign: "right" }}>{new Intl.NumberFormat().format(row.principal)}</Text>
                <Text style={{ width: 80, textAlign: "right" }}>{new Intl.NumberFormat().format(row.interest)}</Text>
                <Text style={{ width: 80, textAlign: "right" }}>{new Intl.NumberFormat().format(row.total)}</Text>
              </View>
            ))}
            {schedule.length > 15 && <Text style={{ textAlign: "center", padding: 4, color: "#6b7280" }}>... (Ver anexo para tabla completa)</Text>}
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={{ color: "#555" }}>___________________________</Text>
            <Text style={{ marginTop: 5, fontWeight: "bold", color: BRAND_BLUE }}>EL CLIENTE</Text>
            <Text style={{ fontSize: 7, color: "#6b7280" }}>CI/RUC: {customer.ruc}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ color: "#555" }}>___________________________</Text>
            <Text style={{ marginTop: 5, fontWeight: "bold", color: BRAND_BLUE }}>POR LA EMPRESA</Text>
            <Text style={{ fontSize: 7, color: "#6b7280" }}>{company.name}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {company.name} — Documento generado automáticamente. Ciudad de Coronel Oviedo, Paraguay.
        </Text>
      </Page>
    </Document>
  );
}
