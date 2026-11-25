import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBranchScope } from "@/lib/branch";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NoBranchNotice } from "@/components/dashboard/NoBranchNotice";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Staff tanpa cabang tidak punya data untuk dilihat (login juga menolaknya,
  // tapi sesi lama bisa masih aktif kalau cabangnya dicabut).
  const scope = await getBranchScope();
  if (!scope) {
    return <NoBranchNotice name={user.name} />;
  }

  const toOption = (b: { id: string; name: string }) => ({ id: b.id, name: b.name });
  const branch = {
    branches: scope.branches.map(toOption),
    current: scope.branch ? toOption(scope.branch) : null,
    canSwitch: scope.accessBranchId === null,
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar user={user} branch={branch} />
      {/* pb besar di HP: memberi ruang untuk navigasi bawah yang fixed. */}
      <main className="min-w-0 flex-1 px-4 pt-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 md:px-8 md:py-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
      <Toaster theme="light" richColors closeButton mobileOffset={{ bottom: 96 }} />
    </div>
  );
}
