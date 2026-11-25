import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { BranchBadge } from "@/components/shared/BranchBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/format";
import { daysSince, SERVICE_TYPE_LABELS, type OrderStatus, type ServiceType } from "@/lib/status";

export type OrderTableRow = {
  id: string;
  orderNumber: string;
  watchBrand: string;
  watchModel: string | null;
  serviceType: ServiceType | null;
  status: OrderStatus;
  statusChangedAt: Date;
  createdAt: Date;
  customer?: { name: string; phone: string };
  branch?: { id: string; name: string };
};

/** Tabel order versi desktop. Seluruh baris bisa diklik (stretched link). */
export function OrderTable({
  orders,
  showCustomer = true,
  showBranch = false,
  emptyLabel,
}: {
  orders: OrderTableRow[];
  showCustomer?: boolean;
  /** Kolom cabang — untuk master yang sedang melihat semua cabang. */
  showBranch?: boolean;
  emptyLabel: string;
}) {
  const columnCount = 4 + (showCustomer ? 1 : 0) + (showBranch ? 1 : 0);
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Order</TableHead>
          {showCustomer && <TableHead>Customer</TableHead>}
          <TableHead>Jam</TableHead>
          {showBranch && <TableHead>Cabang</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Buka</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columnCount}
              className="py-10 text-center text-muted-foreground"
            >
              {emptyLabel}
            </TableCell>
          </TableRow>
        )}
        {orders.map((order) => (
          <TableRow key={order.id} className="group relative cursor-pointer">
            <TableCell>
              <Link
                href={`/orders/${order.id}`}
                className="font-mono text-[13px] font-semibold after:absolute after:inset-0 after:content-['']"
              >
                {order.orderNumber}
              </Link>
              <p className="text-xs text-muted-foreground">{formatShortDate(order.createdAt)}</p>
            </TableCell>
            {showCustomer && (
              <TableCell>
                {order.customer && (
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={order.customer.name} size="sm" />
                    <div className="min-w-0">
                      <p className="max-w-48 truncate font-medium">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                    </div>
                  </div>
                )}
              </TableCell>
            )}
            <TableCell>
              <p className="max-w-56 truncate font-medium">
                {order.watchBrand}
                {order.watchModel ? ` ${order.watchModel}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.serviceType ? SERVICE_TYPE_LABELS[order.serviceType] : "—"}
              </p>
            </TableCell>
            {showBranch && (
              <TableCell>{order.branch && <BranchBadge branch={order.branch} />}</TableCell>
            )}
            <TableCell>
              <StatusBadge status={order.status} />
              <p className="mt-1 text-xs text-muted-foreground">
                {daysSince(order.statusChangedAt)} hari di status ini
              </p>
            </TableCell>
            <TableCell>
              <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
