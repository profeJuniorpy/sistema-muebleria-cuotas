import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#333",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    textDecoration: "underline",
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 10,
    backgroundColor: "#f0f0f0",
    padding: 2,
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
    borderColor: "#000",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderBottomWidth: 1,
    fontWeight: "bold",
    padding: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    padding: 2,
  },
  signatureSection: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    paddingTop: 5,
    textAlign: "center",
  }
});

interface ContractPDFProps {
  sale: any;
  customer: any;
  creditPlan: any;
  items: any[];
  schedule: any[];
  company: any;
}

export default function ContractPDF({ sale, customer, creditPlan, items, schedule, company }: ContractPDFProps) {
  return (
    <Document>
      <Page style={styles.page}>
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
              <Text style={{ width: 40 }}>N°</Text>
              <Text style={{ flex: 1 }}>Vencimiento</Text>
              <Text style={{ width: 80, textAlign: "right" }}>Capital</Text>
              <Text style={{ width: 80, textAlign: "right" }}>Interés</Text>
              <Text style={{ width: 80, textAlign: "right" }}>TOTAL</Text>
            </View>
            {schedule.slice(0, 15).map((row: any) => (
              <View key={row.installmentNumber} style={styles.tableRow}>
                <Text style={{ width: 40 }}>{row.installmentNumber}</Text>
                <Text style={{ flex: 1 }}>{new Date(row.dueDate).toLocaleDateString()}</Text>
                <Text style={{ width: 80, textAlign: "right" }}>{new Intl.NumberFormat().format(row.principal)}</Text>
                <Text style={{ width: 80, textAlign: "right" }}>{new Intl.NumberFormat().format(row.interest)}</Text>
                <Text style={{ width: 80, textAlign: "right" }}>{new Intl.NumberFormat().format(row.total)}</Text>
              </View>
            ))}
            {schedule.length > 15 && <Text style={{ textAlign: "center", padding: 2 }}>... (Ver anexo para tabla completa)</Text>}
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>___________________________</Text>
            <Text style={{ marginTop: 5 }}>EL CLIENTE</Text>
            <Text style={{ fontSize: 7 }}>CI/RUC: {customer.ruc}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>___________________________</Text>
            <Text style={{ marginTop: 5 }}>POR LA EMPRESA</Text>
            <Text style={{ fontSize: 7 }}>Mueblería Cuotas</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
