import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  templateType: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data log tidak valid." }, { status: 400 });
  }

  const order = await prisma.repairOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  const log = await prisma.whatsappLog.create({
    data: {
      repairOrderId: id,
      templateType: parsed.data.templateType,
      message: parsed.data.message,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
