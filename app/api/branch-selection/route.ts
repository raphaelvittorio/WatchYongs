import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { denyUnlessMaster } from "@/lib/auth";
import { ALL_BRANCHES, BRANCH_COOKIE_NAME, getBranches } from "@/lib/branch";

const bodySchema = z.object({ branchId: z.string().min(1) });

// Switcher cabang di sidebar master. Hanya mengubah filter tampilan; hak akses
// master ke semua cabang tidak berubah. Staff tidak punya switcher.
export async function POST(request: NextRequest) {
  const denied = await denyUnlessMaster();
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  const branches = await getBranches();
  const branchId = parsed.success ? parsed.data.branchId : null;
  if (!branchId || (branchId !== ALL_BRANCHES && !branches.some((b) => b.id === branchId))) {
    return NextResponse.json({ error: "Cabang tidak ditemukan." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(BRANCH_COOKIE_NAME, branchId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
