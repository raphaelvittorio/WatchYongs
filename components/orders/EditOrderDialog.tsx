"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_TYPE_LABELS, ServiceType, type ServiceType as ServiceTypeValue } from "@/lib/status";

const SERVICE_TYPES = Object.values(ServiceType);

const schema = z.object({
  watchBrand: z.string().min(1, "Merk jam wajib diisi."),
  watchModel: z.string().optional(),
  watchInfo: z.string().optional(),
  serviceType: z.enum([ServiceType.BESAR, ServiceType.KECIL]).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditOrderDialog({
  orderId,
  order,
}: {
  orderId: string;
  order: {
    watchBrand: string;
    watchModel: string | null;
    watchInfo: string | null;
    serviceType: ServiceTypeValue | null;
    notes: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      watchBrand: order.watchBrand,
      watchModel: order.watchModel ?? "",
      watchInfo: order.watchInfo ?? "",
      serviceType: order.serviceType ?? undefined,
      notes: order.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menyimpan perubahan.");
      return;
    }
    toast.success("Info jam berhasil diperbarui.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4" />
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Info Jam</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-watchBrand">Merk Jam</Label>
              <Input id="edit-watchBrand" {...register("watchBrand")} />
              {errors.watchBrand && (
                <p className="text-sm text-red-600">{errors.watchBrand.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-watchModel">Model</Label>
              <Input id="edit-watchModel" {...register("watchModel")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-watchInfo">Info Jam</Label>
            <Textarea id="edit-watchInfo" rows={2} {...register("watchInfo")} />
          </div>
          <div className="space-y-2">
            <Label>Jenis Service</Label>
            <Controller
              control={control}
              name="serviceType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis service...">
                      {(value: ServiceTypeValue) => SERVICE_TYPE_LABELS[value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {SERVICE_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Keterangan Masalah</Label>
            <Textarea id="edit-notes" rows={3} {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
