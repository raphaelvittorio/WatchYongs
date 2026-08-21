import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isValidTransition, OrderStatus } from "@/lib/status";

const bodySchema = z.object({
  toStatus: z.enum([
    OrderStatus.INTAKE,
    OrderStatus.ASSESSMENT,
    OrderStatus.ONPROCESS,
    OrderStatus.COMPLETED,
    OrderStatus.PICKED,
    OrderStatus.REJECTED,
  ]),
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
    return NextResponse.json({ error: "Status tujuan tidak valid." }, { status: 400 });
  }

  const order = await prisma.repairOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  const { toStatus, note } = parsed.data;
  if (!isValidTransition(order.status, toStatus)) {
    return NextResponse.json(
      { error: `Tidak bisa pindah dari status ${order.status} ke ${toStatus}.` },
      { status: 400 },
    );
  }

  const now = new Date();
  const updated = await prisma.repairOrder.update({
    where: { id },
    data: {
      status: toStatus,
      statusChangedAt: now,
      statusHistory: {
        create: { fromStatus: order.status, toStatus, note, changedAt: now },
      },
    },
  });

  return NextResponse.json(updated);
}
