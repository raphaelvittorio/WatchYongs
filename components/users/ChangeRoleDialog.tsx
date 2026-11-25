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
import { BranchField } from "@/components/branches/BranchField";
import { ROLE_LABELS, type Role } from "@/lib/roles";

export function ChangeRoleDialog({
  userId,
  userName,
  role,
  branchId,
  branches,
}: {
  userId: string;
  userName: string;
  role: Role;
  branchId: string | null;
  branches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Role>(role);
  const [branchValue, setBranchValue] = useState(branchId ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isStaff = value === "STAFF";
  const unchanged = value === role && (!isStaff || branchValue === (branchId ?? ""));
  const missingBranch = isStaff && !branchValue;

  async function onSubmit() {
    setSubmitting(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: value, ...(isStaff && { branchId: branchValue }) }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal mengubah role.");
      return;
    }

    const branchName = branches.find((b) => b.id === branchValue)?.name;
    toast.success(
      `${userName} sekarang ${ROLE_LABELS[value]}${isStaff && branchName ? ` di ${branchName}` : ""}.`,
    );
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValue(role);
          setBranchValue(branchId ?? "");
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ShieldCheck className="h-4 w-4" />
        Role & Cabang
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Role & Cabang — {userName}</DialogTitle>
          <DialogDescription>
            Perubahan langsung berlaku di request berikutnya, tanpa perlu login ulang.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Role</Label>
          <RoleSelect value={value} onChange={setValue} />
        </div>
        {isStaff && (
          <BranchField
            id={`branch-${userId}`}
            options={{ branches, defaultBranchId: null, locked: false }}
            value={branchValue}
            onChange={setBranchValue}
            hint="Staff hanya bisa melihat dan mengubah data cabang ini."
          />
        )}
        <DialogFooter>
          <Button disabled={submitting || unchanged || missingBranch} onClick={onSubmit}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
