// Browser-safe (no Prisma runtime), so client components like the Sidebar
// and the users page can use the same labels and checks as the server.
export { Role } from "@/app/generated/prisma/browser";
import type { Role as RoleType } from "@/app/generated/prisma/browser";

export const ROLE_LABELS: Record<RoleType, string> = {
  MASTER: "Master",
  STAFF: "Staff",
};

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  MASTER: "Akses penuh: laporan, export, backup, kelola staff, hapus data.",
  STAFF: "Operasional saja: order, customer, foto, dan WhatsApp.",
};

export function isMaster(user: { role: RoleType } | null | undefined) {
  return user?.role === "MASTER";
}
