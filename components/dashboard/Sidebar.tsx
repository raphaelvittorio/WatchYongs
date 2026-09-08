"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCog,
  LogOut,
  Watch,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Order Reparasi", icon: ClipboardList },
  { href: "/customers", label: "Customer", icon: Users },
  { href: "/reports", label: "Laporan", icon: TrendingUp },
  { href: "/users", label: "Staff", icon: UserCog },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Watch className="h-5 w-5 shrink-0" />
      <span className="text-base font-semibold">WatchYongs</span>
    </div>
  );
}

/**
 * Isi sidebar (nav + footer user) dipakai bersama oleh sidebar desktop dan
 * drawer mobile, supaya menunya tidak perlu ditulis dua kali.
 */
function SidebarBody({
  pathname,
  user,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  user: { name: string; email: string };
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors md:py-2",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="mb-3 px-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );
}

export function Sidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Tutup drawer saat pindah halaman (termasuk tombol back browser), supaya
  // menu tidak menutupi halaman yang baru dibuka.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Selama drawer terbuka: kunci scroll body dan izinkan Escape untuk menutup.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Kalau layar melebar sampai breakpoint desktop selagi drawer terbuka
  // (misal HP diputar ke landscape), tutup drawer-nya — kalau tidak, sidebar
  // desktop yang tampil tapi scroll body masih ikut terkunci.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile: top bar dengan tombol hamburger, menggantikan sidebar. */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background px-3 py-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Buka menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <BrandMark />
      </header>

      {/* Mobile: backdrop drawer. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile: drawer navigasi. Selalu ter-mount supaya bisa dianimasikan
          masuk & keluar; ditandai inert saat tertutup agar tidak bisa difokus. */}
      <aside
        inert={!open}
        aria-label="Menu navigasi"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col bg-background shadow-xl transition-transform duration-200 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <BrandMark />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarBody
          pathname={pathname}
          user={user}
          onNavigate={() => setOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Desktop: sidebar tetap, menempel saat halaman di-scroll. */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:sticky md:top-0 md:flex md:h-dvh">
        <div className="border-b px-6 py-5">
          <BrandMark className="gap-2 [&>svg]:h-6 [&>svg]:w-6 [&>span]:text-lg" />
        </div>
        <SidebarBody
          pathname={pathname}
          user={user}
          onNavigate={() => {}}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}
