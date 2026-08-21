import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PhotoStage } from "@/lib/status";
import {
  extractPhotoFiles,
  saveUploadedPhotos,
  validatePhotos,
  InvalidPhotoError,
} from "@/lib/photo-upload";

export const runtime = "nodejs";

const VALID_STAGES = new Set(Object.values(PhotoStage));

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await prisma.repairOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  const formData = await request.formData();
  const stageRaw = formData.get("stage")?.toString() ?? PhotoStage.INTAKE;
  const stage = VALID_STAGES.has(stageRaw as (typeof PhotoStage)[keyof typeof PhotoStage])
    ? (stageRaw as (typeof PhotoStage)[keyof typeof PhotoStage])
    : PhotoStage.INTAKE;

  const files = extractPhotoFiles(formData);
  if (files.length === 0) {
    return NextResponse.json({ error: "Tidak ada foto yang diupload." }, { status: 400 });
  }

  try {
    validatePhotos(files);
    const created = await saveUploadedPhotos(order.id, files, stage);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidPhotoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
