import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { denyUnlessMaster, hashPassword } from "@/lib/auth";
import { Role } from "@/lib/roles";
import { resolveUserBranch } from "@/lib/branch";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  branchId: true,
  createdAt: true,
} as const;

export async function GET() {
  const denied = await denyUnlessMaster();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi."),
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  role: z.enum([Role.MASTER, Role.STAFF]).default("STAFF"),
  branchId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const denied = await denyUnlessMaster();
  if (denied) return denied;

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data staff tidak valid." },
      { status: 400 },
    );
  }

  const { name, email, password, role } = parsed.data;
  const branch = await resolveUserBranch(role, parsed.data.branchId);
  if ("error" in branch) {
    return NextResponse.json({ error: branch.error }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah dipakai staff lain." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, branchId: branch.branchId },
    select: userSelect,
  });

  return NextResponse.json(user, { status: 201 });
}
