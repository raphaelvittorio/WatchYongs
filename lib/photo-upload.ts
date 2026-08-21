import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import type { PhotoStage } from "@/lib/status";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
};
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export class InvalidPhotoError extends Error {}

export function extractPhotoFiles(formData: FormData, field = "photos"): File[] {
  return formData
    .getAll(field)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export function validatePhotos(files: File[]) {
  for (const file of files) {
    if (!MIME_EXTENSIONS[file.type]) {
      throw new InvalidPhotoError(
        `Format file "${file.name}" tidak didukung. Gunakan JPG, PNG, WEBP, atau HEIC.`,
      );
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new InvalidPhotoError(`File "${file.name}" terlalu besar (maks 10MB).`);
    }
  }
}

export async function saveUploadedPhotos(
  orderId: string,
  files: File[],
  stage: PhotoStage,
) {
  if (files.length === 0) return [];

  const uploadDir = path.join(process.cwd(), "public", "uploads", orderId);
  await mkdir(uploadDir, { recursive: true });

  const created = [];
  for (const file of files) {
    const filename = `${randomUUID()}${MIME_EXTENSIONS[file.type]}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    const photo = await prisma.photo.create({
      data: {
        repairOrderId: orderId,
        stage,
        path: `/uploads/${orderId}/${filename}`,
      },
    });
    created.push(photo);
  }
  return created;
}
