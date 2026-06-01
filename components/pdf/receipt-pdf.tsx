import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

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
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
    backgroundColor: "#f4f4f5",
    padding: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 100,
    fontWeight: "bold",
    color: "#666",
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eee",
    padding: 5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    padding: 5,
  },
  totalSection: {
    marginTop: 20,
    borderTop: 2,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  }
});

interface ReceiptPDFProps {
  receipt: any;
  customer: any;
  sale: any;
  installments: any[];
  company: any;
}

export default function ReceiptPDF({ receipt, customer, sale, installments, company }: ReceiptPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text>RUC: {company.ruc}</Text>
            <Text>{company.address}</Text>
            <Text>Tel: {company.phone}</Text>
          </View>
          <View>
            <Text style={styles.receiptTitle}>RECIBO DE DINERO</Text>
            <Text style={{ textAlign: "right", marginTop: 5 }}>N°: {receipt.number}</Text>
            <Text style={{ textAlign: "right" }}>Fecha: {new Date(receipt.date).toLocaleString()}</Text>
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
              <Text style={styles.value}>{new Intl.NumberFormat().format(receipt.lateInterestApplied)} GS</Text>
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ flex: 1 }}>Couta N°</Text>
            <Text style={{ flex: 2 }}>Vencimiento</Text>
            <Text style={{ flex: 2, textAlign: "right" }}>Monto Cuota</Text>
          </View>
          {installments.map((inst: any) => (
            <View key={inst.id} style={styles.tableRow}>
              <Text style={{ flex: 1 }}>{inst.installmentNumber}</Text>
              <Text style={{ flex: 2 }}>{new Date(inst.dueDate).toLocaleDateString()}</Text>
              <Text style={{ flex: 2, textAlign: "right" }}>{new Intl.NumberFormat().format(inst.total)} GS</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={{ width: 150 }}>
            <View style={styles.row}>
              <Text style={{ fontWeight: "bold" }}>TOTAL RECIBIDO:</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "bold", textAlign: "right", marginTop: 5 }}>
              {new Intl.NumberFormat().format(receipt.amount)} GS
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 50, flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ width: 150, borderTopWidth: 1, textAlign: "center", paddingTop: 5 }}>
            <Text>Firma de Cajero</Text>
            <Text style={{ fontSize: 8 }}>Mueblería Cuotas</Text>
          </View>
          <View style={{ width: 150, borderTopWidth: 1, textAlign: "center", paddingTop: 5 }}>
            <Text>Firma de Cliente</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Este documento es una constancia de pago interna.
        </Text>
      </Page>
    </Document>
  );
}
