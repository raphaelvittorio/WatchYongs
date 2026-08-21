import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { PhotoGallery } from "@/components/orders/PhotoGallery";
import { StatusActions } from "@/components/orders/StatusActions";
import { AssessmentCard } from "@/components/orders/AssessmentCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { daysSince, STATUS_LABELS } from "@/lib/status";

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
        <StatusActions orderId={order.id} status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Info Jam</CardTitle>
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
              <div>
                <p className="mb-2 text-muted-foreground">Foto</p>
                <PhotoGallery photos={order.photos} />
              </div>
            </CardContent>
          </Card>

          <AssessmentCard orderId={order.id} assessment={order.assessment} />
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
