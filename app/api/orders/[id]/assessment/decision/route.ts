import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { OrderStatus, AssessmentDecision } from "@/lib/status";

const bodySchema = z.object({
  decision: z.enum([AssessmentDecision.APPROVED, AssessmentDecision.REJECTED]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Keputusan tidak valid." }, { status: 400 });
  }

  const order = await prisma.repairOrder.findUnique({
    where: { id },
    include: { assessment: true },
  });
  if (!order || !order.assessment) {
    return NextResponse.json(
      { error: "Assessment belum diisi untuk order ini." },
      { status: 400 },
    );
  }

  const { decision } = parsed.data;
  const now = new Date();
  const nextStatus =
    decision === AssessmentDecision.APPROVED
      ? OrderStatus.ONPROCESS
      : OrderStatus.REJECTED;

  await prisma.$transaction([
    prisma.assessment.update({
      where: { repairOrderId: id },
      data: { decision, decidedAt: now },
    }),
    prisma.repairOrder.update({
      where: { id },
      data: {
        status: nextStatus,
        statusChangedAt: now,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: nextStatus,
            changedAt: now,
            note:
              decision === AssessmentDecision.APPROVED
                ? "Customer setuju estimasi biaya."
                : "Customer menolak estimasi biaya.",
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
