import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { PhotoGallery } from "@/components/orders/PhotoGallery";
import { AddPhotoForm } from "@/components/orders/AddPhotoForm";
import { StatusActions } from "@/components/orders/StatusActions";
import { AssessmentCard } from "@/components/orders/AssessmentCard";
import { EditOrderDialog } from "@/components/orders/EditOrderDialog";
import { WhatsappActions } from "@/components/orders/WhatsappActions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { daysSince, defaultPhotoStageFor, STATUS_LABELS } from "@/lib/status";

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
      invoice: true,
    },
  });

  if (!order) {
    notFound();
  }

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
          </p>
          <p className="text-xs text-muted-foreground">
            Sudah {daysSince(order.statusChangedAt)} hari di status{" "}
            {STATUS_LABELS[order.status]}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WhatsappActions
            order={order}
            customer={order.customer}
            assessment={order.assessment}
          />
          <StatusActions orderId={order.id} status={order.status} />
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
              {order.watchInfo && (
                <div>
                  <p className="text-muted-foreground">Info Jam</p>
                  <p>{order.watchInfo}</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-muted-foreground">Catatan Kondisi Awal</p>
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
              <CardContent className="flex items-center justify-between text-sm">
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
              </CardContent>
            </Card>
          )}
        </div>

        <div>
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
