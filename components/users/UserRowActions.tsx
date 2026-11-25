"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog";
import { ChangeRoleDialog } from "@/components/users/ChangeRoleDialog";
import type { Role } from "@/lib/roles";

export function UserRowActions({
  userId,
  userName,
  role,
  isSelf,
  isLastUser,
}: {
  userId: string;
  userName: string;
  role: Role;
  isSelf: boolean;
  isLastUser: boolean;
}) {
  const router = useRouter();

  async function handleDelete() {
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menghapus staff.");
      return false;
    }
    toast.success(`Staff ${userName} berhasil dihapus.`);
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      <ResetPasswordDialog userId={userId} userName={userName} />
      {/* Role sendiri tidak bisa diubah, supaya selalu ada minimal 1 master. */}
      {!isSelf && <ChangeRoleDialog userId={userId} userName={userName} role={role} />}
      {!isSelf && !isLastUser && (
        <ConfirmDeleteDialog
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          }
          title="Hapus Staff?"
          description={`Akun staff ${userName} akan dihapus permanen dan tidak bisa login lagi.`}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
