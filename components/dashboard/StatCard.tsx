import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          {label}
        </CardTitle>
        <Icon className={cn("h-4 w-4 shrink-0 text-muted-foreground", className)} />
      </CardHeader>
      <CardContent>
        {/* Nilai rupiah bisa panjang — di layar HP dikecilkan & boleh wrap
            supaya tidak melebar keluar kartu. */}
        <div className="text-lg font-bold break-words sm:text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
}
