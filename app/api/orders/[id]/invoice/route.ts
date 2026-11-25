import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureInvoice } from "@/lib/invoice";
import { requireScopeApi, scopedOrderWhere } from "@/lib/branch";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { scope, denied: noScope } = await requireScopeApi();
  if (noScope) return noScope;
  const order = await prisma.repairOrder.findFirst({
    where: scopedOrderWhere(scope, id),
    include: { invoice: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }
  if (order.invoice) {
    return NextResponse.json(order.invoice, { status: 200 });
  }

  const invoice = await ensureInvoice([id]);
  return NextResponse.json(invoice, { status: 201 });
}
