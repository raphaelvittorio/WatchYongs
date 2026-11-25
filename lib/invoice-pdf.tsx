import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type { ReactNode } from "react";

import type { PdfBranch } from "@/lib/pdf-logo";

/*
 * Tampilan invoice meniru template Google Sheets WatchYongs
 * ("Watchyongs_Invoice_.xlsx" yang diekspor ke PDF A4). Semua angka di file
 * ini diukur langsung dari PDF referensi itu, dalam point, dihitung dari pojok
 * kiri atas halaman. Logo dan wordmark adalah gambar asli dari PDF tersebut.
 */

const ASSETS_DIR = path.join(process.cwd(), "assets", "pdf");

/** Gambar dikirim sebagai buffer: react-pdf menganggap path "C:\…" sebagai URL. */
function readAsset(name: string) {
  return { data: readFileSync(path.join(ASSETS_DIR, name)), format: "png" as const };
}

Font.register({
  family: "Open Sans",
  fonts: [
    { src: path.join(ASSETS_DIR, "fonts", "OpenSans-Regular.ttf") },
    { src: path.join(ASSETS_DIR, "fonts", "OpenSans-Bold.ttf"), fontWeight: "bold" },
  ],
});

const LINE_COLOR = "#e7e6e6";
const LINE_WIDTH = 0.7;
const ACCENT = "#b29570";
const TIME_ZONE = "Asia/Jakarta";

/** Ascent Open Sans (2189/2048 em): jarak dari atas kotak teks ke baseline. */
const OPEN_SANS_ASCENT = 2189 / 2048;
/** Jarak atas kotak teks ke baseline untuk Helvetica di react-pdf (0.9 em). */
const HELVETICA_ASCENT = 0.9;

/** Batas kiri kolom spreadsheet. Teks di dalam sel menjorok CELL_INSET. */
const COL = {
  no: 123.68,
  description: 164.01,
  date: 230.06,
  qty: 364.94,
  price: 431.0,
  end: 497.74,
};
const CELL_INSET = 2.78;
const textX = (col: number) => col + CELL_INSET;

const SIZE = { label: 7.22, small: 6.32, row: 8.13, number: 7.13, terms: 5.42, rowNo: 7.3 };

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 22.25;
/** Template Sheets selalu punya 11 baris item; 8 pertama bergaris penuh. */
const TEMPLATE_ROWS = 11;
const FULL_WIDTH_ROWS = 8;
/** Jarak baseline teks baris ke garis bawah barisnya. */
const ROW_BASELINE_TO_LINE = 2.73;

const TERMS = [
  "1. Minor Repairs guaranteed for 1 week, Overhauls for 1 month & Battery for 6 month.",
  "2. Watchyongs guarantee is rendered void under the following Human Error & Accidental Damage: Any damage resulting from the owner.",
  "3. Unclaimed Property Policy It is the responsibility of the customer to collect their timepiece in 3 months after invoice realased.",
  "4. By leaving your timepieces, you acknowledge that you have read, understood, and agreed to these terms. ",
];

export type InvoicePdfData = {
  branch: PdfBranch;
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

/** "IDR190,000" */
function formatIdr(amount: number) {
  return `IDR${amount.toLocaleString("en-US")}`;
}

/** "23rd Nov 2026", tanggal WIB. */
function formatInvoiceDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = Number(get("day"));
  const tens = day % 100;
  const suffix =
    tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ?? "th";
  return `${day}${suffix} ${get("month")} ${get("year")}`;
}

/** "62 81806159209" untuk nomor 0818…, 62818…, atau +62 818…. */
function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) return `62 ${digits.slice(2)}`;
  if (digits.startsWith("0")) return `62 ${digits.slice(1)}`;
  return phone;
}

/** "Tissot - Swiss Battery Replacement"; merek tidak diulang kalau sudah tertulis. */
function itemLabel(watchBrand: string, description: string) {
  const brand = watchBrand.trim();
  if (!brand || description.toLowerCase().includes(brand.toLowerCase())) return description;
  return `${brand} - ${description}`;
}

