import Link from "next/link";
import {
  ClipboardList,
  Search,
  Wrench,
  CheckCircle2,
  PackageCheck,
  XCircle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertList, type AlertItem } from "@/components/dashboard/AlertList";
import { PickupReminders } from "@/components/dashboard/PickupReminders";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderCardList } from "@/components/orders/OrderCardList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { daysAgo, daysSince, type OrderStatus } from "@/lib/status";

const ONPROCESS_ALERT_DAYS = 14;
const COMPLETED_ALERT_DAYS = 7;
const STORAGE_FEE_DAYS = 21; // diagram's "Weekly Reminder Max 3 Week" rule

export default async function DashboardPage() {
  const onProcessThreshold = daysAgo(ONPROCESS_ALERT_DAYS);
  const completedThreshold = daysAgo(COMPLETED_ALERT_DAYS);

  const [statusCounts, onProcessOverdue, completedOverdue, recentOrders] =
    await Promise.all([
      prisma.repairOrder.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.repairOrder.findMany({
        where: { status: "ONPROCESS", statusChangedAt: { lte: onProcessThreshold } },
        include: { customer: true },
        orderBy: { statusChangedAt: "asc" },
      }),
      prisma.repairOrder.findMany({
        where: { status: "COMPLETED", statusChangedAt: { lte: completedThreshold } },
        include: { customer: true },
        orderBy: { statusChangedAt: "asc" },
      }),
      prisma.repairOrder.findMany({
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const countFor = (status: OrderStatus) =>
    statusCounts.find((s) => s.status === status)?._count._all ?? 0;

  const alerts: AlertItem[] = [
    ...onProcessOverdue.map((order) => ({
      id: order.id,
      href: `/orders/${order.id}`,
      title: `${order.orderNumber} · ${order.watchBrand} (${order.customer.name})`,
      description: `Sudah ${daysSince(order.statusChangedAt)} hari di On Process. Perlu action?`,
    })),
    ...completedOverdue.map((order) => {
      const overdueDays = daysSince(order.statusChangedAt);
      const description =
        overdueDays >= STORAGE_FEE_DAYS
          ? `Sudah selesai ${overdueDays} hari (>3 minggu) — kena biaya penyimpanan.`
          : `Sudah selesai ${overdueDays} hari, belum diambil.`;
      return {
        id: order.id,
        href: `/orders/${order.id}`,
        title: `${order.orderNumber} · ${order.watchBrand} (${order.customer.name})`,
        description,
      };
    }),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan order reparasi jam saat ini.
          </p>
        </div>
        <Button
          render={<Link href="/orders/new" />}
          nativeButton={false}
          className="w-full sm:w-auto"
        >
          + Intake Baru
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Intake" value={countFor("INTAKE")} icon={ClipboardList} />
        <StatCard label="Assessment" value={countFor("ASSESSMENT")} icon={Search} />
        <StatCard label="On Process" value={countFor("ONPROCESS")} icon={Wrench} />
        <StatCard label="Completed" value={countFor("COMPLETED")} icon={CheckCircle2} />
        <StatCard label="Sudah Diambil" value={countFor("PICKED")} icon={PackageCheck} />
        <StatCard label="Ditolak" value={countFor("REJECTED")} icon={XCircle} />
      </div>

      <AlertList items={alerts} />

      <PickupReminders orders={completedOverdue} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderCardList
            className="md:hidden"
            orders={recentOrders}
            emptyLabel="Belum ada order."
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
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada order.
                    </TableCell>
                  </TableRow>
                )}
                {recentOrders.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
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
        </CardContent>
      </Card>
    </div>
  );
}
