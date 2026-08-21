import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const customers = await prisma.customer.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] }
      : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data customer tidak valid." }, { status: 400 });
  }

  const { name, phone, email, address } = parsed.data;
  const customer = await prisma.customer.create({
    data: { name, phone, email: email || null, address: address || null },
  });
  return NextResponse.json(customer, { status: 201 });
}
