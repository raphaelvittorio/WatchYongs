import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export type AlertItem = {
  id: string;
  href: string;
  title: string;
  description: string;
};

export function AlertList({ items }: { items: AlertItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert</CardTitle>
          <CardDescription>
            Tidak ada order yang perlu perhatian khusus saat ini.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Perlu Perhatian ({items.length})
        </CardTitle>
        <CardDescription>
          Order yang melewati batas waktu normal berdasarkan aturan workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <p className="font-medium">{item.title}</p>
            <p className="text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
