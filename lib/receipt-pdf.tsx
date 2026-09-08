import "server-only";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

import { WatchLogo } from "@/lib/pdf-logo";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottom: "1pt solid #dddddd",
  },
  brand: { flexDirection: "row", alignItems: "center" },
  logoWrap: { marginRight: 8 },
  shopName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  muted: { color: "#666666" },
  docTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "right" },
  docNumber: { fontSize: 10, color: "#666666", textAlign: "right", marginTop: 2 },

  fields: { marginTop: 16 },
  fieldRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottom: "1pt solid #eeeeee",
  },
  fieldLabel: { width: 120, color: "#666666" },
  fieldValue: { flex: 1 },

  note: { marginTop: 14, fontSize: 9, color: "#666666" },

  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 40 },
  signatureBlock: { width: 150 },
  signatureRole: { fontSize: 9, color: "#666666" },
  signatureLine: { marginTop: 42, borderTop: "1pt solid #999999", paddingTop: 4 },
  signatureName: { fontSize: 9 },

  social: { marginTop: 24, fontSize: 8, color: "#666666" },
});

export type ReceiptPdfData = {
  orderNumber: string;
  createdAt: Date;
  watchLabel: string;
  customerName: string;
  customerPhone: string;
  notes: string | null;
};

/**
 * Tanda terima yang diserahkan ke customer saat jam ditinggal di toko.
 * Sengaja hanya memuat field 1-6 dari kartu kerja — sisanya (usia/karakter
 * owner, jenis service, progress) adalah catatan internal.
 */
function ReceiptDocument({ data }: { data: ReceiptPdfData }) {
  const fields = [
    { no: 1, label: "Nomor", value: data.orderNumber },
    { no: 2, label: "Tanggal", value: data.createdAt.toLocaleDateString("id-ID") },
    { no: 3, label: "Nama Jam", value: data.watchLabel },
    { no: 4, label: "Nama Owner Jam", value: data.customerName },
    { no: 5, label: "Nomor Hape Owner", value: data.customerPhone },
    { no: 6, label: "Keterangan Masalah", value: data.notes?.trim() || "-" },
  ];

  return (
    <Document
      title={`Tanda Terima ${data.orderNumber}`}
      author="WatchYongs"
      subject={`Tanda terima penerimaan jam ${data.orderNumber}`}
    >
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <WatchLogo size={32} />
            </View>
            <View>
              <Text style={styles.shopName}>WatchYongs</Text>
              <Text style={styles.muted}>Jasa Reparasi Jam Tangan</Text>
            </View>
          </View>
          <View>
            <Text style={styles.docTitle}>TANDA TERIMA</Text>
            <Text style={styles.docNumber}>{data.orderNumber}</Text>
          </View>
        </View>

        <View style={styles.fields}>
          {fields.map((field) => (
            <View key={field.no} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>
                {field.no}. {field.label}
              </Text>
              <Text style={styles.fieldValue}>{field.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          Simpan tanda terima ini dan tunjukkan saat mengambil jam.
        </Text>

        <View style={styles.signatures}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureRole}>Diterima oleh,</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>Petugas WatchYongs</Text>
            </View>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureRole}>Pemilik jam,</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>{data.customerName}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.social}>IG @watchyongs</Text>
      </Page>
    </Document>
  );
}

export async function generateReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument data={data} />);
}
