import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReceiptPdf } from "@/lib/receipt-pdf";

export const runtime = "nodejs";

// Tanda terima selalu di-render ulang dari data order, jadi tidak perlu
// disimpan ke disk seperti invoice — isinya ikut kalau order-nya diedit.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await prisma.repairOrder.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  const pdf = await generateReceiptPdf({
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    watchLabel: `${order.watchBrand}${order.watchModel ? ` ${order.watchModel}` : ""}`,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    notes: order.notes,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="tanda-terima-${order.orderNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
