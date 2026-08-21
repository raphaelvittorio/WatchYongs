import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@/lib/status";

const bodySchema = z.object({
  estimatedPrice: z.coerce.number().int().nonnegative(),
  diagnosis: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estimasi harga tidak valid." }, { status: 400 });
  }

  const order = await prisma.repairOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  const { estimatedPrice, diagnosis } = parsed.data;

  const assessment = await prisma.assessment.upsert({
    where: { repairOrderId: id },
    create: { repairOrderId: id, estimatedPrice, diagnosis },
    update: { estimatedPrice, diagnosis },
  });

  // Move the order into the Assessment stage once an estimate is on file,
  // if it's still sitting at Intake.
  if (order.status === OrderStatus.INTAKE) {
    const now = new Date();
    await prisma.repairOrder.update({
      where: { id },
      data: {
        status: OrderStatus.ASSESSMENT,
        statusChangedAt: now,
        statusHistory: {
          create: {
            fromStatus: OrderStatus.INTAKE,
            toStatus: OrderStatus.ASSESSMENT,
            changedAt: now,
            note: "Assessment diisi.",
          },
        },
      },
    });
  }

  return NextResponse.json(assessment);
}
