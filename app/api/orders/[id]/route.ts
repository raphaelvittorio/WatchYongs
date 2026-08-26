import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ServiceType } from "@/lib/status";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await prisma.repairOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      photos: { orderBy: { uploadedAt: "asc" } },
      statusHistory: { orderBy: { changedAt: "asc" } },
      assessment: true,
      invoice: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(order);
}

const patchSchema = z.object({
  watchBrand: z.string().min(1, "Merk jam wajib diisi.").optional(),
  watchModel: z.string().optional(),
  watchInfo: z.string().optional(),
  serviceType: z.enum([ServiceType.BESAR, ServiceType.KECIL]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data order tidak valid." }, { status: 400 });
  }

  const existing = await prisma.repairOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  const { watchBrand, watchModel, watchInfo, serviceType, notes } = parsed.data;
  const updated = await prisma.repairOrder.update({
    where: { id },
    data: {
      watchBrand,
      watchModel: watchModel || null,
      watchInfo: watchInfo || null,
      serviceType,
      notes: notes || null,
    },
  });

  return NextResponse.json(updated);
}
