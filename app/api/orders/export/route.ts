import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { OrderStatus, STATUS_LABELS, SERVICE_TYPE_LABELS, type OrderStatus as OrderStatusType } from "@/lib/status";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const validStatus =
    status && Object.values(OrderStatus).includes(status as OrderStatusType)
      ? (status as OrderStatusType)
      : undefined;

  const where = {
    status: validStatus,
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q } },
            { watchBrand: { contains: q } },
            { customer: { name: { contains: q } } },
          ],
        }
      : {}),
  };

  const orders = await prisma.repairOrder.findMany({
    where,
    include: { customer: true, invoice: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders.map((order) => [
    order.orderNumber,
    order.customer.name,
    order.customer.phone,
    `${order.watchBrand}${order.watchModel ? ` ${order.watchModel}` : ""}`,
    order.serviceType ? SERVICE_TYPE_LABELS[order.serviceType] : "",
    STATUS_LABELS[order.status],
    order.createdAt.toLocaleDateString("id-ID"),
    order.invoice?.amount ?? "",
  ]);

  const csv =
    "﻿" +
    toCsv(
      [
        "No. Order",
        "Customer",
        "No. HP",
        "Jam",
        "Jenis Service",
        "Status",
        "Tanggal Dibuat",
        "Jumlah Invoice (Rp)",
      ],
      rows,
    );

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="watchyoung-orders-${timestamp}.csv"`,
    },
  });
}
