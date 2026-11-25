"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  Camera,
  Check,
  Cog,
  Sparkles,
  UserRound,
  Watch,
  type LucideIcon,
} from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoPicker } from "@/components/orders/PhotoPicker";
import { BranchField, type BranchFieldOptions } from "@/components/branches/BranchField";
import { SERVICE_TYPE_LABELS, ServiceType } from "@/lib/status";
import { cn } from "@/lib/utils";

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
  branchOptions,
}: {
  customers: { id: string; name: string; phone: string }[];
  branchOptions: BranchFieldOptions;
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(branchOptions.defaultBranchId ?? "");
  const [branchError, setBranchError] = useState<string>();
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
    if (!branchId) {
      setBranchError("Pilih cabang tempat jam diterima.");
      return;
    }
    const formData = new FormData();
    formData.set("branchId", branchId);

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection
        step={1}
        icon={UserRound}
        title="Customer"
        description="Pilih customer lama (dari cabang mana pun) atau daftarkan yang baru."
      >
        <BranchField
          id="intake-branch"
          options={branchOptions}
          value={branchId}
          onChange={(next) => {
            setBranchId(next);
            setBranchError(undefined);
          }}
          error={branchError}
          hint={
            branchOptions.locked
              ? "Order otomatis tercatat di cabang akunmu."
              : "Nomor order mengikuti cabang yang dipilih."
          }
        />
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
                      !value ? (
                        <span className="text-muted-foreground">Pilih customer...</span>
                      ) : value === NEW_CUSTOMER_VALUE ? (
                        "+ Customer Baru"
                      ) : (
                        (() => {
                          const c = customers.find((c) => c.id === value);
                          return c ? `${c.name} · ${c.phone}` : value;
                        })()
                      )
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_CUSTOMER_VALUE}>+ Customer Baru</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.customerId && <FieldError>{errors.customerId.message}</FieldError>}
        </div>

        {isNewCustomer && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-dashed bg-muted/30 p-4 sm:grid-cols-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:col-span-2">
              Data customer baru
            </p>
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Nama Customer <Required />
              </Label>
              <Input id="customerName" autoComplete="off" {...register("customerName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">
                No. HP <Required />
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                inputMode="tel"
                placeholder="08xx..."
                {...register("customerPhone")}
              />
            </div>
            {errors.customerName && (
              <FieldError className="sm:col-span-2">{errors.customerName.message}</FieldError>
            )}
            <div className="space-y-2">
              <Label htmlFor="ownerAge">
                Usia Owner <Optional />
              </Label>
              <Input
                id="ownerAge"
                type="number"
                min={0}
                inputMode="numeric"
                {...register("ownerAge")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerCharacter">
                Karakter Owner <Optional />
              </Label>
              <Input
                id="ownerCharacter"
                placeholder="Misal: sabar, detail, buru-buru"
                {...register("ownerCharacter")}
              />
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        step={2}
        icon={Watch}
        title="Detail Jam"
        description="Identitas jam dan jenis service yang diminta."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="watchBrand">
              Merk Jam <Required />
            </Label>
            <Input id="watchBrand" {...register("watchBrand")} placeholder="Rolex, Seiko, ..." />
            {errors.watchBrand && <FieldError>{errors.watchBrand.message}</FieldError>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="watchModel">
              Model <Optional />
            </Label>
            <Input
              id="watchModel"
              placeholder="Submariner, Presage, ..."
              {...register("watchModel")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="watchInfo">
            Info Jam <Optional />
          </Label>
          <Textarea
            id="watchInfo"
            rows={2}
            placeholder="Nomor serial, kelengkapan (box, kartu garansi, strap cadangan), dll."
            {...register("watchInfo")}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">
            Jenis Service <Required />
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {SERVICE_TYPES.map((type) => {
              const Icon = type === "BESAR" ? Cog : Sparkles;
              return (
                <label
                  key={type}
                  className="group relative flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 shadow-xs transition-all hover:border-foreground/20 has-checked:border-primary has-checked:ring-1 has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                >
                  <input
                    type="radio"
                    value={type}
                    className="sr-only"
                    {...register("serviceType")}
                  />
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-has-checked:bg-primary group-has-checked:text-brand">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 text-sm leading-tight font-semibold">
                    {SERVICE_TYPE_LABELS[type]}
                  </span>
                  <span className="ml-auto hidden size-4 shrink-0 place-items-center rounded-full border border-muted-foreground/40 group-has-checked:border-primary group-has-checked:bg-primary sm:grid">
                    <span className="size-1.5 rounded-full bg-white opacity-0 group-has-checked:opacity-100" />
                  </span>
                </label>
              );
            })}
          </div>
          {errors.serviceType && <FieldError>{errors.serviceType.message}</FieldError>}
        </fieldset>
      </FormSection>

      <FormSection
        step={3}
        icon={Camera}
        title="Kondisi & Foto"
        description="Catat keluhan dan foto kondisi jam saat diterima."
      >
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
          <PhotoPicker id="photos" files={photos} onChange={setPhotos} />
        </div>
      </FormSection>

      {submitError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {submitError}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          size="lg"
          render={<Link href="/orders" />}
          nativeButton={false}
        >
          Batal
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting} className="sm:min-w-48">
          <Check />
          {isSubmitting ? "Menyimpan..." : "Simpan Intake"}
        </Button>
      </div>
    </form>
  );
}

function Required() {
  return <span className="text-rose-500">*</span>;
}

function Optional() {
  return <span className="text-xs font-normal text-muted-foreground">(opsional)</span>;
}

function FieldError({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-rose-600", className)}>{children}</p>;
}

function FormSection({
  step,
  icon: Icon,
  title,
  description,
  children,
}: {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
            <Icon className="size-5" />
            <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-brand ring-2 ring-card">
              {step}
            </span>
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}
