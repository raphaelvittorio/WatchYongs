"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi."),
  phone: z.string().min(1, "No. HP wajib diisi."),
  email: z.string().email("Format email tidak valid.").optional().or(z.literal("")),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
};

export function CustomerForm({
  customer,
  onSuccess,
}: {
  customer?: CustomerRecord;
  onSuccess: (customer: CustomerRecord) => void;
}) {
  const isEdit = Boolean(customer);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      address: customer?.address ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const res = await fetch(
      isEdit ? `/api/customers/${customer!.id}` : "/api/customers",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal menyimpan customer.");
      return;
    }

    const saved = (await res.json()) as CustomerRecord;
    toast.success(isEdit ? "Customer berhasil diperbarui." : "Customer berhasil dibuat.");
    onSuccess(saved);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="customer-name">Nama</Label>
          <Input id="customer-name" {...register("name")} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-phone">No. HP</Label>
          <Input id="customer-phone" {...register("phone")} />
          {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer-email">Email (opsional)</Label>
        <Input id="customer-email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer-address">Alamat (opsional)</Label>
        <Textarea id="customer-address" rows={2} {...register("address")} />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Customer"}
      </Button>
    </form>
  );
}
