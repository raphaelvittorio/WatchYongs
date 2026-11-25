"use client";

import { Lock, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BranchFieldOptions = {
  branches: { id: string; name: string }[];
  /** Cabang awal: cabang staff, atau cabang yang sedang dipilih master. */
  defaultBranchId: string | null;
  /** Staff: cabang ikut akun dan tidak bisa diganti. */
  locked: boolean;
};

/**
 * Field "Cabang" untuk data baru (intake, customer, staff). Server tetap
 * memaksa cabang staff — field terkunci ini hanya informasi.
 */
export function BranchField({
  id,
  label = "Cabang",
  options,
  value,
  onChange,
  error,
  hint,
}: {
  id: string;
  label?: string;
  options: BranchFieldOptions;
  value: string;
  onChange: (branchId: string) => void;
  error?: string;
  hint?: string;
}) {
  const names = new Map(options.branches.map((b) => [b.id, b.name]));

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {options.locked ? (
        <div
          id={id}
          className="flex h-9 items-center gap-2 rounded-lg border bg-muted/60 px-3 text-sm font-medium"
        >
          <MapPin className="size-4 text-muted-foreground" />
          {names.get(value) ?? "—"}
          <Lock className="ml-auto size-3.5 text-muted-foreground" />
        </div>
      ) : (
        <Select value={value || null} onValueChange={(next) => next && onChange(next as string)}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Pilih cabang">
              {(v: string | null) => (v ? (names.get(v) ?? v) : "Pilih cabang")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
