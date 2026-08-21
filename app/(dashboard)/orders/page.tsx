import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { STATUS_LABELS, OrderStatus, type OrderStatus as OrderStatusType } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_FILTERS = [
  { value: "ALL", label: "Semua Status" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const validStatus =
    status && Object.values(OrderStatus).includes(status as OrderStatusType)
      ? (status as OrderStatusType)
      : undefined;

  const orders = await prisma.repairOrder.findMany({
    where: {
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
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order Reparasi</h1>
          <p className="text-sm text-muted-foreground">{orders.length} order</p>
        </div>
        <Button render={<Link href="/orders/new" />} nativeButton={false}>
          + Intake Baru
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="mb-4 flex flex-wrap gap-2" method="get">
            <Input
              name="q"
              placeholder="Cari no. order, merk, atau nama customer..."
              defaultValue={q ?? ""}
              className="max-w-xs"
            />
            <select
              name="status"
              defaultValue={validStatus ?? "ALL"}
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Tidak ada order yang cocok.
                  </TableCell>
                </TableRow>
              )}
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>
                    {order.watchBrand}
                    {order.watchModel ? ` ${order.watchModel}` : ""}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {order.createdAt.toLocaleDateString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
