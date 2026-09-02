import "server-only";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Svg,
  Line,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { flexDirection: "row", alignItems: "center" },
  logoWrap: { marginRight: 10 },
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
    marginTop: 8,
    borderTop: "1pt solid #dddddd",
  },
  totalLabel: { fontFamily: "Helvetica-Bold" },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  watchBlock: { marginBottom: 16 },
  watchHeader: { fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
  },
  subtotalLabel: { fontSize: 9, color: "#666666" },
  subtotalValue: { fontSize: 9, color: "#666666", fontFamily: "Helvetica-Bold" },
  footer: { marginTop: 40, fontSize: 9, color: "#666666" },
  terms: { marginTop: 20, paddingTop: 12, borderTop: "1pt solid #dddddd" },
  termsTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  termsItem: { fontSize: 8, color: "#666666", marginBottom: 2 },
  payment: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  paymentLabel: { fontSize: 9, color: "#666666" },
  paymentName: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 2, marginBottom: 2 },
  thankYou: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  social: { marginTop: 12, fontSize: 9, color: "#666666" },
});

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function WatchLogo({ size = 40 }: { size?: number }) {
  const cx = 50;
  const cy = 50;
  const tickCount = 48;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const isCardinal = i % (tickCount / 4) === 0;
    const rad = ((i * 360) / tickCount) * (Math.PI / 180);
    const outerR = 46;
    const innerR = isCardinal ? 34 : 40;
    return (
      <Line
        key={i}
        x1={cx + outerR * Math.sin(rad)}
        y1={cy - outerR * Math.cos(rad)}
        x2={cx + innerR * Math.sin(rad)}
        y2={cy - innerR * Math.cos(rad)}
        stroke="#333333"
        strokeWidth={isCardinal ? 2.6 : 1.4}
        strokeLinecap="round"
      />
    );
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        {ticks}
      </Svg>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: size * 0.32, fontFamily: "Helvetica-Bold" }}>WY</Text>
      </View>
    </View>
  );
}

export type InvoicePdfData = {
  invoiceNumber: string;
  createdAt: Date;
  amount: number;
  orders: {
    orderNumber: string;
    watchBrand: string;
    watchModel: string | null;
    watchInfo: string | null;
    items: { description: string; amount: number }[];
  }[];
  customer: {
    name: string;
    phone: string;
    address: string | null;
  };
  diagnosis: string | null;
  note: string | null;
};

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <WatchLogo />
            </View>
            <View>
              <Text style={styles.shopName}>WatchYongs</Text>
              <Text style={styles.muted}>Jasa Reparasi Jam Tangan</Text>
            </View>
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
            <Text>No. Order: {data.orders.map((o) => o.orderNumber).join(", ")}</Text>
            <Text>Tanggal: {data.createdAt.toLocaleDateString("id-ID")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian per Jam</Text>
          {data.orders.map((order) => {
            const watchLabel = `${order.watchBrand}${order.watchModel ? ` ${order.watchModel}` : ""}`;
            const subtotal = order.items.reduce((sum, item) => sum + item.amount, 0);
            return (
              <View key={order.orderNumber} style={styles.watchBlock}>
                <Text style={styles.watchHeader}>
                  {order.orderNumber} — {watchLabel}
                </Text>
                {order.watchInfo && (
                  <Text style={[styles.muted, { marginBottom: 4 }]}>{order.watchInfo}</Text>
                )}
                <View style={styles.table}>
                  {order.items.map((item, index) => (
                    <View style={styles.tableRow} key={index}>
                      <Text>{item.description}</Text>
                      <Text>{formatRupiah(item.amount)}</Text>
                    </View>
                  ))}
                  <View style={styles.subtotalRow}>
                    <Text style={styles.subtotalLabel}>Subtotal</Text>
                    <Text style={styles.subtotalValue}>{formatRupiah(subtotal)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          {data.diagnosis && <Text style={styles.muted}>{data.diagnosis}</Text>}
        </View>

        <View>
          {data.note && <Text style={[styles.muted, { marginBottom: 4 }]}>Catatan: {data.note}</Text>}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatRupiah(data.amount)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Terima kasih telah mempercayakan jam Anda kepada WatchYongs.</Text>
        </View>

        <View style={styles.terms}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsItem}>
            1. Minor Repairs guaranteed for 1 week, Overhauls for 1 month & Battery for 6 month.
          </Text>
          <Text style={styles.termsItem}>
            2. Watchyongs guarantee is rendered void under the following Human Error & Accidental
            Damage: Any damage resulting from the owner.
          </Text>
          <Text style={styles.termsItem}>
            3. Unclaimed Property Policy It is the responsibility of the customer to collect their
            timepiece in 3 months after invoice realased.
          </Text>
          <Text style={styles.termsItem}>
            4. By leaving your timepieces, you acknowledge that you have read, understood, and
            agreed to these terms.
          </Text>
        </View>

        <View style={styles.payment}>
          <View>
            <Text style={styles.paymentLabel}>Please make payment to</Text>
            <Text style={styles.paymentName}>Alessandro Galvani</Text>
            <Text style={styles.paymentLabel}>Bank Central Asia (BCA)</Text>
            <Text style={styles.paymentLabel}>2440291697</Text>
          </View>
          <Text style={styles.thankYou}>Thank you!</Text>
        </View>

        <Text style={styles.social}>IG @watchyongs</Text>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
