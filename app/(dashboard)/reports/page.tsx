import Link from "next/link";
import { Wallet, CalendarDays, Receipt, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SERVICE_TYPE_LABELS, ServiceType, type ServiceType as ServiceTypeType } from "@/lib/status";

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

export default async function ReportsPage() {
  const invoices = await prisma.invoice.findMany({
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
  const maxMonthRevenue = Math.max(1, ...monthBuckets.map((b) => b.revenue));

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Laporan</h1>
          <p className="text-sm text-muted-foreground">Ringkasan pendapatan dari invoice.</p>
        </div>
        <Button variant="outline" render={<a href="/api/reports/export" />} nativeButton={false}>
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Pendapatan" value={formatRupiah(totalRevenue)} icon={Wallet} />
        <StatCard
          label="Pendapatan Bulan Ini"
          value={formatRupiah(thisMonthRevenue)}
          icon={CalendarDays}
        />
        <StatCard label="Jumlah Invoice" value={invoiceCount} icon={Receipt} />
        <StatCard label="Rata-rata per Invoice" value={formatRupiah(avgInvoice)} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pendapatan per Bulan (12 bulan terakhir)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {monthBuckets.map((bucket) => (
            <div key={bucket.key} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-muted-foreground">{monthLabel(bucket.key)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(bucket.revenue / maxMonthRevenue) * 100}%` }}
                />
              </div>
              <span className="w-32 shrink-0 text-right text-muted-foreground">
                {formatRupiah(bucket.revenue)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Berdasarkan Jenis Service</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis Service</TableHead>
                <TableHead className="text-right">Jumlah Order</TableHead>
                <TableHead className="text-right">Total Pendapatan</TableHead>
                <TableHead className="text-right">Rata-rata Waktu (Intake → Selesai)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceBreakdown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada invoice.
                  </TableCell>
                </TableRow>
              )}
              {serviceBreakdown.map((row) => (
                <TableRow key={row.label}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">{formatRupiah(row.revenue)}</TableCell>
                  <TableCell className="text-right">{row.avgDays} hari</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Semua Invoice {invoices.length > 50 && `(50 terbaru dari ${invoices.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Invoice</TableHead>
                <TableHead>No. Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Jenis Service</TableHead>
                <TableHead className="text-right">Tanggal</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada invoice.
                  </TableCell>
                </TableRow>
              )}
              {invoices.slice(0, 50).map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link
                      href={`/orders/${invoice.orders[0]?.id}`}
                      className="font-medium hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.orders.map((o) => o.orderNumber).join(", ")}</TableCell>
                  <TableCell>{invoice.orders[0]?.customer.name}</TableCell>
                  <TableCell>
                    {invoice.orders[0]?.serviceType
                      ? SERVICE_TYPE_LABELS[invoice.orders[0].serviceType]
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {invoice.createdAt.toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">{formatRupiah(invoice.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
