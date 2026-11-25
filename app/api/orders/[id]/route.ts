import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rm } from "node:fs/promises";
import { uploadPath } from "@/lib/uploads";
import { prisma } from "@/lib/db";
import { denyUnlessMaster } from "@/lib/auth";
import { ServiceType } from "@/lib/status";
import { requireScopeApi, scopedOrderWhere } from "@/lib/branch";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { scope, denied: noScope } = await requireScopeApi();
  if (noScope) return noScope;
  const order = await prisma.repairOrder.findFirst({
    where: scopedOrderWhere(scope, id),
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
  const { scope, denied: noScope } = await requireScopeApi();
  if (noScope) return noScope;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data order tidak valid." }, { status: 400 });
  }

  const existing = await prisma.repairOrder.findFirst({ where: scopedOrderWhere(scope, id) });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await denyUnlessMaster();
  if (denied) return denied;

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
    return NextResponse.json(
      { error: "Order dengan invoice tidak bisa dihapus." },
      { status: 400 },
    );
  }

  await prisma.repairOrder.delete({ where: { id } });
  await rm(uploadPath(id), {
    recursive: true,
    force: true,
  });

  return NextResponse.json({ ok: true });
}
