"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ALLOWED_TRANSITIONS, STATUS_LABELS, type OrderStatus } from "@/lib/status";

export function StatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const nextOptions = ALLOWED_TRANSITIONS[status];

  if (nextOptions.length === 0) return null;

  async function move(toStatus: OrderStatus) {
    setLoading(toStatus);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStatus }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal update status.");
      return;
    }
    toast.success(`Status diubah ke ${STATUS_LABELS[toStatus]}.`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {nextOptions.map((next) => (
        <Button
          key={next}
          variant={next === "REJECTED" ? "destructive" : "default"}
          size="sm"
          disabled={loading !== null}
          onClick={() => move(next)}
        >
          {loading === next ? "Memproses..." : `→ ${STATUS_LABELS[next]}`}
        </Button>
      ))}
    </div>
  );
}
