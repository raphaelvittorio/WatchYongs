import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Warna tetap per cabang supaya mudah dibedakan sekilas di daftar campuran.
const BRANCH_TONE: Record<string, string> = {
  golden8: "bg-sky-50 text-sky-700 ring-sky-600/20",
  hampton: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function BranchBadge({
  branch,
  className,
}: {
  branch: { id: string; name: string };
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset",
        BRANCH_TONE[branch.id] ?? "bg-muted text-muted-foreground ring-border",
        className,
      )}
    >
      <MapPin className="size-3 shrink-0" />
      <span className="truncate">{branch.name}</span>
    </span>
  );
}
