import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureInvoice } from "@/lib/invoice";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await prisma.repairOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  const invoice = await ensureInvoice(id);
  return NextResponse.json(invoice, { status: 201 });
}
