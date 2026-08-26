import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { SERVICE_TYPE_LABELS } from "@/lib/status";

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    include: { repairOrder: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = invoices.map((invoice) => [
    invoice.invoiceNumber,
    invoice.repairOrder.orderNumber,
    invoice.repairOrder.customer.name,
    `${invoice.repairOrder.watchBrand}${invoice.repairOrder.watchModel ? ` ${invoice.repairOrder.watchModel}` : ""}`,
    invoice.repairOrder.serviceType ? SERVICE_TYPE_LABELS[invoice.repairOrder.serviceType] : "",
    invoice.createdAt.toLocaleDateString("id-ID"),
    invoice.amount,
  ]);

  const csv =
    "﻿" +
    toCsv(
      ["No. Invoice", "No. Order", "Customer", "Jam", "Jenis Service", "Tanggal", "Jumlah (Rp)"],
      rows,
    );

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="watchyoung-invoices-${timestamp}.csv"`,
    },
  });
}