/** Teks satu baris yang baseline-nya tepat di (x, baseline) dalam View induknya. */
function At({
  x,
  baseline,
  size,
  bold,
  color,
  width,
  helvetica,
  children,
}: {
  x: number;
  baseline: number;
  size: number;
  bold?: boolean;
  color?: string;
  width?: number;
  helvetica?: boolean;
  children: ReactNode;
}) {
  const ascent = helvetica ? HELVETICA_ASCENT : OPEN_SANS_ASCENT;
  return (
    <Text
      style={{
        position: "absolute",
        left: x,
        top: baseline - ascent * size,
        width,
        fontSize: size,
        fontFamily: helvetica ? "Helvetica" : "Open Sans",
        fontWeight: bold ? "bold" : "normal",
        color,
      }}
    >
      {children}
    </Text>
  );
}

/** Garis abu-abu tipis yang titik tengahnya di y. */
function HLine({ from, to, y }: { from: number; to: number; y: number }) {
  return (
    <View
      style={{
        position: "absolute",
        left: from,
        width: to - from,
        top: y - LINE_WIDTH / 2,
        height: LINE_WIDTH,
        backgroundColor: LINE_COLOR,
      }}
    />
  );
}

/** Blok setinggi `height` yang isinya diposisikan dengan koordinat lokal. */
function Block({ height, marginTop, children }: { height: number; marginTop?: number; children: ReactNode }) {
  return <View style={{ position: "relative", height, marginTop }}>{children}</View>;
}

type Row = { no: number; description: string; amount: number } | null;

