"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleSelect } from "@/components/users/RoleSelect";
import { BranchField } from "@/components/branches/BranchField";
import { Role } from "@/lib/roles";

const schema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi."),
    email: z.string().email("Format email tidak valid."),
    password: z.string().min(8, "Password minimal 8 karakter."),
    role: z.enum([Role.MASTER, Role.STAFF]),
    branchId: z.string().optional(),
  })
  .refine((v) => v.role === Role.MASTER || Boolean(v.branchId), {
    message: "Pilih cabang untuk akun staff.",
    path: ["branchId"],
  });

type FormValues = z.infer<typeof schema>;

export function CreateUserForm({ branches }: { branches: { id: string; name: string }[] }) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "STAFF" } });
  const isStaff = watch("role") === Role.STAFF;

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Master tidak punya cabang: jangan kirim pilihan cabang yang tersisa.
      body: JSON.stringify({ ...values, branchId: isStaff ? values.branchId : undefined }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal membuat akun staff.");
      return;
    }

    const user = (await res.json()) as { name: string };
    toast.success(`Akun ${user.name} berhasil dibuat.`);
    router.push("/users");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user-name">Nama</Label>
        <Input id="user-name" {...register("name")} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-email">Email</Label>
        <Input id="user-email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-password">Password</Label>
        <Input id="user-password" type="password" {...register("password")} />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => <RoleSelect value={field.value} onChange={field.onChange} />}
        />
      </div>
      {isStaff && (
        <Controller
          control={control}
          name="branchId"
          render={({ field }) => (
            <BranchField
              id="user-branch"
              options={{ branches, defaultBranchId: null, locked: false }}
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.branchId?.message}
              hint="Staff hanya bisa melihat dan mengubah data cabang ini."
            />
          )}
        />
      )}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Menyimpan..." : "Buat Akun"}
      </Button>
    </form>
  );
}
