// Re-exported from the browser-safe Prisma entry point so this file can be
// imported from both server and client components without pulling in the
// Node-only Prisma client runtime.
export { OrderStatus, PhotoStage, AssessmentDecision } from "@/app/generated/prisma/browser";
import type {
  OrderStatus as OrderStatusType,
  PhotoStage as PhotoStageType,
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
