"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { SERVICE_TYPE_LABELS, ServiceType } from "@/lib/status";

const NEW_CUSTOMER_VALUE = "__new__";
const SERVICE_TYPES = Object.values(ServiceType);

const schema = z
  .object({
    customerId: z.string().min(1, "Pilih customer."),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    ownerAge: z.string().optional(),
    ownerCharacter: z.string().optional(),
    watchBrand: z.string().min(1, "Merk jam wajib diisi."),
    watchModel: z.string().optional(),
    watchInfo: z.string().optional(),
    serviceType: z.enum([ServiceType.BESAR, ServiceType.KECIL], {
      message: "Pilih jenis service.",
    }),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      data.customerId !== NEW_CUSTOMER_VALUE ||
      (data.customerName?.trim() && data.customerPhone?.trim()),
    {
      message: "Nama & no. HP customer baru wajib diisi.",
      path: ["customerName"],
    },
  );

type FormValues = z.infer<typeof schema>;

export function IntakeForm({
  customers,
}: {
  customers: { id: string; name: string; phone: string }[];
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: customers.length === 0 ? NEW_CUSTOMER_VALUE : "",
    },
  });

  const isNewCustomer = watch("customerId") === NEW_CUSTOMER_VALUE;

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const formData = new FormData();

    if (values.customerId === NEW_CUSTOMER_VALUE) {
      formData.set("customerName", values.customerName ?? "");
      formData.set("customerPhone", values.customerPhone ?? "");
      if (values.ownerAge) formData.set("ownerAge", values.ownerAge);
      if (values.ownerCharacter) formData.set("ownerCharacter", values.ownerCharacter);
    } else {
      formData.set("customerId", values.customerId);
    }

    formData.set("watchBrand", values.watchBrand);
    if (values.watchModel) formData.set("watchModel", values.watchModel);
    if (values.watchInfo) formData.set("watchInfo", values.watchInfo);
    formData.set("serviceType", values.serviceType);
    if (values.notes) formData.set("notes", values.notes);
    if (photos) {
      Array.from(photos).forEach((file) => formData.append("photos", file));
    }

    const res = await fetch("/api/orders", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error ?? "Gagal menyimpan intake.");
      return;
    }

    const order = await res.json();
    toast.success(`Order ${order.orderNumber} berhasil dibuat.`);
    router.push(`/orders/${order.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih customer...">
                      {(value: string) =>
                        value === NEW_CUSTOMER_VALUE
                          ? "+ Customer Baru"
                          : (() => {
                              const c = customers.find((c) => c.id === value);
                              return c ? `${c.name} · ${c.phone}` : value;
                            })()
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} · {c.phone}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW_CUSTOMER_VALUE}>
                      + Customer Baru
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customerId && (
              <p className="text-sm text-red-600">{errors.customerId.message}</p>
            )}
          </div>

          {isNewCustomer && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nama Customer</Label>
                <Input id="customerName" {...register("customerName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">No. HP</Label>
                <Input id="customerPhone" {...register("customerPhone")} />
              </div>
              {errors.customerName && (
                <p className="text-sm text-red-600 sm:col-span-2">
                  {errors.customerName.message}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="ownerAge">Usia Owner (opsional)</Label>
                <Input id="ownerAge" type="number" min={0} {...register("ownerAge")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerCharacter">Karakter Owner (opsional)</Label>
                <Input
                  id="ownerCharacter"
                  placeholder="Misal: sabar, detail, buru-buru"
                  {...register("ownerCharacter")}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="watchBrand">Merk Jam</Label>
              <Input
                id="watchBrand"
                {...register("watchBrand")}
                placeholder="Rolex, Seiko, ..."
              />
              {errors.watchBrand && (
                <p className="text-sm text-red-600">{errors.watchBrand.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="watchModel">Model (opsional)</Label>
              <Input id="watchModel" {...register("watchModel")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="watchInfo">Info Jam (serial, kelengkapan, dll)</Label>
            <Textarea id="watchInfo" rows={2} {...register("watchInfo")} />
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
                      {(value: (typeof SERVICE_TYPES)[number]) => SERVICE_TYPE_LABELS[value]}
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
            {errors.serviceType && (
              <p className="text-sm text-red-600">{errors.serviceType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Keterangan Masalah</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Kondisi saat diterima, keluhan customer, dll."
              {...register("notes")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photos">Foto Kondisi Awal</Label>
            <Input
              id="photos"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              onChange={(e) => setPhotos(e.target.files)}
            />
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Menyimpan..." : "Simpan Intake"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
