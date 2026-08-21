import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@/lib/status";
import { ensureInvoice } from "@/lib/invoice";

export const runtime = "nodejs";

const bodySchema = z.object({
  finalAmount: z.coerce.number().int().nonnegative(),
  note: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Biaya final tidak valid." }, { status: 400 });
  }

  const order = await prisma.repairOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }
  if (order.status !== OrderStatus.ONPROCESS) {
    return NextResponse.json(
      { error: "Order hanya bisa diselesaikan dari status On Process." },
      { status: 400 },
    );
  }

  const { finalAmount, note } = parsed.data;
  const now = new Date();

  const updated = await prisma.repairOrder.update({
    where: { id },
    data: {
      status: OrderStatus.COMPLETED,
      statusChangedAt: now,
      statusHistory: {
        create: {
          fromStatus: order.status,
          toStatus: OrderStatus.COMPLETED,
          note,
          changedAt: now,
        },
      },
    },
  });

  await ensureInvoice(id, { finalAmount, note });

  return NextResponse.json(updated);
}
