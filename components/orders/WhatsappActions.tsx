"use client";

import { useState } from "react";
import { Copy, MessageCircle, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildAssessmentReadyMessage,
  buildCompletedMessage,
  buildOverdueReminderMessage,
  buildWhatsappLink,
} from "@/lib/whatsapp-templates";
import { daysSince, type OrderStatus } from "@/lib/status";

type OrderInfo = {
  orderNumber: string;
  watchBrand: string;
  watchModel: string | null;
  status: OrderStatus;
  statusChangedAt: Date;
  branch?: { name: string };
};

type CustomerInfo = { name: string; phone: string };

export function WhatsappActions({
  orderId,
  order,
  customer,
  assessment,
}: {
  orderId: string;
  order: OrderInfo;
  customer: CustomerInfo;
  assessment: { estimatedPrice: number; diagnosis: string | null } | null;
}) {
  const templates: { key: string; label: string; message: string }[] = [];

  if (order.status === "ASSESSMENT" && assessment) {
    templates.push({
      key: "assessment",
      label: "Kirim Estimasi",
      message: buildAssessmentReadyMessage({
        order,
        customer,
        estimatedPrice: assessment.estimatedPrice,
        diagnosis: assessment.diagnosis,
      }),
    });
  }

  if (order.status === "COMPLETED") {
    const overdueDays = daysSince(order.statusChangedAt);
    if (overdueDays > 7) {
      templates.push({
        key: "overdue",
        label: "Kirim Reminder",
        message: buildOverdueReminderMessage({ order, customer, daysOverdue: overdueDays }),
      });
    } else {
      templates.push({
        key: "completed",
        label: "Kirim Notifikasi Selesai",
        message: buildCompletedMessage({ order, customer }),
      });
    }
  }

  if (templates.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((t) => (
        <TemplateDialogButton
          key={t.key}
          orderId={orderId}
          templateType={t.key}
          label={t.label}
          message={t.message}
          phone={customer.phone}
        />
      ))}
    </div>
  );
}

function TemplateDialogButton({
  orderId,
  templateType,
  label,
  message,
  phone,
}: {
  orderId: string;
  templateType: string;
  label: string;
  message: string;
  phone: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(message);

  function logSend() {
    fetch(`/api/orders/${orderId}/whatsapp-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateType, message: text }),
    }).catch(() => {});
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setText(message);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <MessageCircle className="text-emerald-600" />
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <MessageCircle className="size-4" />
            </span>
            {label}
          </DialogTitle>
          <DialogDescription>
            Periksa & ubah pesan bila perlu, lalu buka WhatsApp untuk mengirim.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="bg-emerald-50/40"
        />
        {text !== message && (
          <button
            type="button"
            onClick={() => setText(message)}
            className="flex items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset ke template asli
          </button>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(text);
              toast.success("Teks disalin.");
            }}
          >
            <Copy />
            Salin Teks
          </Button>
          <Button
            render={
              <a
                href={buildWhatsappLink(phone, text)}
                target="_blank"
                rel="noreferrer"
                onClick={logSend}
              />
            }
            nativeButton={false}
            variant="success"
          >
            <Send />
            Buka WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
