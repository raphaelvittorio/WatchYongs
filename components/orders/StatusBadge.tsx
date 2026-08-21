import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_BADGE_CLASS, type OrderStatus } from "@/lib/status";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={STATUS_BADGE_CLASS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
