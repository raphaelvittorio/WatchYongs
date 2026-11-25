import "server-only";

import type { Branch } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

// Ruko Golden 8 sudah memakai counter `order_number` / `invoice_number` sejak
// sebelum ada cabang. Baris itu sengaja tidak di-rename: selama build
// Hostinger kode lama masih melayani request, dan kalau counter-nya hilang
// kode lama akan mulai lagi dari 1 dan menimpa PDF invoice yang asli.
const LEGACY_BRANCH_ID = "golden8";

function counterId(base: string, branchId: string) {
  return branchId === LEGACY_BRANCH_ID ? base : `${base}:${branchId}`;
}

async function nextSequence(id: string): Promise<number> {
  const counter = await prisma.counter.upsert({
    where: { id },
    create: { id, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

export async function generateOrderNumber(
  branch: Pick<Branch, "id" | "orderPrefix">,
): Promise<string> {
  const value = await nextSequence(counterId("order_number", branch.id));
  return `${branch.orderPrefix}-${String(value).padStart(4, "0")}`;
}

export async function generateInvoiceNumber(
  branch: Pick<Branch, "id" | "invoicePrefix">,
): Promise<string> {
  const value = await nextSequence(counterId("invoice_number", branch.id));
  return `${branch.invoicePrefix}-${String(value).padStart(4, "0")}`;
}
