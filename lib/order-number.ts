import "server-only";

import { prisma } from "@/lib/db";

async function nextSequence(counterId: string): Promise<number> {
  const counter = await prisma.counter.upsert({
    where: { id: counterId },
    create: { id: counterId, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

export async function generateOrderNumber(): Promise<string> {
  const value = await nextSequence("order_number");
  return `WY-${String(value).padStart(4, "0")}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const value = await nextSequence("invoice_number");
  return `INV-${String(value).padStart(4, "0")}`;
}
