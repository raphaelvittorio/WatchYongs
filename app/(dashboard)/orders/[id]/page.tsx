import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  daysSince,
  defaultPhotoStageFor,
  STATUS_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/status";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.repairOrder.findUnique({
    where: { id },
    include: {
      customer: true,
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
          where: { customerId: order.customerId, status: "ONPROCESS", id: { not: order.id } },
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {order.watchBrand}
            {order.watchModel ? ` ${order.watchModel}` : ""} · {order.customer.name} (
            {order.customer.phone})
            {order.customer.ownerAge ? ` · ${order.customer.ownerAge} th` : ""}
            {order.customer.ownerCharacter ? ` · ${order.customer.ownerCharacter}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Sudah {daysSince(order.statusChangedAt)} hari di status{" "}
            {STATUS_LABELS[order.status]}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/orders/${order.id}/kartu-kerja`} />} nativeButton={false}>
            <ClipboardList className="h-4 w-4" />
            Kartu Kerja
          </Button>
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
          {!order.invoice && (
            <DeleteOrderButton orderId={order.id} orderNumber={order.orderNumber} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Info Jam</CardTitle>
              <EditOrderDialog orderId={order.id} order={order} />
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.serviceType && (
                <div>
                  <p className="text-muted-foreground">Jenis Service</p>
                  <p>{SERVICE_TYPE_LABELS[order.serviceType]}</p>
                </div>
              )}
              {order.watchInfo && (
                <div>
                  <p className="text-muted-foreground">Info Jam</p>
                  <p>{order.watchInfo}</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-muted-foreground">Keterangan Masalah</p>
                  <p>{order.notes}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-3">
                <p className="text-muted-foreground">Foto</p>
                <PhotoGallery photos={order.photos} />
                <AddPhotoForm
                  key={order.status}
                  orderId={order.id}
                  defaultStage={defaultPhotoStageFor(order.status)}
                />
              </div>
            </CardContent>
          </Card>

          <AssessmentCard orderId={order.id} assessment={order.assessment} />

          {order.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {otherInvoiceOrders.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Invoice ini juga mencakup:{" "}
                    {otherInvoiceOrders.map((o) => o.orderNumber).join(", ")}
                  </p>
                )}
                {ownInvoiceItems.length > 0 && (
                  <div className="space-y-1">
                    {ownInvoiceItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{item.description}</span>
                        <span>Rp {item.amount.toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <p className="font-medium">{order.invoice.invoiceNumber}</p>
                    <p className="text-muted-foreground">
                      Rp {order.invoice.amount.toLocaleString("id-ID")} ·{" "}
                      {order.invoice.createdAt.toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <a
                    href={order.invoice.pdfPath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Lihat PDF
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          <WhatsappHistoryCard logs={order.whatsappLogs} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist Pengerjaan</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkChecklist status={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
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
