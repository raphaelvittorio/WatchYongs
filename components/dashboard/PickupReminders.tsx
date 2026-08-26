import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsappActions } from "@/components/orders/WhatsappActions";
import { daysSince, type OrderStatus } from "@/lib/status";

type OverdueOrder = {
  id: string;
  orderNumber: string;
  watchBrand: string;
  watchModel: string | null;
  status: OrderStatus;
  statusChangedAt: Date;
  customer: { name: string; phone: string };
};

export function PickupReminders({ orders }: { orders: OverdueOrder[] }) {
  if (orders.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pengingat Pengambilan ({orders.length})</CardTitle>
        <CardDescription>
          Order selesai yang belum diambil — kirim reminder WhatsApp langsung dari sini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-sm last:border-0 last:pb-0"
          >
            <div>
              <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                {order.orderNumber}
              </Link>
              <p className="text-muted-foreground">
                {order.watchBrand}
                {order.watchModel ? ` ${order.watchModel}` : ""} · {order.customer.name} · sudah{" "}
                {daysSince(order.statusChangedAt)} hari
              </p>
            </div>
            <WhatsappActions
              orderId={order.id}
              order={order}
              customer={order.customer}
              assessment={null}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
