"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function CompleteOrderDialog({
  orderId,
  estimatedPrice,
}: {
  orderId: string;
  estimatedPrice: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(estimatedPrice));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    const res = await fetch(`/api/orders/${orderId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalAmount: Number(amount), note: note || undefined }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menyelesaikan order.");
      return;
    }

    toast.success("Order selesai, invoice dibuat.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setAmount(String(estimatedPrice));
          setNote("");
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <CheckCircle2 className="h-4 w-4" />
        Selesaikan & Buat Invoice
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selesaikan Order</DialogTitle>
          <DialogDescription>
            Konfirmasi biaya final sebelum invoice dibuat. Estimasi awal bisa diubah kalau
            ada biaya tambahan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="complete-amount">Biaya Final (Rp)</Label>
            <Input
              id="complete-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complete-note">Catatan Tambahan (opsional)</Label>
            <Textarea
              id="complete-note"
              rows={3}
              placeholder="Misal: tambahan biaya penggantian part."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={submitting || !amount} onClick={onSubmit}>
            {submitting ? "Memproses..." : "Konfirmasi Selesai"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
