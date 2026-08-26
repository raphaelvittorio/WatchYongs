import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ error: "Customer tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json(customer);
}

const patchSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi.").optional(),
  phone: z.string().min(1, "No. HP wajib diisi.").optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  ownerAge: z.coerce.number().int().positive().optional(),
  ownerCharacter: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data customer tidak valid." }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Customer tidak ditemukan." }, { status: 404 });
  }

  const { name, phone, email, address, ownerAge, ownerCharacter } = parsed.data;
  const updated = await prisma.customer.update({
    where: { id },
    data: {
      name,
      phone,
      email: email || null,
      address: address || null,
      ownerAge: ownerAge ?? null,
      ownerCharacter: ownerCharacter || null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer tidak ditemukan." }, { status: 404 });
  }
  if (customer._count.orders > 0) {
    return NextResponse.json(
      { error: "Customer dengan order tidak bisa dihapus." },
      { status: 400 },
    );
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
