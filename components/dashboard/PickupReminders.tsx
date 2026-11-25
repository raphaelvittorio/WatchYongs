import Link from "next/link";
import { BellRing } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsappActions } from "@/components/orders/WhatsappActions";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { daysSince, type OrderStatus } from "@/lib/status";

type OverdueOrder = {
  id: string;
  orderNumber: string;
  watchBrand: string;
  watchModel: string | null;
  status: OrderStatus;
  statusChangedAt: Date;
  customer: { name: string; phone: string };
  branch?: { name: string };
};

export function PickupReminders({ orders }: { orders: OverdueOrder[] }) {
  if (orders.length === 0) return null;

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/15 ring-inset">
            <BellRing className="size-4" />
          </span>
          Pengingat Pengambilan
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 tabular-nums">
            {orders.length}
          </span>
        </CardTitle>
        <CardDescription>
          Jam sudah selesai tapi belum diambil — kirim reminder WhatsApp dari sini.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[26rem] divide-y overflow-y-auto">
        {orders.map((order) => (
          <div key={order.id} className="flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <UserAvatar name={order.customer.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{order.customer.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <Link href={`/orders/${order.id}`} className="font-mono hover:underline">
                    {order.orderNumber}
                  </Link>{" "}
                  · {order.watchBrand}
                  {order.watchModel ? ` ${order.watchModel}` : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                {daysSince(order.statusChangedAt)} hari
              </span>
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
