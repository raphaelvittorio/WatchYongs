import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/status";

export type OrderCardItem = {
  id: string;
  orderNumber: string;
  watchBrand: string;
  watchModel: string | null;
  status: OrderStatus;
  createdAt: Date;
  customer?: { name: string };
};

/**
 * Versi mobile dari tabel order: satu baris tabel yang lebar diganti kartu
 * yang bisa ditekan, jadi tidak perlu scroll horizontal di layar HP.
 * Dipakai berdampingan dengan <Table> yang di-hide di bawah breakpoint md.
 */
export function OrderCardList({
  orders,
  emptyLabel,
  showCustomer = true,
  className,
}: {
  orders: OrderCardItem[];
  emptyLabel: string;
  showCustomer?: boolean;
  className?: string;
}) {
  if (orders.length === 0) {
    return (
      <p className={cn("py-6 text-center text-sm text-muted-foreground", className)}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className={cn("divide-y", className)}>
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/orders/${order.id}`}
            className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors active:bg-muted"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{order.orderNumber}</span>
                <StatusBadge status={order.status} />
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {order.watchBrand}
                {order.watchModel ? ` ${order.watchModel}` : ""}
                {showCustomer && order.customer ? ` · ${order.customer.name}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.createdAt.toLocaleDateString("id-ID")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
