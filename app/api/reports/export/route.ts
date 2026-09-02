import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { SERVICE_TYPE_LABELS } from "@/lib/status";

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    include: { orders: { include: { customer: true }, orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = invoices.map((invoice) => {
    const mainOrder = invoice.orders[0];
    return [
      invoice.invoiceNumber,
      invoice.orders.map((o) => o.orderNumber).join(", "),
      mainOrder.customer.name,
      invoice.orders
        .map((o) => `${o.watchBrand}${o.watchModel ? ` ${o.watchModel}` : ""}`)
        .join(", "),
      mainOrder.serviceType ? SERVICE_TYPE_LABELS[mainOrder.serviceType] : "",
      invoice.createdAt.toLocaleDateString("id-ID"),
      invoice.amount,
    ];
  });

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
