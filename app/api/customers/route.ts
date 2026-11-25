import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { branchForCreate, customerListWhere, requireScopeApi } from "@/lib/branch";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  ownerAge: z.coerce.number().int().positive().optional(),
  ownerCharacter: z.string().optional(),
  branchId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { scope, denied } = await requireScopeApi();
  if (denied) return denied;
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const customers = await prisma.customer.findMany({
    where: customerListWhere(scope, q),
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const { scope, denied } = await requireScopeApi();
  if (denied) return denied;
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data customer tidak valid." }, { status: 400 });
  }

  const { name, phone, email, address, ownerAge, ownerCharacter, branchId } = parsed.data;
  const branch = branchForCreate(scope, branchId);
  if (!branch) {
    return NextResponse.json({ error: "Pilih cabang asal customer." }, { status: 400 });
  }
  const customer = await prisma.customer.create({
    data: {
      branchId: branch.id,
      name,
      phone,
      email: email || null,
      address: address || null,
      ownerAge: ownerAge ?? null,
      ownerCharacter: ownerCharacter || null,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
