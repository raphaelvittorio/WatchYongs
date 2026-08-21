import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WHATSAPP_TEMPLATE_LABELS } from "@/lib/whatsapp-templates";

type WhatsappLogItem = {
  id: string;
  templateType: string;
  message: string;
  sentAt: Date;
};

export function WhatsappHistoryCard({ logs }: { logs: WhatsappLogItem[] }) {
  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Riwayat WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((log, idx) => (
          <div key={log.id}>
            {idx > 0 && <Separator className="mb-3" />}
            <p className="text-sm font-medium">
              {WHATSAPP_TEMPLATE_LABELS[log.templateType] ?? log.templateType}
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{log.message}</p>
            <p className="text-xs text-muted-foreground">
              {log.sentAt.toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
