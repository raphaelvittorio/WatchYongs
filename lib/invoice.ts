import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/order-number";
import { generateInvoicePdf } from "@/lib/invoice-pdf";

export async function ensureInvoice(orderId: string) {
  const existing = await prisma.invoice.findUnique({ where: { repairOrderId: orderId } });
  if (existing) return existing;

  const order = await prisma.repairOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { customer: true, assessment: true },
  });

  const amount = order.assessment?.estimatedPrice ?? 0;
  const invoiceNumber = await generateInvoiceNumber();
  const createdAt = new Date();

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    createdAt,
    amount,
    order: {
      orderNumber: order.orderNumber,
      watchBrand: order.watchBrand,
      watchModel: order.watchModel,
      watchInfo: order.watchInfo,
    },
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      address: order.customer.address,
    },
    diagnosis: order.assessment?.diagnosis ?? null,
  });

  const uploadDir = path.join(process.cwd(), "public", "uploads", orderId);
  await mkdir(uploadDir, { recursive: true });
  const filename = `invoice-${invoiceNumber}.pdf`;
  await writeFile(path.join(uploadDir, filename), pdfBuffer);

  return prisma.invoice.create({
    data: {
      repairOrderId: orderId,
      invoiceNumber,
      amount,
      createdAt,
      pdfPath: `/uploads/${orderId}/${filename}`,
    },
  });
}
