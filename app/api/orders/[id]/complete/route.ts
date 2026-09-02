import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@/lib/status";
import { ensureInvoice } from "@/lib/invoice";

export const runtime = "nodejs";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        amount: z.coerce.number().int().nonnegative(),
        repairOrderId: z.string().optional(),
      }),
    )
    .min(1),
  note: z.string().optional(),
  additionalOrderIds: z.array(z.string()).optional(),
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

  const { items, note, additionalOrderIds } = parsed.data;

  let additionalOrders: (typeof order)[] = [];
  if (additionalOrderIds && additionalOrderIds.length > 0) {
    additionalOrders = await prisma.repairOrder.findMany({
      where: { id: { in: additionalOrderIds } },
    });
    const invalid = additionalOrders.some(
      (o) => o.status !== OrderStatus.ONPROCESS || o.customerId !== order.customerId,
    );
    if (invalid || additionalOrders.length !== additionalOrderIds.length) {
      return NextResponse.json(
        { error: "Order tambahan tidak valid — harus milik customer yang sama dan masih On Process." },
        { status: 400 },
      );
    }
  }

  const allOrders = [order, ...additionalOrders];
  const allOrderIds = new Set(allOrders.map((o) => o.id));
  const invalidItem = items.some(
    (item) => item.repairOrderId && !allOrderIds.has(item.repairOrderId),
  );
  if (invalidItem) {
    return NextResponse.json(
      { error: "Item mengacu ke order yang tidak termasuk dalam invoice ini." },
      { status: 400 },
    );
  }

  const now = new Date();

  await prisma.$transaction(
    allOrders.map((o) =>
      prisma.repairOrder.update({
        where: { id: o.id },
        data: {
          status: OrderStatus.COMPLETED,
          statusChangedAt: now,
          statusHistory: {
            create: {
              fromStatus: o.status,
              toStatus: OrderStatus.COMPLETED,
              note,
              changedAt: now,
            },
          },
        },
      }),
    ),
  );

  await ensureInvoice(
    allOrders.map((o) => o.id),
    { items, note },
  );

  const updated = await prisma.repairOrder.findUnique({ where: { id } });
  return NextResponse.json(updated);
}
