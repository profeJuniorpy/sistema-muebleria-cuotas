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
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: BRAND_BLUE,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: BRAND_BLUE,
  },
  companyInfo: {
    flexDirection: "column",
    marginLeft: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: BRAND_BLUE,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    color: BRAND_BLUE,
  },
  receiptNumber: {
    textAlign: "right",
    marginTop: 4,
    color: "#555",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
    backgroundColor: BRAND_LIGHT,
    color: BRAND_BLUE,
    padding: 4,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_ORANGE,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 110,
    fontWeight: "bold",
    color: "#555",
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_BLUE,
    padding: 5,
    fontWeight: "bold",
    color: "#fff",
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    padding: 5,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    padding: 5,
    backgroundColor: "#f8fafc",
  },
  totalSection: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: BRAND_BLUE,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalBox: {
    width: 160,
    backgroundColor: BRAND_BLUE,
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  totalLabel: {
    color: "#bfdbfe",
    fontSize: 8,
    marginBottom: 2,
  },
  totalAmount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  }
});

interface ReceiptPDFProps {
  receipt: any;
  customer: any;
  sale: any;
  installments: any[];
  company: any;
  logoUrl?: string;
}

export default function ReceiptPDF({ receipt, customer, sale, installments, company, logoUrl }: ReceiptPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>RUC: {company.ruc}</Text>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>{company.address}</Text>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>Tel: {company.phone}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.receiptTitle}>RECIBO DE DINERO</Text>
            <Text style={styles.receiptNumber}>N°: {receipt.number}</Text>
            <Text style={{ textAlign: "right", color: "#555" }}>Fecha: {new Date(receipt.date).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>RUC / CI:</Text>
            <Text style={styles.value}>{customer.ruc}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DEL PAGO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Concepto:</Text>
            <Text style={styles.value}>Pago de cuotas - Venta {sale.number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Forma de Pago:</Text>
            <Text style={styles.value}>{receipt.paymentMethod}</Text>
          </View>
          {receipt.lateInterestApplied > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Mora Aplicada:</Text>
              <Text style={[styles.value, { color: BRAND_ORANGE }]}>{new Intl.NumberFormat().format(receipt.lateInterestApplied)} GS</Text>
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Cuota N°</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Vencimiento</Text>
            <Text style={[styles.tableHeaderText, { flex: 2, textAlign: "right" }]}>Monto Cuota</Text>
          </View>
          {installments.map((inst: any, idx: number) => (
            <View key={inst.id} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={{ flex: 1 }}>{inst.installmentNumber}</Text>
              <Text style={{ flex: 2 }}>{new Date(inst.dueDate).toLocaleDateString()}</Text>
              <Text style={{ flex: 2, textAlign: "right" }}>{new Intl.NumberFormat().format(inst.total)} GS</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>TOTAL RECIBIDO</Text>
            <Text style={styles.totalAmount}>
              {new Intl.NumberFormat().format(receipt.amount)} GS
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 50, flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ width: 150, borderTopWidth: 1, borderTopColor: BRAND_BLUE, textAlign: "center", paddingTop: 5 }}>
            <Text style={{ color: "#555" }}>Firma de Cajero</Text>
            <Text style={{ fontSize: 8, color: "#999" }}>{company.name}</Text>
          </View>
          <View style={{ width: 150, borderTopWidth: 1, borderTopColor: BRAND_BLUE, textAlign: "center", paddingTop: 5 }}>
            <Text style={{ color: "#555" }}>Firma de Cliente</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {company.name} — Este documento es una constancia de pago interna.
        </Text>
      </Page>
    </Document>
  );
}
