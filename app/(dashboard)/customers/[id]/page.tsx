import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, MapPin, Phone, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { accessWhere, requireScopePage } from "@/lib/branch";
import { isMaster } from "@/lib/roles";
import { OrderCardList } from "@/components/orders/OrderCardList";
import { OrderTable } from "@/components/orders/OrderTable";
import { EditCustomerDialog } from "@/components/customers/EditCustomerDialog";
import { DeleteCustomerButton } from "@/components/customers/DeleteCustomerButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatLongDate, formatShortDate } from "@/lib/format";
import { ACTIVE_STATUSES } from "@/lib/status";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await requireScopePage();
  const { user } = scope;
  // Data customer dipakai bersama semua cabang, tapi staff hanya melihat
  // riwayat order cabangnya sendiri (jumlah order cabang lain pun tidak).
  const isAllBranchView = scope.accessBranchId === null;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      branch: true,
      orders: {
        where: accessWhere(scope),
        include: { branch: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const activeCount = customer.orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const lastOrder = customer.orders[0];

  const stats = [
    { label: "Total Order", value: String(customer.orders.length) },
    { label: "Order Aktif", value: String(activeCount) },
    { label: "Order Terakhir", value: lastOrder ? formatShortDate(lastOrder.createdAt) : "—" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        back={{ href: "/customers", label: "Customer" }}
        title="Profil Customer"
        actions={
          <>
            <EditCustomerDialog customer={customer} />
            {customer.orders.length === 0 && isMaster(user) && (
              <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />
            )}
          </>
        }
      />

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <UserAvatar name={customer.name} size="xl" className="ring-4 ring-card" />
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h2 className="text-xl font-bold break-words">{customer.name}</h2>
              <p className="text-sm text-muted-foreground">
                Customer sejak {formatLongDate(customer.createdAt)} · terdaftar di{" "}
                {customer.branch.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1.5 font-medium hover:underline"
              >
                <Phone className="size-4 text-muted-foreground" />
                {customer.phone}
              </a>
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="inline-flex min-w-0 items-center gap-1.5 hover:underline"
                >
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{customer.email}</span>
                </a>
              )}
              {customer.address && (
                <span className="inline-flex items-start gap-1.5 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  {customer.address}
                </span>
              )}
            </div>
            {(customer.ownerAge || customer.ownerCharacter) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {customer.ownerAge && (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {customer.ownerAge} tahun
                  </span>
                )}
                {customer.ownerCharacter && (
                  <span className="rounded-md bg-brand-soft px-2 py-1 text-xs font-medium text-brand-foreground">
                    {customer.ownerCharacter}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-3 divide-x border-t bg-muted/30">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-3 sm:px-6 sm:py-4">
              <dt className="text-xs font-medium text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-base font-bold tabular-nums sm:text-lg">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b pt-4 sm:pt-5">
          <CardTitle>Riwayat Order</CardTitle>
          <CardDescription>{customer.orders.length} jam pernah diservis.</CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/orders/new" />}
              nativeButton={false}
            >
              <Plus />
              Intake
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <OrderCardList
            className="md:hidden"
            orders={customer.orders}
            emptyLabel="Belum ada order."
            showCustomer={false}
            showBranch={isAllBranchView}
          />
          <div className="hidden md:block">
            <OrderTable
              orders={customer.orders}
              showCustomer={false}
              showBranch={isAllBranchView}
              emptyLabel="Belum ada order."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
