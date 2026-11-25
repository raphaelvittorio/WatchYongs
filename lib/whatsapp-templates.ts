type OrderInfo = {
  orderNumber: string;
  watchBrand: string;
  watchModel: string | null;
  branch?: { name: string };
};

// Dengan 2 toko, customer perlu tahu jamnya diambil di cabang mana.
function pickupPlace(order: OrderInfo) {
  return order.branch ? `di toko WatchYongs ${order.branch.name}` : "di toko";
}

type CustomerInfo = {
  name: string;
};

function watchLabel(order: OrderInfo) {
  return `${order.watchBrand}${order.watchModel ? ` ${order.watchModel}` : ""}`;
}

export function buildAssessmentReadyMessage(opts: {
  order: OrderInfo;
  customer: CustomerInfo;
  estimatedPrice: number;
  diagnosis: string | null;
}) {
  const price = `Rp ${opts.estimatedPrice.toLocaleString("id-ID")}`;
  return [
    `Halo ${opts.customer.name},`,
    ``,
    `Jam ${watchLabel(opts.order)} (${opts.order.orderNumber}) sudah kami periksa.`,
    opts.diagnosis ? `Diagnosa: ${opts.diagnosis}` : null,
    `Estimasi biaya perbaikan: ${price}`,
    ``,
    `Mohon konfirmasi apakah bisa kami lanjutkan prosesnya. Terima kasih 🙏`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function buildCompletedMessage(opts: { order: OrderInfo; customer: CustomerInfo }) {
  return [
    `Halo ${opts.customer.name},`,
    ``,
    `Jam ${watchLabel(opts.order)} (${opts.order.orderNumber}) sudah selesai kami perbaiki dan bisa diambil ${pickupPlace(opts.order)}.`,
    ``,
    `Mohon diambil dalam 3 minggu dari sekarang. Setelah itu akan dikenakan biaya penyimpanan. Terima kasih 🙏`,
  ].join("\n");
}

export function buildOverdueReminderMessage(opts: {
  order: OrderInfo;
  customer: CustomerInfo;
  daysOverdue: number;
}) {
  const nearStorageFee = opts.daysOverdue >= 21;
  return [
    `Halo ${opts.customer.name},`,
    ``,
    `Jam ${watchLabel(opts.order)} (${opts.order.orderNumber}) sudah selesai ${opts.daysOverdue} hari dan belum diambil ${pickupPlace(opts.order)}.`,
    nearStorageFee
      ? `Karena sudah lebih dari 3 minggu, mohon segera diambil untuk menghindari biaya penyimpanan.`
      : `Mohon diambil sebelum 3 minggu sejak selesai untuk menghindari biaya penyimpanan.`,
    ``,
    `Terima kasih 🙏`,
  ].join("\n");
}

// Indonesian numbers are stored in local format (e.g. "0812-3456-7890").
// wa.me links need digits only with the country code, no leading 0.
export function normalizePhoneForWhatsapp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

export function buildWhatsappLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhoneForWhatsapp(phone)}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_TEMPLATE_LABELS: Record<string, string> = {
  assessment: "Estimasi Biaya",
  completed: "Notifikasi Selesai",
  overdue: "Reminder Pengambilan",
};
