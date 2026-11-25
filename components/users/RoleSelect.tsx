"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, Role, type Role as RoleValue } from "@/lib/roles";

const ROLES = Object.values(Role);

export function RoleSelect({
  value,
  onChange,
}: {
  value: RoleValue;
  onChange: (role: RoleValue) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Select value={value} onValueChange={(next) => next && onChange(next as RoleValue)}>
        <SelectTrigger className="w-full">
          {/* Function child: tanpa ini Base UI menampilkan "STAFF" mentah
              sampai dropdown pernah dibuka sekali. */}
          <SelectValue>{(v: RoleValue) => ROLE_LABELS[v]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABELS[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[value]}</p>
    </div>
  );
}
