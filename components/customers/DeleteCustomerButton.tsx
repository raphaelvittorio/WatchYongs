"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

export function DeleteCustomerButton({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menghapus customer.");
      return false;
    }
    toast.success(`Customer ${customerName} berhasil dihapus.`);
    router.push("/customers");
    router.refresh();
    return true;
  }

  return (
    <ConfirmDeleteDialog
      trigger={
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4" />
          Hapus Customer
        </Button>
      }
      title="Hapus Customer?"
      description={`Customer ${customerName} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
      onConfirm={handleDelete}
    />
  );
}
