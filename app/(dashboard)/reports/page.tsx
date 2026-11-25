import Link from "next/link";
import {
  Wallet,
  CalendarDays,
  Receipt,
  TrendingUp,
  Download,
  ChevronRight,
  FileText,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireMasterPage } from "@/lib/auth";
import { branchLabel, filterWhere, requireScopePage } from "@/lib/branch";
import { BranchBadge } from "@/components/shared/BranchBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { MonthlyRevenueChart } from "@/components/reports/MonthlyRevenueChart";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah, formatShortDate } from "@/lib/format";
import { SERVICE_TYPE_LABELS, ServiceType, type ServiceType as ServiceTypeType } from "@/lib/status";

export const metadata = { title: "Laporan" };

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthDate(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export default async function ReportsPage() {
  await requireMasterPage();
  const scope = await requireScopePage();
  const allBranches = scope.filterBranchId === null;

  // Ikut pilihan cabang di sidebar; "Semua cabang" menambah rincian per cabang.
  const invoices = await prisma.invoice.findMany({
    where: filterWhere(scope),
    include: {
      orders: { include: { customer: true }, orderBy: { createdAt: "asc" } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const now = new Date();
  const thisMonthKey = monthKey(now);
  const thisMonthRevenue = invoices
    .filter((inv) => monthKey(inv.createdAt) === thisMonthKey)
    .reduce((sum, inv) => sum + inv.amount, 0);
  const invoiceCount = invoices.length;
  const avgInvoice = invoiceCount > 0 ? Math.round(totalRevenue / invoiceCount) : 0;

  const monthBuckets: { key: string; revenue: number; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push({ key: monthKey(d), revenue: 0, count: 0 });
  }
  const bucketByKey = new Map(monthBuckets.map((b) => [b.key, b]));
  for (const inv of invoices) {
    const bucket = bucketByKey.get(monthKey(inv.createdAt));
    if (bucket) {
      bucket.revenue += inv.amount;
      bucket.count += 1;
    }
  }

  // Item invoice sekarang ditandai per-order (repairOrderId), jadi revenue per order bisa dihitung
  // akurat dari item yang benar-benar milik order itu. Invoice lama (dibuat sebelum item ditandai
  // per-order) tidak punya tanda itu sama sekali — untuk kasus itu saja, fallback ke atribusi lama
  // (seluruh nilai invoice dianggap milik order pertama/earliest createdAt).
  const orderRevenues = invoices.flatMap((inv) => {
    const isTagged = inv.items.some((item) => item.repairOrderId !== null);
    if (isTagged) {
      return inv.orders.map((order) => ({
        order,
        revenue: inv.items
          .filter((item) => item.repairOrderId === order.id)
          .reduce((sum, item) => sum + item.amount, 0),
        invoiceCreatedAt: inv.createdAt,
      }));
    }
    const firstOrder = inv.orders[0];
    return firstOrder
      ? [{ order: firstOrder, revenue: inv.amount, invoiceCreatedAt: inv.createdAt }]
      : [];
  });

  const serviceTypeKeys = [...Object.values(ServiceType), null] as (ServiceTypeType | null)[];
  const serviceBreakdown = serviceTypeKeys
    .map((type) => {
      const matching = orderRevenues.filter((r) => r.order.serviceType === type);
      if (matching.length === 0) return null;
      const revenue = matching.reduce((sum, r) => sum + r.revenue, 0);
      const avgDays =
        matching.reduce((sum, r) => {
          const days =
            (r.invoiceCreatedAt.getTime() - r.order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / matching.length;
      return {
        label: type ? SERVICE_TYPE_LABELS[type] : "Tidak diketahui",
        count: matching.length,
        revenue,
        avgDays: Math.round(avgDays * 10) / 10,
      };
    })
    .filter((row) => row !== null);

  const chartBuckets = monthBuckets.map((b) => ({
    ...b,
    label: monthDate(b.key).toLocaleDateString("id-ID", { month: "short" }),
    fullLabel: monthDate(b.key).toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
  }));
  const yearRevenue = monthBuckets.reduce((sum, b) => sum + b.revenue, 0);
  const serviceRevenueTotal = serviceBreakdown.reduce((sum, row) => sum + row.revenue, 0);
  const thisMonthCount = bucketByKey.get(thisMonthKey)?.count ?? 0;

  const branchBreakdown = scope.branches.map((branch) => {
    const branchInvoices = invoices.filter((inv) => inv.branchId === branch.id);
    const revenue = branchInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const monthRevenue = branchInvoices
      .filter((inv) => monthKey(inv.createdAt) === thisMonthKey)
      .reduce((sum, inv) => sum + inv.amount, 0);
    return { branch, count: branchInvoices.length, revenue, monthRevenue };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description={`${branchLabel(scope.branch)} · ringkasan pendapatan dari invoice yang sudah diterbitkan.`}
        actions={
          <Button variant="outline" render={<a href="/api/reports/export" />} nativeButton={false}>
            <Download />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Pendapatan"
          value={formatRupiah(totalRevenue)}
          icon={Wallet}
          hint="Sepanjang waktu"
          highlight
        />
        <StatCard
          label="Bulan Ini"
          value={formatRupiah(thisMonthRevenue)}
          icon={CalendarDays}
          tone="brand"
          hint={`${thisMonthCount} invoice`}
        />
        <StatCard
          label="Jumlah Invoice"
          value={invoiceCount}
          icon={Receipt}
          tone="sky"
          hint="Total diterbitkan"
        />
        <StatCard
          label="Rata-rata / Invoice"
          value={formatRupiah(avgInvoice)}
          icon={TrendingUp}
          tone="emerald"
          hint="Nilai rata-rata"
        />
      </div>

      {allBranches && (
        <Card>
          <CardHeader>
            <CardTitle>Per Cabang</CardTitle>
            <CardDescription>Pilih cabang di sidebar untuk melihat laporan satu cabang saja.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {branchBreakdown.map((row) => {
              const share = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={row.branch.id} className="space-y-2.5 rounded-xl border p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <BranchBadge branch={row.branch} />
                    <p className="text-xs font-medium text-muted-foreground tabular-nums">
                      {Math.round(share)}% pendapatan
                    </p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Invoice</dt>
                      <dd className="font-semibold tabular-nums">{row.count}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Total</dt>
                      <dd className="font-semibold break-words tabular-nums">
                        {formatRupiah(row.revenue)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Bulan ini</dt>
                      <dd className="font-semibold break-words tabular-nums">
                        {formatRupiah(row.monthRevenue)}
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Pendapatan per Bulan</CardTitle>
            <CardDescription>
              12 bulan terakhir ·{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatRupiah(yearRevenue)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyRevenueChart buckets={chartBuckets} currentKey={thisMonthKey} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Berdasarkan Jenis Service</CardTitle>
            <CardDescription>Rata-rata waktu dihitung dari intake sampai invoice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceBreakdown.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada invoice.</p>
            )}
            {serviceBreakdown.map((row) => {
              const share = serviceRevenueTotal > 0 ? (row.revenue / serviceRevenueTotal) * 100 : 0;
              return (
                <div key={row.label} className="space-y-2.5 rounded-xl border p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold">{row.label}</p>
                    <p className="text-xs font-medium text-muted-foreground tabular-nums">
                      {Math.round(share)}% pendapatan
                    </p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Order</dt>
                      <dd className="font-semibold tabular-nums">{row.count}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Pendapatan</dt>
                      <dd className="font-semibold break-words tabular-nums">
                        {formatRupiah(row.revenue)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Rata-rata</dt>
                      <dd className="font-semibold tabular-nums">{row.avgDays} hari</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b pt-4 sm:pt-5">
          <CardTitle>Semua Invoice</CardTitle>
          <CardDescription>
            {invoices.length > 50
              ? `50 terbaru dari ${invoices.length} invoice · lihat semua lewat Export CSV`
              : `${invoices.length} invoice`}
          </CardDescription>
        </CardHeader>

        {invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum ada invoice"
            description="Invoice dibuat otomatis saat order diselesaikan."
          />
        ) : (
          <>
            <ul className="divide-y md:hidden">
              {invoices.slice(0, 50).map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/orders/${invoice.orders[0]?.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-muted"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                      <Receipt className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatRupiah(invoice.amount)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {invoice.orders[0]?.customer.name} ·{" "}
                        {invoice.orders.map((o) => o.orderNumber).join(", ")} ·{" "}
                        {formatShortDate(invoice.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Jenis Service</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.slice(0, 50).map((invoice) => (
                    <TableRow key={invoice.id} className="relative cursor-pointer">
                      <TableCell>
                        <Link
                          href={`/orders/${invoice.orders[0]?.id}`}
                          className="font-mono text-[13px] font-semibold after:absolute after:inset-0 after:content-['']"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {invoice.orders.map((o) => o.orderNumber).join(", ")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.orders[0]?.customer.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.orders[0]?.serviceType
                          ? SERVICE_TYPE_LABELS[invoice.orders[0].serviceType]
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatShortDate(invoice.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatRupiah(invoice.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
