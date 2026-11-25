import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { resolveUploadFile } from "@/lib/uploads";
import { prisma } from "@/lib/db";
import { accessWhere, getBranchScope, scopedOrderWhere, type BranchScope } from "@/lib/branch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".pdf": "application/pdf",
};

// File di luar cabang user dianggap tidak ada. Nama file invoice mudah ditebak
// (invoice-INV-0005.pdf), jadi cek login dari middleware saja tidak cukup.
async function canAccess(scope: BranchScope, segments: string[]) {
  const [folder] = segments;
  if (folder === "invoices") {
    const invoice = await prisma.invoice.findFirst({
      where: { pdfPath: `/uploads/${segments.join("/")}`, ...accessWhere(scope) },
      select: { id: true },
    });
    return Boolean(invoice);
  }
  const order = await prisma.repairOrder.findFirst({
    where: scopedOrderWhere(scope, folder),
    select: { id: true },
  });
  return Boolean(order);
}

// Serves uploaded photos and invoice PDFs from UPLOAD_DIR. Login is enforced
// by middleware.ts; the branch check happens here.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const filePath = resolveUploadFile(segments);
  const contentType = filePath && CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!filePath || !contentType) {
    return new Response("Not found", { status: 404 });
  }

  const scope = await getBranchScope();
  if (!scope || !(await canAccess(scope, segments))) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const data = await readFile(filePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
