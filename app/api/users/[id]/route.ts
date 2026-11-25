import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessMaster, getCurrentUser, hashPassword } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { resolveUserBranch } from "@/lib/branch";

const patchSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter.").optional(),
    role: z.enum([Role.MASTER, Role.STAFF]).optional(),
    branchId: z.string().optional(),
  })
  .refine((data) => data.password !== undefined || data.role !== undefined || data.branchId !== undefined, {
    message: "Tidak ada perubahan yang dikirim.",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await denyUnlessMaster();
  if (denied) return denied;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Staff tidak ditemukan." }, { status: 404 });
  }

  const { password, role, branchId } = parsed.data;

  // Master tidak bisa menurunkan role-nya sendiri. Karena yang mengubah role
  // selalu master, aturan ini juga menjamin selalu ada minimal 1 master.
  const currentUser = await getCurrentUser();
  if (role !== undefined && role !== existing.role && currentUser?.id === id) {
    return NextResponse.json(
      { error: "Tidak bisa mengubah role akun sendiri." },
      { status: 400 },
    );
  }

  // Role atau cabang berubah → cek ulang pasangan role + cabang. Jadi Master
  // berarti cabangnya dikosongkan; Staff wajib punya cabang.
  let branchUpdate: { branchId: string | null } | undefined;
  if (role !== undefined || branchId !== undefined) {
    const result = await resolveUserBranch(role ?? existing.role, branchId ?? existing.branchId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    branchUpdate = result;
  }

  await prisma.user.update({
    where: { id },
    data: {
      ...(password !== undefined && { passwordHash: await hashPassword(password) }),
      ...(role !== undefined && { role }),
      ...branchUpdate,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await denyUnlessMaster();
  if (denied) return denied;

  const { id } = await params;

  // Master tidak bisa menghapus akun sendiri, jadi master terakhir tidak akan
  // pernah terhapus.
  const currentUser = await getCurrentUser();
  if (currentUser?.id === id) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus akun sendiri." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Staff tidak ditemukan." }, { status: 404 });
  }

  const totalUsers = await prisma.user.count();
  if (totalUsers <= 1) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus staff terakhir." },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
