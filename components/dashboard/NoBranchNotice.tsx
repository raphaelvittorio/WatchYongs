"use client";

import { useRouter } from "next/navigation";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoBranchNotice({ name }: { name: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="max-w-sm space-y-4 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <MapPinOff className="size-6" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight">Akun belum diberi cabang</h1>
          <p className="text-sm text-muted-foreground">
            Halo {name}, akun staff kamu belum ditempatkan di cabang mana pun. Minta master
            mengatur cabangmu di halaman Staff, lalu login lagi.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
