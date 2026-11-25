"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type BranchOption = { id: string; name: string };

const ALL = "all";

/**
 * Master: pilih cabang yang ditampilkan (atau semua). Staff: chip terkunci
 * berisi cabangnya — data cabang lain memang tidak bisa dibuka.
 */
export function BranchSwitcher({
  branches,
  current,
  canSwitch,
}: {
  branches: BranchOption[];
  current: BranchOption | null;
  canSwitch: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!canSwitch) {
    return (
      <div
        title="Akun staff hanya bisa mengakses data cabangnya"
        className="flex h-10 items-center gap-2 rounded-xl bg-sidebar-accent/70 px-3 text-sm font-semibold text-white"
      >
        <MapPin className="size-4 shrink-0 text-brand" />
        <span className="truncate">{current?.name}</span>
        <Lock className="ml-auto size-3.5 shrink-0 text-sidebar-muted" />
      </div>
    );
  }

  const labels = new Map(branches.map((b) => [b.id, b.name]));
  labels.set(ALL, "Semua cabang");

  function handleChange(next: string | null) {
    if (!next) return;
    startTransition(async () => {
      const res = await fetch("/api/branch-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: next }),
      });
      if (!res.ok) {
        toast.error("Gagal mengganti cabang.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      <p className="px-1 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
        Cabang
      </p>
      <Select value={current?.id ?? ALL} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger
          aria-label="Pilih cabang"
          className={cn(
            "h-10 w-full rounded-xl border-sidebar-border bg-sidebar-accent/60 text-sm font-semibold text-white hover:bg-sidebar-accent",
            isPending && "opacity-70",
          )}
        >
          <MapPin className="size-4 shrink-0 text-brand" />
          {/* Function child: tanpa ini Base UI menampilkan id mentah sampai
              dropdown pernah dibuka sekali. */}
          <SelectValue>{(value: string) => labels.get(value) ?? value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Semua cabang</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
