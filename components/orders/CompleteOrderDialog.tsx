"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type ItemRow = { description: string; amount: string };
type OrderGroup = { orderId: string; label: string; items: ItemRow[] };

function defaultItems(estimatedPrice: number): ItemRow[] {
  return [{ description: "Jasa Service", amount: String(estimatedPrice) }];
}

function watchLabel(brand: string, model: string | null) {
  return `${brand}${model ? ` ${model}` : ""}`;
}

type SiblingOrder = {
  id: string;
  orderNumber: string;
  watchBrand: string;
  watchModel: string | null;
  estimatedPrice: number;
};

export function CompleteOrderDialog({
  orderId,
  estimatedPrice,
  customerName,
  mainOrderNumber,
  mainWatchBrand,
  mainWatchModel = null,
  siblingOrders = [],
}: {
  orderId: string;
  estimatedPrice: number;
  customerName?: string;
  mainOrderNumber: string;
  mainWatchBrand: string;
  mainWatchModel?: string | null;
  siblingOrders?: SiblingOrder[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mainGroup = (): OrderGroup => ({
    orderId,
    label: `${mainOrderNumber} — ${watchLabel(mainWatchBrand, mainWatchModel)}`,
    items: defaultItems(estimatedPrice),
  });
  const [groups, setGroups] = useState<OrderGroup[]>([mainGroup()]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleSibling(sibling: SiblingOrder, checked: boolean) {
    setGroups((prev) =>
      checked
        ? [
            ...prev,
            {
              orderId: sibling.id,
              label: `${sibling.orderNumber} — ${watchLabel(sibling.watchBrand, sibling.watchModel)}`,
              items: defaultItems(sibling.estimatedPrice),
            },
          ]
        : prev.filter((g) => g.orderId !== sibling.id),
    );
  }

  const total = groups.reduce(
    (sum, g) => sum + g.items.reduce((s, item) => s + (Number(item.amount) || 0), 0),
    0,
  );
  const isValid = groups.every((g) =>
    g.items.every(
      (item) =>
        item.description.trim().length > 0 && item.amount !== "" && Number(item.amount) >= 0,
    ),
  );

  function updateItem(groupIndex: number, itemIndex: number, field: keyof ItemRow, value: string) {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== groupIndex
          ? g
          : {
              ...g,
              items: g.items.map((item, ii) =>
                ii === itemIndex ? { ...item, [field]: value } : item,
              ),
            },
      ),
    );
  }

  function addItem(groupIndex: number) {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== groupIndex ? g : { ...g, items: [...g.items, { description: "", amount: "" }] },
      ),
    );
  }

  function removeItem(groupIndex: number, itemIndex: number) {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== groupIndex ? g : { ...g, items: g.items.filter((_, ii) => ii !== itemIndex) },
      ),
    );
  }

  async function onSubmit() {
    setSubmitting(true);
    const additionalOrderIds = groups.filter((g) => g.orderId !== orderId).map((g) => g.orderId);
    const res = await fetch(`/api/orders/${orderId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: groups.flatMap((g) =>
          g.items.map((item) => ({
            description: item.description.trim(),
            amount: Number(item.amount),
            repairOrderId: g.orderId,
          })),
        ),
        note: note || undefined,
        additionalOrderIds: additionalOrderIds.length > 0 ? additionalOrderIds : undefined,
      }),
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

  const selectedSiblingIds = groups.filter((g) => g.orderId !== orderId).map((g) => g.orderId);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setGroups([mainGroup()]);
          setNote("");
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <CheckCircle2 className="h-4 w-4" />
        Selesaikan & Buat Invoice
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Selesaikan Order</DialogTitle>
          <DialogDescription>
            Tambahkan rincian biaya per jam (bisa lebih dari satu item tiap jam) sebelum invoice
            dibuat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {siblingOrders.length > 0 && (
            <div className="space-y-2 rounded-md border p-3">
              <Label>
                Gabung juga dengan order lain dari {customerName ?? "customer ini"} yang masih On
                Process?
              </Label>
              <div className="space-y-2">
                {siblingOrders.map((sibling) => (
                  <label
                    key={sibling.id}
                    className="flex items-center gap-2 text-sm"
                    htmlFor={`sibling-${sibling.id}`}
                  >
                    <Checkbox
                      id={`sibling-${sibling.id}`}
                      checked={selectedSiblingIds.includes(sibling.id)}
                      onCheckedChange={(checked) => toggleSibling(sibling, checked === true)}
                    />
                    {sibling.orderNumber} — {watchLabel(sibling.watchBrand, sibling.watchModel)}
                  </label>
                ))}
              </div>
            </div>
          )}

          {groups.map((group, groupIndex) => (
            <div key={group.orderId} className="space-y-2 rounded-md border p-3">
              <Label>Rincian Biaya — {group.label}</Label>
              <div className="space-y-2">
                {group.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <Input
                      placeholder="Keterangan (misal: Ganti Baterai)"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(groupIndex, itemIndex, "description", e.target.value)
                      }
                      className="sm:flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Harga (Rp)"
                        value={item.amount}
                        onChange={(e) => updateItem(groupIndex, itemIndex, "amount", e.target.value)}
                        className="flex-1 sm:w-32 sm:flex-none"
                      />
                      {group.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Hapus item"
                          onClick={() => removeItem(groupIndex, itemIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(groupIndex)}
              >
                <Plus className="h-4 w-4" />
                Tambah Item
              </Button>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
            <span>Total</span>
            <span>Rp {total.toLocaleString("id-ID")}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="complete-note">Catatan Tambahan (opsional)</Label>
            <Textarea
              id="complete-note"
              rows={3}
              placeholder="Misal: sudah termasuk diskon."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={submitting || !isValid} onClick={onSubmit}>
            {submitting ? "Memproses..." : "Konfirmasi Selesai"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
