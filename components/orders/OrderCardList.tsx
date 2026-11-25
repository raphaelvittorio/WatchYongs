import Link from "next/link";
import { ChevronRight, Watch } from "lucide-react";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/status";

export type OrderCardItem = {
  id: string;
  orderNumber: string;
  watchBrand: string;
  watchModel: string | null;
  status: OrderStatus;
  createdAt: Date;
  customer?: { name: string };
  branch?: { id: string; name: string };
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
  showBranch = false,
  className,
}: {
  orders: OrderCardItem[];
  emptyLabel: string;
  showCustomer?: boolean;
  showBranch?: boolean;
  className?: string;
}) {
  if (orders.length === 0) {
    return <EmptyState icon={Watch} title={emptyLabel} className={className} />;
  }

  return (
    <ul className={cn("divide-y", className)}>
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/orders/${order.id}`}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-muted"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Watch className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {order.watchBrand}
                  {order.watchModel ? ` ${order.watchModel}` : ""}
                </span>
                <StatusBadge status={order.status} className="h-5 px-2 text-[11px]" />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                <span className="font-mono">{order.orderNumber}</span>
                {showBranch && order.branch ? ` · ${order.branch.name}` : ""}
                {showCustomer && order.customer ? ` · ${order.customer.name}` : ""}
                {` · ${formatShortDate(order.createdAt)}`}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
