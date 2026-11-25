import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { notFound, redirect } from "next/navigation";
import type { Branch } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { isMaster } from "@/lib/roles";

/** Cookie pilihan cabang milik master ("all" atau id cabang). */
export const BRANCH_COOKIE_NAME = "wy_branch";
export const ALL_BRANCHES = "all";

export type { Branch };

/**
 * Dua batas yang sengaja dipisah:
 * - access: cabang yang BOLEH dibuka. STAFF = cabangnya, MASTER = semua (null),
 *   apa pun pilihan switcher-nya.
 * - filter: cabang yang sedang DITAMPILKAN di daftar & angka. STAFF = cabangnya,
 *   MASTER = pilihan switcher (null = semua cabang).
 */
export type BranchScope = {
  user: CurrentUser;
  accessBranchId: string | null;
  filterBranchId: string | null;
  /** Cabang yang sedang difilter (null = semua cabang). */
  branch: Branch | null;
  branches: Branch[];
};

export const getBranches = cache(() =>
  prisma.branch.findMany({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] }),
);

/** null = belum login, atau staff yang belum diberi cabang. */
export const getBranchScope = cache(async (): Promise<BranchScope | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const branches = await getBranches();

  if (isMaster(user)) {
    const selected = (await cookies()).get(BRANCH_COOKIE_NAME)?.value;
    const branch = branches.find((b) => b.id === selected) ?? null;
    return { user, accessBranchId: null, filterBranchId: branch?.id ?? null, branch, branches };
  }

  const branch = branches.find((b) => b.id === user.branchId);
  if (!branch) return null;
  return { user, accessBranchId: branch.id, filterBranchId: branch.id, branch, branches };
});

/** Untuk membuka satu item (order, invoice, file) by id. */
export function accessWhere(scope: BranchScope): { branchId?: string } {
  return scope.accessBranchId ? { branchId: scope.accessBranchId } : {};
}

/** Untuk daftar, hitungan, dashboard, laporan, dan export. */
export function filterWhere(scope: BranchScope): { branchId?: string } {
  return scope.filterBranchId ? { branchId: scope.filterBranchId } : {};
}

/**
 * Where untuk mengambil satu order by id. Order cabang lain menghasilkan null
 * (→ 404, bukan 403), supaya keberadaannya tidak bocor ke staff cabang lain.
 *
 *   prisma.repairOrder.findFirst({ where: scopedOrderWhere(scope, id), include })
 */
export function scopedOrderWhere(scope: BranchScope, id: string) {
  return { id, ...accessWhere(scope) };
}

/**
 * Cabang untuk data baru. STAFF selalu cabangnya sendiri (input client
 * diabaikan); MASTER harus memilih cabang yang valid.
 */
export function branchForCreate(scope: BranchScope, requested?: string | null): Branch | null {
  const id = scope.accessBranchId ?? requested;
  return scope.branches.find((b) => b.id === id) ?? null;
}

/**
 * Untuk API operasional:
 *
 *   const { scope, denied } = await requireScopeApi();
 *   if (denied) return denied;
 */
export async function requireScopeApi(): Promise<
  { scope: BranchScope; denied?: never } | { scope?: never; denied: NextResponse }
> {
  const scope = await getBranchScope();
  if (scope) return { scope };
  const user = await getCurrentUser();
  return {
    denied: user
      ? NextResponse.json({ error: "Akun staff belum diberi cabang. Hubungi master." }, { status: 403 })
      : NextResponse.json({ error: "Sesi habis, silakan login lagi." }, { status: 401 }),
  };
}

export function branchLabel(branch: Pick<Branch, "name"> | null) {
  return branch ? branch.name : "Semua cabang";
}

/** Untuk halaman: belum login → /login; staff tanpa cabang → 404 (layout menampilkan pesannya). */
export async function requireScopePage(): Promise<BranchScope> {
  const scope = await getBranchScope();
  if (scope) return scope;
  if (!(await getCurrentUser())) redirect("/login");
  notFound();
}

/**
 * Daftar customer. Data customer dipakai bersama semua cabang:
 * - tanpa kata kunci → customer cabang asal ini ATAU yang pernah servis di sini;
 * - dengan kata kunci → semua customer yang cocok, dari cabang mana pun.
 */
export function customerListWhere(scope: BranchScope, q?: string | null) {
  if (q) return { OR: [{ name: { contains: q } }, { phone: { contains: q } }] };
  if (!scope.filterBranchId) return {};
  const branchId = scope.filterBranchId;
  return { OR: [{ branchId }, { orders: { some: { branchId } } }] };
}

/** Opsi untuk <BranchField> di form data baru. */
export function branchFieldOptions(scope: BranchScope) {
  return {
    branches: scope.branches.map((b) => ({ id: b.id, name: b.name })),
    defaultBranchId: scope.accessBranchId ?? scope.filterBranchId,
    locked: scope.accessBranchId !== null,
  };
}

/**
 * Cabang untuk akun user: MASTER selalu null (akses semua cabang), STAFF wajib
 * punya cabang yang valid.
 */
export async function resolveUserBranch(
  role: "MASTER" | "STAFF",
  branchId: string | null | undefined,
): Promise<{ branchId: string | null } | { error: string }> {
  if (role === "MASTER") return { branchId: null };
  const branches = await getBranches();
  if (!branchId || !branches.some((b) => b.id === branchId)) {
    return { error: "Pilih cabang untuk akun staff." };
  }
  return { branchId };
}
