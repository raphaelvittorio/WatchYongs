import Link from "next/link";
import { DatabaseBackup, Download, Plus, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireMasterPage } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { getBranches } from "@/lib/branch";
import { BranchBadge } from "@/components/shared/BranchBadge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRowActions } from "@/components/users/UserRowActions";
import { formatLongDate } from "@/lib/format";

export const metadata = { title: "Staff" };

export default async function UsersPage() {
  const currentUser = await requireMasterPage();
  const [users, branchRows] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    getBranches(),
  ]);
  const branches = branchRows.map((b) => ({ id: b.id, name: b.name }));

  const isLastUser = users.length <= 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description={`${users.length} akun bisa login ke dashboard. Master punya akses penuh ke semua cabang; Staff hanya operasional di cabangnya.`}
        actions={
          <Button render={<Link href="/users/new" />} nativeButton={false}>
            <Plus />
            Staff Baru
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => {
          const isSelf = currentUser.id === user.id;
          return (
            <Card key={user.id} className="gap-4">
              <CardContent className="flex items-start gap-3">
                <UserAvatar name={user.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{user.name}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                        user.role === "MASTER"
                          ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                          : "bg-muted text-muted-foreground ring-border",
                      )}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                    {user.branch && <BranchBadge branch={user.branch} />}
                    {user.role === "MASTER" && (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Semua cabang
                      </span>
                    )}
                    {isSelf && (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-foreground">
                        Kamu
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bergabung {formatLongDate(user.createdAt)}
                  </p>
                </div>
              </CardContent>
              <div className="border-t px-4 pt-3 sm:px-5 [&>div]:justify-start">
                <UserRowActions
                  userId={user.id}
                  userName={user.name}
                  role={user.role}
                  branchId={user.branch?.id ?? null}
                  branches={branches}
                  isSelf={isSelf}
                  isLastUser={isLastUser}
                />
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-600/15 ring-inset">
              <DatabaseBackup className="size-5" />
            </span>
            <div>
              <CardTitle>Backup Database</CardTitle>
              <CardDescription>
                Unduh salinan lengkap database (.sql) — simpan di tempat aman secara berkala.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
            File berisi data customer — jangan dibagikan ke pihak luar.
          </p>
          <Button variant="outline" render={<a href="/api/backup" />} nativeButton={false}>
            <Download />
            Download Backup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
