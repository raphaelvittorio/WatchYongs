import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/order-number";
import { generateInvoicePdf } from "@/lib/invoice-pdf";

export async function ensureInvoice(
  orderIds: string[],
  opts?: {
    items?: { description: string; amount: number; repairOrderId?: string | null }[];
    note?: string;
  },
) {
  const orders = await prisma.repairOrder.findMany({
    where: { id: { in: orderIds } },
    include: { customer: true, assessment: true },
  });
  const mainOrder = orders[0];

  const items =
    opts?.items && opts.items.length > 0
      ? opts.items
      : orders.map((order) => ({
          description: `Jasa Service - ${order.watchBrand}`,
          amount: order.assessment?.estimatedPrice ?? 0,
          repairOrderId: order.id,
        }));
  const amount = items.reduce((sum, item) => sum + item.amount, 0);
  const note = opts?.note?.trim() || null;
  const invoiceNumber = await generateInvoiceNumber();
  const createdAt = new Date();

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    createdAt,
    amount,
    note,
    orders: orders.map((order) => ({
      orderNumber: order.orderNumber,
      watchBrand: order.watchBrand,
      watchModel: order.watchModel,
      watchInfo: order.watchInfo,
      items: items
        .filter((item) => item.repairOrderId === order.id)
        .map((item) => ({ description: item.description, amount: item.amount })),
    })),
    customer: {
      name: mainOrder.customer.name,
      phone: mainOrder.customer.phone,
      address: mainOrder.customer.address,
    },
    diagnosis: mainOrder.assessment?.diagnosis ?? null,
  });

  const uploadDir = path.join(process.cwd(), "public", "uploads", "invoices");
  await mkdir(uploadDir, { recursive: true });
  const filename = `invoice-${invoiceNumber}.pdf`;
  await writeFile(path.join(uploadDir, filename), pdfBuffer);

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      amount,
      note,
      createdAt,
      pdfPath: `/uploads/invoices/${filename}`,
      items: {
        create: items.map((item, index) => ({
          description: item.description,
          amount: item.amount,
          repairOrderId: item.repairOrderId ?? null,
          sortOrder: index,
        })),
      },
      orders: { connect: orderIds.map((id) => ({ id })) },
    },
  });
}
