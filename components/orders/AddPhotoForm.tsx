"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PHOTO_STAGE_LABELS, type PhotoStage } from "@/lib/status";

const STAGES: PhotoStage[] = ["INTAKE", "ASSESSMENT", "COMPLETION"];

export function AddPhotoForm({
  orderId,
  defaultStage,
}: {
  orderId: string;
  defaultStage: PhotoStage;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<PhotoStage>(defaultStage);
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!files || files.length === 0) {
      toast.error("Pilih minimal satu foto dulu.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.set("stage", stage);
    Array.from(files).forEach((file) => formData.append("photos", file));

    const res = await fetch(`/api/orders/${orderId}/photos`, {
      method: "POST",
      body: formData,
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal upload foto.");
      return;
    }

    toast.success("Foto berhasil ditambahkan.");
    setFiles(null);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Select value={stage} onValueChange={(v) => setStage(v as PhotoStage)}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue>{(value: PhotoStage) => PHOTO_STAGE_LABELS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {PHOTO_STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="max-w-xs"
        onChange={(e) => setFiles(e.target.files)}
      />
      <Button type="submit" size="sm" variant="secondary" disabled={submitting}>
        {submitting ? "Mengupload..." : "+ Tambah Foto"}
      </Button>
    </form>
  );
}
