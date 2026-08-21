import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(order);
}