/** Satu baris tabel: tinggi minimal ROW_HEIGHT, teks rata bawah seperti di Sheets. */
function TableRow({ row, lineFrom }: { row: Row; lineFrom: number }) {
  const cell = { fontSize: SIZE.row, fontFamily: "Open Sans" } as const;
  return (
    <View
      wrap={false}
      style={{
        position: "relative",
        minHeight: ROW_HEIGHT,
        flexDirection: "row",
        alignItems: "flex-end",
        // Bawah kotak teks (baseline + descent) berhenti tepat di atas garis.
        paddingBottom: ROW_BASELINE_TO_LINE - SIZE.row * (600 / 2048),
      }}
    >
      {row && (
        <>
          <Text style={{ ...cell, fontSize: SIZE.rowNo, marginLeft: textX(COL.no), width: COL.description - textX(COL.no) }}>
            {row.no}
          </Text>
          <Text style={{ ...cell, marginLeft: CELL_INSET, width: COL.qty - COL.description - CELL_INSET }}>
            {row.description}
          </Text>
          <Text style={{ ...cell, marginLeft: CELL_INSET, width: COL.price - COL.qty - CELL_INSET }}>1</Text>
          <Text style={{ ...cell, marginLeft: CELL_INSET, width: COL.end - COL.price - CELL_INSET }}>
            {formatIdr(row.amount)}
          </Text>
        </>
      )}
      <View
        style={{
          position: "absolute",
          left: lineFrom,
          width: COL.end - lineFrom,
          bottom: -LINE_WIDTH / 2,
          height: LINE_WIDTH,
          backgroundColor: LINE_COLOR,
        }}
      />
    </View>
  );
}

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const items = data.orders.flatMap((order) =>
    order.items.map((item) => ({
      description: itemLabel(order.watchBrand, item.description),
      amount: item.amount,
    })),
  );
  const rowCount = Math.max(items.length, TEMPLATE_ROWS);
  const rows: Row[] = Array.from({ length: rowCount }, (_, i) =>
    items[i] ? { no: i + 1, ...items[i] } : null,
  );

  return (
    <Document title={`Invoice ${data.invoiceNumber}`} author="Watchyongs">
      {/* paddingTop hanya untuk halaman lanjutan (item banyak); di halaman 1
          dibatalkan oleh marginTop negatif blok kepala. */}
      <Page
        size="A4"
        style={{ fontFamily: "Open Sans", color: "#000000", paddingTop: PAGE_MARGIN, paddingBottom: PAGE_MARGIN }}
      >
        {/* Kepala: logo, wordmark, Billed to / Invoice Date / Invoice Number.
            Koordinat di blok ini = koordinat halaman. Berakhir di garis y=302.56. */}
        <Block height={302.56} marginTop={-PAGE_MARGIN}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image react-pdf tidak punya prop alt */}
          <Image
            src={readAsset("invoice-mark.png")}
            style={{ position: "absolute", left: 28.43, top: 56.09, width: 49.36, height: 103.6 }}
          />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image react-pdf tidak punya prop alt */}
          <Image
            src={readAsset("invoice-wordmark.png")}
            style={{ position: "absolute", left: 367.03, top: 73.47, width: 118.2, height: 9.73 }}
          />

          <At x={textX(COL.no)} baseline={229.98} size={SIZE.label}>Billed to</At>
          <At x={textX(COL.date)} baseline={229.98} size={SIZE.label}>Invoice Date</At>
          <At x={textX(COL.qty)} baseline={229.98} size={SIZE.label}>Invoice Number</At>
          <HLine from={COL.no} to={COL.end} y={246.24} />

          <View
            style={{
              position: "absolute",
              left: textX(COL.no),
              top: 258.38 - OPEN_SANS_ASCENT * SIZE.label,
              width: COL.date - textX(COL.no) - 4,
            }}
          >
            <Text style={{ fontSize: SIZE.label }}>{data.customer.name}</Text>
            <Text style={{ fontSize: SIZE.small, marginTop: 0.7 }}>{formatPhone(data.customer.phone)}</Text>
          </View>
          <At x={textX(COL.date)} baseline={255.7} size={SIZE.label}>
            {formatInvoiceDate(data.createdAt)}
          </At>
          <At x={textX(COL.qty)} baseline={258.97} size={SIZE.number} helvetica>
            {data.invoiceNumber}
          </At>
          <HLine from={COL.no} to={COL.end} y={302.56} />
        </Block>

        {/* Header tabel: 302.56 → 326.20 */}
        <Block height={326.2 - 302.56}>
          <At x={textX(COL.no)} baseline={323.47 - 302.56} size={SIZE.row}>No</At>
          <At x={textX(COL.description)} baseline={323.47 - 302.56} size={SIZE.row}>Description</At>
          <At x={textX(COL.qty)} baseline={323.47 - 302.56} size={SIZE.row}>Qty</At>
          <At x={textX(COL.price)} baseline={323.47 - 302.56} size={SIZE.row}>Price</At>
          <HLine from={COL.no} to={COL.end} y={326.2 - 302.56} />
        </Block>

        {rows.map((row, i) => (
          <TableRow
            key={i}
            row={row}
            lineFrom={row || i < FULL_WIDTH_ROWS ? COL.no : COL.description}
          />
        ))}

        <View wrap={false}>
          <Block height={ROW_HEIGHT}>
            <At x={textX(COL.qty)} baseline={ROW_HEIGHT - ROW_BASELINE_TO_LINE} size={SIZE.row}>Total</At>
            <At x={textX(COL.price)} baseline={ROW_HEIGHT - ROW_BASELINE_TO_LINE} size={SIZE.row}>
              {formatIdr(data.amount)}
            </At>
            <HLine from={COL.price} to={COL.end} y={ROW_HEIGHT} />
          </Block>
          <Block height={ROW_HEIGHT}>
            <HLine from={COL.price} to={COL.end} y={ROW_HEIGHT} />
          </Block>
        </View>

        {data.note && (
          <View style={{ marginLeft: textX(COL.no), width: COL.end - textX(COL.no), marginTop: 8 }}>
            <Text style={{ fontSize: SIZE.small }}>Note : {data.note}</Text>
          </View>
        )}

        {/* Terms & pembayaran, mulai dari garis terakhir (y=615.43). */}
        <View wrap={false}>
          <Block height={700 - 615.43}>
            <At x={textX(COL.no)} baseline={628.53 - 615.43} size={SIZE.terms}>Terms & Conditions :</At>
            {TERMS.map((term, i) => (
              <At key={i} x={textX(COL.no)} baseline={641.04 - 615.43 + i * 14.765} size={SIZE.terms}>
                {term}
              </At>
            ))}
          </Block>
          <Block height={80}>
            <At x={textX(COL.no)} baseline={719.45 - 700} size={SIZE.label}>Please make payment to</At>
            <At x={textX(COL.no)} baseline={734.05 - 700} size={SIZE.label}>Alessandro Galvani</At>
            <At x={textX(COL.no)} baseline={747.26 - 700} size={SIZE.label}>Bank Central Asia (BCA)</At>
            <At x={textX(COL.no)} baseline={759.08 - 700} size={SIZE.label}>2440291697</At>
            <At x={textX(COL.price)} baseline={735.02 - 700} size={SIZE.row} bold>Thank you!</At>
            <At x={20.09} baseline={770.63 - 700} size={SIZE.small} color={ACCENT}>IG @watchyongs</At>
          </Block>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
