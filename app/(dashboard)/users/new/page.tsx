"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CreateUserForm } from "@/components/users/CreateUserForm";

export default function NewUserPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Staff Baru</h1>
        <p className="text-sm text-muted-foreground">
          Buat akun login baru untuk staff yang bekerja di toko.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <CreateUserForm
            onSuccess={() => {
              router.push("/users");
              router.refresh();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
