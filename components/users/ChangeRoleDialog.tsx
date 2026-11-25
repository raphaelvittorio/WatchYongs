"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RoleSelect } from "@/components/users/RoleSelect";
import { ROLE_LABELS, type Role } from "@/lib/roles";

export function ChangeRoleDialog({
  userId,
  userName,
  role,
}: {
  userId: string;
  userName: string;
  role: Role;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Role>(role);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: value }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal mengubah role.");
      return;
    }

    toast.success(`${userName} sekarang ${ROLE_LABELS[value]}.`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(role);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ShieldCheck className="h-4 w-4" />
        Ubah Role
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Role — {userName}</DialogTitle>
          <DialogDescription>
            Perubahan langsung berlaku di request berikutnya, tanpa perlu login ulang.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Role</Label>
          <RoleSelect value={value} onChange={setValue} />
        </div>
        <DialogFooter>
          <Button disabled={submitting || value === role} onClick={onSubmit}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
