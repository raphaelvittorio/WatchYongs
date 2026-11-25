import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Plus, Search, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isMaster } from "@/lib/roles";
import { OrderCardList } from "@/components/orders/OrderCardList";
import { OrderTable } from "@/components/orders/OrderTable";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  STATUS_DOT_CLASS,
  STATUS_LABELS,
  OrderStatus,
  type OrderStatus as OrderStatusType,
} from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Order Reparasi" };

const STATUS_KEYS = Object.keys(STATUS_LABELS) as OrderStatusType[];

const PAGE_SIZE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page: pageParam } = await searchParams;
  const user = await getCurrentUser();
  const validStatus =
    status && Object.values(OrderStatus).includes(status as OrderStatusType)
      ? (status as OrderStatusType)
      : undefined;
  const page = Math.max(1, Number(pageParam) || 1);

  const searchWhere = q
    ? {
        OR: [
          { orderNumber: { contains: q } },
          { watchBrand: { contains: q } },
          { customer: { name: { contains: q } } },
        ],
      }
    : {};

  const where = { status: validStatus, ...searchWhere };

  const [orders, total, statusCounts] = await Promise.all([
    prisma.repairOrder.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.repairOrder.count({ where }),
    // Jumlah per status mengikuti kata kunci pencarian, supaya angka di tab
    // selalu cocok dengan hasil yang akan muncul kalau tab itu diklik.
    prisma.repairOrder.groupBy({ by: ["status"], where: searchWhere, _count: { _all: true } }),
  ]);

  const countFor = (s: OrderStatusType) =>
    statusCounts.find((c) => c.status === s)?._count._all ?? 0;
  const allCount = statusCounts.reduce((sum, c) => sum + c._count._all, 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(opts: { status?: OrderStatusType; page?: number }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (opts.status) params.set("status", opts.status);
    if (opts.page && opts.page > 1) params.set("page", String(opts.page));
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

  const tabs: { key: OrderStatusType | undefined; label: string; count: number }[] = [
    { key: undefined, label: "Semua", count: allCount },
    ...STATUS_KEYS.map((key) => ({ key, label: STATUS_LABELS[key], count: countFor(key) })),
  ];

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Reparasi"
        description={`${total} order${validStatus ? ` · ${STATUS_LABELS[validStatus]}` : ""}${q ? ` · cocok dengan "${q}"` : ""}`}
        actions={
          <>
            {isMaster(user) && (
              <Button variant="outline" render={<a href={exportHref} />} nativeButton={false}>
                <Download />
                Export CSV
              </Button>
            )}
            <Button render={<Link href="/orders/new" />} nativeButton={false}>
              <Plus />
              Intake Baru
            </Button>
          </>
        }
      />

      <Card className="gap-0 py-0">
        <div className="space-y-3 border-b p-4 sm:p-5">
          <form className="flex gap-2" method="get">
            {validStatus && <input type="hidden" name="status" value={validStatus} />}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Cari no. order, merk, atau nama customer..."
                defaultValue={q ?? ""}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Cari
            </Button>
            {q && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Hapus pencarian"
                render={<Link href={buildHref({ status: validStatus })} />}
                nativeButton={false}
              >
                <X />
              </Button>
            )}
          </form>

          {/* Tab status: bisa digeser ke samping di HP. */}
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-1.5">
              {tabs.map((tab) => {
                const active = tab.key === validStatus;
                return (
                  <Link
                    key={tab.key ?? "ALL"}
                    href={buildHref({ status: tab.key })}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                    )}
                  >
                    {tab.key && (
                      <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[tab.key])} />
                    )}
                    {tab.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-xs tabular-nums",
                        active ? "bg-white/15" : "bg-muted",
                      )}
                    >
                      {tab.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <OrderCardList
          className="md:hidden"
          orders={orders}
          emptyLabel="Tidak ada order yang cocok."
        />
        <div className="hidden md:block">
          <OrderTable orders={orders} emptyLabel="Tidak ada order yang cocok." />
        </div>

        {total > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>
              Menampilkan <span className="font-medium text-foreground">{rangeStart}</span>–
              <span className="font-medium text-foreground">{rangeEnd}</span> dari{" "}
              <span className="font-medium text-foreground">{total}</span> order
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={buildHref({ status: validStatus, page: page - 1 })} />}
                    nativeButton={false}
                  >
                    <ChevronLeft />
                    Sebelumnya
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft />
                    Sebelumnya
                  </Button>
                )}
                <span className="px-1 text-xs tabular-nums">
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={buildHref({ status: validStatus, page: page + 1 })} />}
                    nativeButton={false}
                  >
                    Selanjutnya
                    <ChevronRight />
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Selanjutnya
                    <ChevronRight />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
