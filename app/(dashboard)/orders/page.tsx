import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderCardList } from "@/components/orders/OrderCardList";
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

const PAGE_SIZE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page: pageParam } = await searchParams;
  const validStatus =
    status && Object.values(OrderStatus).includes(status as OrderStatusType)
      ? (status as OrderStatusType)
      : undefined;
  const page = Math.max(1, Number(pageParam) || 1);

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

  const [orders, total] = await Promise.all([
    prisma.repairOrder.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.repairOrder.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (validStatus) params.set("status", validStatus);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/orders?${qs}` : "/orders";
  }

  const exportHref = (() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (validStatus) params.set("status", validStatus);
    const qs = params.toString();
    return qs ? `/api/orders/export?${qs}` : "/api/orders/export";
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Order Reparasi</h1>
          <p className="text-sm text-muted-foreground">{total} order</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<a href={exportHref} />}
            nativeButton={false}
            className="flex-1 sm:flex-none"
          >
            Export CSV
          </Button>
          <Button
            render={<Link href="/orders/new" />}
            nativeButton={false}
            className="flex-1 sm:flex-none"
          >
            + Intake Baru
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap" method="get">
            <Input
              name="q"
              placeholder="Cari no. order, merk, atau nama customer..."
              defaultValue={q ?? ""}
              className="w-full sm:max-w-xs"
            />
            <div className="flex gap-2">
              <select
                name="status"
                defaultValue={validStatus ?? "ALL"}
                className="h-9 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-base sm:flex-none sm:text-sm"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary" className="shrink-0">
                Filter
              </Button>
            </div>
          </form>

          <OrderCardList
            className="md:hidden"
            orders={orders}
            emptyLabel="Tidak ada order yang cocok."
          />
          <div className="hidden md:block">
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
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={pageHref(page - 1)} />}
                    nativeButton={false}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                )}
                {page < totalPages ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={pageHref(page + 1)} />}
                    nativeButton={false}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
