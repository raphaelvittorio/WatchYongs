import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReceiptPdf } from "@/lib/receipt-pdf";
import { requireScopeApi, scopedOrderWhere } from "@/lib/branch";

export const runtime = "nodejs";

// Tanda terima selalu di-render ulang dari data order, jadi tidak perlu
// disimpan ke disk seperti invoice — isinya ikut kalau order-nya diedit.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { scope, denied: noScope } = await requireScopeApi();
  if (noScope) return noScope;
  const order = await prisma.repairOrder.findFirst({
    where: scopedOrderWhere(scope, id),
    include: { customer: true, branch: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  const pdf = await generateReceiptPdf({
    branch: { name: order.branch.name, address: order.branch.address, phone: order.branch.phone },
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
