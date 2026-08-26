"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

export function DeleteOrderButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menghapus order.");
      return false;
    }
    toast.success(`Order ${orderNumber} berhasil dihapus.`);
    router.push("/orders");
    router.refresh();
    return true;
  }

  return (
    <ConfirmDeleteDialog
      trigger={
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4" />
          Hapus Order
        </Button>
      }
      title="Hapus Order?"
      description={`Order ${orderNumber} beserta foto, riwayat status, dan assessment-nya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
      onConfirm={handleDelete}
    />
  );
}
