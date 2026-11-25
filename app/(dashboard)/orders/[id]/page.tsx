import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  FileText,
  Phone,
  Receipt,
  Watch,
  Camera,
  ListChecks,
  History,
  ArrowUpRight,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireScopePage, scopedOrderWhere } from "@/lib/branch";
import { isMaster } from "@/lib/roles";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { OrderProgress } from "@/components/orders/OrderProgress";
import { PhotoGallery } from "@/components/orders/PhotoGallery";
import { AddPhotoForm } from "@/components/orders/AddPhotoForm";
import { StatusActions } from "@/components/orders/StatusActions";
import { AssessmentCard } from "@/components/orders/AssessmentCard";
import { EditOrderDialog } from "@/components/orders/EditOrderDialog";
import { WhatsappActions } from "@/components/orders/WhatsappActions";
import { WhatsappHistoryCard } from "@/components/orders/WhatsappHistoryCard";
import { CompleteOrderDialog } from "@/components/orders/CompleteOrderDialog";
import { WorkChecklist } from "@/components/orders/WorkChecklist";
import { DeleteOrderButton } from "@/components/orders/DeleteOrderButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { BranchBadge } from "@/components/shared/BranchBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatLongDate, formatRupiah, formatShortDate } from "@/lib/format";
import {
  daysSince,
  defaultPhotoStageFor,
  STATUS_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/status";

function InfoField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm whitespace-pre-line">{children}</dd>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await requireScopePage();
  const { user } = scope;
  // Order cabang lain → null → 404 (staff). Master bisa membuka semua cabang.
  const order = await prisma.repairOrder.findFirst({
    where: scopedOrderWhere(scope, id),
    include: {
      customer: true,
      branch: true,
      photos: { orderBy: { uploadedAt: "asc" } },
      statusHistory: { orderBy: { changedAt: "asc" } },
      assessment: true,
      invoice: {
        include: {
          items: { orderBy: { sortOrder: "asc" } },
          orders: { orderBy: { orderNumber: "asc" } },
        },
      },
      whatsappLogs: { orderBy: { sentAt: "desc" } },
    },
  });

  if (!order) {
    notFound();
  }

  const siblingOrdersRaw =
    order.status === "ONPROCESS"
      ? await prisma.repairOrder.findMany({
          // Invoice gabungan hanya untuk order di cabang yang sama.
          where: {
            customerId: order.customerId,
            branchId: order.branchId,
            status: "ONPROCESS",
            id: { not: order.id },
          },
          include: { assessment: true },
        })
      : [];
  const siblingOrders = siblingOrdersRaw.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    watchBrand: o.watchBrand,
    watchModel: o.watchModel,
    estimatedPrice: o.assessment?.estimatedPrice ?? 0,
  }));

  const otherInvoiceOrders = order.invoice?.orders.filter((o) => o.id !== order.id) ?? [];

  const ownInvoiceItems = order.invoice
    ? (() => {
        const tagged = order.invoice.items.filter((item) => item.repairOrderId === order.id);
        return tagged.length > 0 || order.invoice.items.length === 0
          ? tagged
          : order.invoice.items;
      })()
    : [];

  const watchLabel = `${order.watchBrand}${order.watchModel ? ` ${order.watchModel}` : ""}`;
  const daysInStatus = daysSince(order.statusChangedAt);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/orders", label: "Order Reparasi" }}
        title={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono">{order.orderNumber}</span>
            <StatusBadge status={order.status} className="h-7 px-3 text-[13px]" />
            <BranchBadge branch={order.branch} className="px-2.5 py-1 text-xs" />
          </span>
        }
        description={
          <>
            <span className="font-medium text-foreground">{watchLabel}</span> ·{" "}
            {order.customer.name} · masuk {formatLongDate(order.createdAt)}
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/orders/${order.id}/kartu-kerja`} />}
              nativeButton={false}
            >
              <ClipboardList />
              Kartu Kerja
            </Button>
            {!order.invoice && isMaster(user) && (
              <DeleteOrderButton orderId={order.id} orderNumber={order.orderNumber} />
            )}
          </>
        }
      />

      {/* Progres + aksi utama untuk status saat ini. */}
      <Card>
        <CardContent className="space-y-5">
          <OrderProgress status={order.status} history={order.statusHistory} />
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Sudah <span className="font-semibold text-foreground">{daysInStatus} hari</span> di
              status {STATUS_LABELS[order.status]}.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <WhatsappActions
                orderId={order.id}
                order={order}
                customer={order.customer}
                assessment={order.assessment}
              />
              {order.status === "ONPROCESS" && (
                <CompleteOrderDialog
                  orderId={order.id}
                  estimatedPrice={order.assessment?.estimatedPrice ?? 0}
                  customerName={order.customer.name}
                  mainOrderNumber={order.orderNumber}
                  mainWatchBrand={order.watchBrand}
                  mainWatchModel={order.watchModel}
                  siblingOrders={siblingOrders}
                />
              )}
              <StatusActions orderId={order.id} status={order.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Watch className="size-4 text-muted-foreground" />
                Info Jam
              </CardTitle>
              <CardAction>
                <EditOrderDialog orderId={order.id} order={order} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <InfoField label="Merk & Model">
                  <span className="font-semibold">{watchLabel}</span>
                </InfoField>
                <InfoField label="Jenis Service">
                  {order.serviceType ? (
                    <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
                      {SERVICE_TYPE_LABELS[order.serviceType]}
                    </span>
                  ) : (
                    "—"
                  )}
                </InfoField>
                <InfoField label="Info Jam (serial, kelengkapan)" className="sm:col-span-2">
                  {order.watchInfo || "—"}
                </InfoField>
                <InfoField label="Keterangan Masalah" className="sm:col-span-2">
                  {order.notes ? (
                    <span className="block rounded-xl bg-amber-50/70 px-3 py-2.5 ring-1 ring-amber-600/10">
                      {order.notes}
                    </span>
                  ) : (
                    "—"
                  )}
                </InfoField>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="size-4 text-muted-foreground" />
                Foto
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                  {order.photos.length}
                </span>
              </CardTitle>
              <CardDescription>Dokumentasi kondisi jam per tahap pengerjaan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PhotoGallery photos={order.photos} />
              <AddPhotoForm
                key={order.status}
                orderId={order.id}
                defaultStage={defaultPhotoStageFor(order.status)}
              />
            </CardContent>
          </Card>

          <AssessmentCard orderId={order.id} assessment={order.assessment} />

          {order.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="size-4 text-muted-foreground" />
                  Invoice
                  <span className="font-mono text-sm font-medium text-muted-foreground">
                    {order.invoice.invoiceNumber}
                  </span>
                </CardTitle>
                <CardDescription>
                  Dibuat {formatLongDate(order.invoice.createdAt)}
                  {otherInvoiceOrders.length > 0 &&
                    ` · juga mencakup ${otherInvoiceOrders.map((o) => o.orderNumber).join(", ")}`}
                </CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<a href={order.invoice.pdfPath} target="_blank" rel="noreferrer" />}
                    nativeButton={false}
                  >
                    <FileText />
                    Lihat PDF
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                {ownInvoiceItems.length > 0 && (
                  <ul className="divide-y rounded-xl border">
                    {ownInvoiceItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                      >
                        <span className="text-muted-foreground">{item.description}</span>
                        <span className="font-medium tabular-nums">
                          {formatRupiah(item.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground">
                  <span className="text-sm text-primary-foreground/70">
                    Total Invoice{otherInvoiceOrders.length > 0 ? " (gabungan)" : ""}
                  </span>
                  <span className="text-lg font-bold text-brand tabular-nums">
                    {formatRupiah(order.invoice.amount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <WhatsappHistoryCard logs={order.whatsappLogs} />
        </div>

        {/* Kolom samping: di layar sedang tampil 2 kolom di bawah konten utama. */}
        <div className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Buka profil customer"
                  render={<Link href={`/customers/${order.customer.id}`} />}
                  nativeButton={false}
                >
                  <ArrowUpRight />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/customers/${order.customer.id}`} className="flex items-center gap-3">
                <UserAvatar name={order.customer.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold hover:underline">{order.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Customer sejak {formatShortDate(order.customer.createdAt)}
                  </p>
                </div>
              </Link>
              <a
                href={`tel:${order.customer.phone}`}
                className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Phone className="size-4 text-muted-foreground" />
                {order.customer.phone}
              </a>
              {(order.customer.ownerAge || order.customer.ownerCharacter) && (
                <div className="flex flex-wrap gap-1.5">
                  {order.customer.ownerAge && (
                    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                      {order.customer.ownerAge} tahun
                    </span>
                  )}
                  {order.customer.ownerCharacter && (
                    <span className="rounded-md bg-brand-soft px-2 py-1 text-xs font-medium text-brand-foreground">
                      {order.customer.ownerCharacter}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-4 text-muted-foreground" />
                Checklist Pengerjaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkChecklist status={order.status} />
            </CardContent>
          </Card>

          <Card className="md:col-span-2 xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4 text-muted-foreground" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline history={order.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
