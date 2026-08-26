// Re-exported from the browser-safe Prisma entry point so this file can be
// imported from both server and client components without pulling in the
// Node-only Prisma client runtime.
export { OrderStatus, PhotoStage, AssessmentDecision, ServiceType } from "@/app/generated/prisma/browser";
import type {
  OrderStatus as OrderStatusType,
  PhotoStage as PhotoStageType,
  ServiceType as ServiceTypeType,
} from "@/app/generated/prisma/browser";

export const STATUS_LABELS: Record<OrderStatusType, string> = {
  INTAKE: "Intake",
  ASSESSMENT: "Assessment",
  ONPROCESS: "On Process",
  COMPLETED: "Completed",
  PICKED: "Sudah Diambil",
  REJECTED: "Ditolak",
};

export const STATUS_BADGE_CLASS: Record<OrderStatusType, string> = {
  INTAKE: "bg-blue-100 text-blue-800 border-blue-200",
  ASSESSMENT: "bg-amber-100 text-amber-800 border-amber-200",
  ONPROCESS: "bg-violet-100 text-violet-800 border-violet-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PICKED: "bg-gray-100 text-gray-700 border-gray-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

// Manual forward transitions available as generic buttons on the order
// detail page. ASSESSMENT -> ONPROCESS/REJECTED and ONPROCESS -> COMPLETED
// are intentionally excluded here: those moves happen through dedicated
// flows instead (assessment decision, and the completion dialog which
// captures the final invoice amount) rather than a bare status flip.
export const ALLOWED_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  INTAKE: ["ASSESSMENT", "REJECTED"],
  ASSESSMENT: [],
  ONPROCESS: [],
  COMPLETED: ["PICKED"],
  PICKED: [],
  REJECTED: [],
};

export function isValidTransition(from: OrderStatusType, to: OrderStatusType) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export const PHOTO_STAGE_LABELS: Record<PhotoStageType, string> = {
  INTAKE: "Foto Intake",
  ASSESSMENT: "Foto Assessment",
  COMPLETION: "Foto Completion",
};

// Sensible default stage to pre-select when staff adds a photo, based on
// where the order currently sits in the workflow.
export function defaultPhotoStageFor(status: OrderStatusType): PhotoStageType {
  switch (status) {
    case "INTAKE":
      return "INTAKE";
    case "ASSESSMENT":
      return "ASSESSMENT";
    default:
      return "COMPLETION";
  }
}

export const SERVICE_TYPE_LABELS: Record<ServiceTypeType, string> = {
  BESAR: "Service Besar",
  KECIL: "Service Kecil",
};

export type WorkChecklistState = {
  dropJam: boolean;
  onProses: boolean;
  selesai: boolean;
  ambilJam: boolean;
};

// Visual restatement of the existing status progression as the 4-step
// checklist from the physical work-order card (Drop Jam / Onproses /
// Selesai / Ambil Jam). This does not add new states — ASSESSMENT and
// REJECTED still exist and still drive the real workflow (assessment,
// invoice, WhatsApp); they just don't map to a distinct checklist row,
// matching what the physical card actually lists.
export function getWorkChecklist(status: OrderStatusType): WorkChecklistState {
  return {
    dropJam: true,
    onProses: status === "ONPROCESS" || status === "COMPLETED" || status === "PICKED",
    selesai: status === "COMPLETED" || status === "PICKED",
    ambilJam: status === "PICKED",
  };
}
