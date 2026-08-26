import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

const patchSchema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter."),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Password tidak valid." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Staff tidak ditemukan." }, { status: 404 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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
