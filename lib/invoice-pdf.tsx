import "server-only";

import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  shopName: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  invoiceTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "right" },
  muted: { color: "#666666" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, color: "#666666", marginBottom: 4, textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  table: { marginTop: 8, borderTop: "1pt solid #dddddd" },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottom: "1pt solid #dddddd",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  totalLabel: { fontFamily: "Helvetica-Bold" },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  footer: { marginTop: 40, fontSize: 9, color: "#666666" },
});

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export type InvoicePdfData = {
  invoiceNumber: string;
  createdAt: Date;
  amount: number;
  order: {
    orderNumber: string;
    watchBrand: string;
    watchModel: string | null;
    watchInfo: string | null;
  };
  customer: {
    name: string;
    phone: string;
    address: string | null;
  };
  diagnosis: string | null;
};

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const watchLabel = `${data.order.watchBrand}${data.order.watchModel ? ` ${data.order.watchModel}` : ""}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>WatchYoung</Text>
            <Text style={styles.muted}>Jasa Reparasi Jam Tangan</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.muted}>{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ditagihkan Kepada</Text>
            <Text>{data.customer.name}</Text>
            <Text style={styles.muted}>{data.customer.phone}</Text>
            {data.customer.address && <Text style={styles.muted}>{data.customer.address}</Text>}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detail Order</Text>
            <Text>No. Order: {data.order.orderNumber}</Text>
            <Text>Tanggal: {data.createdAt.toLocaleDateString("id-ID")}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View>
              <Text>{watchLabel}</Text>
              {data.order.watchInfo && <Text style={styles.muted}>{data.order.watchInfo}</Text>}
              {data.diagnosis && <Text style={styles.muted}>{data.diagnosis}</Text>}
            </View>
            <Text>{formatRupiah(data.amount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRupiah(data.amount)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Terima kasih telah mempercayakan jam Anda kepada WatchYoung.</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
