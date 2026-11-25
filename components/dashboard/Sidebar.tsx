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
  TrendingUp,
  Menu,
  X,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo, BrandMark } from "@/components/shared/BrandLogo";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, isMaster, type Role } from "@/lib/roles";

type NavItem = { href: string; label: string; short: string; icon: LucideIcon };

// masterOnly: disembunyikan untuk STAFF. Ini hanya tampilan — halaman dan
// API-nya tetap dicek di server (requireMasterPage / denyUnlessMaster).
const NAV_GROUPS: { label: string; masterOnly?: boolean; items: NavItem[] }[] = [
  {
    label: "Operasional",
    items: [
      { href: "/", label: "Dashboard", short: "Beranda", icon: LayoutDashboard },
      { href: "/orders", label: "Order Reparasi", short: "Order", icon: ClipboardList },
      { href: "/customers", label: "Customer", short: "Customer", icon: Users },
    ],
  },
  {
    label: "Bisnis",
    masterOnly: true,
    items: [{ href: "/reports", label: "Laporan", short: "Laporan", icon: TrendingUp }],
  },
  {
    label: "Pengaturan",
    masterOnly: true,
    items: [{ href: "/users", label: "Staff", short: "Staff", icon: UserCog }],
  },
];

function navGroupsFor(user: User) {
  return NAV_GROUPS.filter((g) => !g.masterOnly || isMaster(user));
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // "/orders/new" punya tombol sendiri — jangan ikut menyalakan menu Order.
  if (href === "/orders" && pathname === "/orders/new") return false;
  return pathname.startsWith(href);
}

type User = { name: string; email: string; role: Role };

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
  user: User;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  const intakeActive = pathname === "/orders/new";
  return (
    <>
      <div className="px-4 pt-2 pb-4">
        <Link
          href="/orders/new"
          onClick={onNavigate}
          aria-current={intakeActive ? "page" : undefined}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
        >
          <Plus className="size-4" />
          Intake Baru
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {navGroupsFor(user).map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:py-2",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary" />
                    )}
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <UserAvatar name={user.name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-sidebar-muted">
              {ROLE_LABELS[user.role]} · {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar({ user }: { user: User }) {
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

  const navItems = navGroupsFor(user).flatMap((g) => g.items);
  const currentNav = navItems.find((item) => isActive(pathname, item.href));
  const bottomItems = navItems.filter((item) =>
    ["/", "/orders", "/customers"].includes(item.href),
  );

  return (
    <>
      {/* Mobile: top bar ringkas. */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md md:hidden">
        <Link href="/" className="flex items-center gap-2" aria-label="WatchYongs — Dashboard">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-brand">
            <BrandMark className="size-7" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">WatchYongs</span>
        </Link>
        {currentNav && currentNav.href !== "/" && (
          <span className="truncate text-sm text-muted-foreground">/ {currentNav.label}</span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu akun"
          className="ml-auto rounded-full ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar name={user.name} size="sm" />
        </button>
      </header>

      {/* Mobile: navigasi bawah, jangkauan jempol. */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
          {bottomItems.slice(0, 2).map((item) => (
            <BottomNavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <div className="flex justify-center">
            <Link
              href="/orders/new"
              aria-label="Intake baru"
              aria-current={pathname === "/orders/new" ? "page" : undefined}
              className="-mt-7 grid size-14 place-items-center rounded-2xl bg-primary text-brand shadow-lg ring-4 ring-background transition-transform active:scale-95"
            >
              <Plus className="size-6" />
            </Link>
          </div>
          {bottomItems.slice(2).map((item) => (
            <BottomNavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-muted-foreground"
          >
            <span className="grid h-7 w-12 place-items-center">
              <Menu className="size-5" />
            </span>
            Menu
          </button>
        </div>
      </nav>

      {/* Mobile: backdrop drawer. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile: drawer navigasi. Selalu ter-mount supaya bisa dianimasikan
          masuk & keluar; ditandai inert saat tertutup agar tidak bisa difokus. */}
      <aside
        inert={!open}
        aria-label="Menu navigasi"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col bg-sidebar shadow-2xl transition-transform duration-200 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <BrandLogo />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
            className="text-sidebar-muted hover:bg-sidebar-accent hover:text-white"
          >
            <X className="size-5" />
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
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar md:sticky md:top-0 md:flex md:h-dvh">
        <div className="px-5 pt-6 pb-4">
          <Link href="/" aria-label="WatchYongs — Dashboard">
            <BrandLogo />
          </Link>
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

function BottomNavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-1 py-1 text-[11px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "grid h-7 w-12 place-items-center rounded-full transition-colors",
          active && "bg-brand-soft text-brand-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      {item.short}
    </Link>
  );
}
