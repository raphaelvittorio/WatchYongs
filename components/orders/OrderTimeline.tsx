import { STATUS_LABELS, type OrderStatus } from "@/lib/status";

type TimelineEntry = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  changedAt: Date;
};

export function OrderTimeline({ history }: { history: TimelineEntry[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada riwayat status.</p>;
  }

  return (
    <ol className="space-y-4">
      {history.map((entry, idx) => (
        <li key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            {idx < history.length - 1 && (
              <div className="w-px flex-1 bg-border" />
            )}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium">
              {entry.fromStatus ? `${STATUS_LABELS[entry.fromStatus]} → ` : ""}
              {STATUS_LABELS[entry.toStatus]}
            </p>
            {entry.note && (
              <p className="text-sm text-muted-foreground">{entry.note}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {entry.changedAt.toLocaleString("id-ID")}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
