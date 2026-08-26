import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOrderNumber } from "@/lib/order-number";
import { OrderStatus, ServiceType } from "@/lib/status";
import {
  extractPhotoFiles,
  saveUploadedPhotos,
  validatePhotos,
  InvalidPhotoError,
} from "@/lib/photo-upload";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(Object.values(OrderStatus));
const VALID_SERVICE_TYPES = new Set(Object.values(ServiceType));

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const statusParam = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const status =
    statusParam && VALID_STATUSES.has(statusParam as (typeof OrderStatus)[keyof typeof OrderStatus])
      ? (statusParam as (typeof OrderStatus)[keyof typeof OrderStatus])
      : undefined;

  const orders = await prisma.repairOrder.findMany({
    where: {
      status,
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q } },
              { watchBrand: { contains: q } },
              { customer: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const watchBrand = formData.get("watchBrand")?.toString().trim();
  const watchModel = formData.get("watchModel")?.toString().trim() || null;
  const watchInfo = formData.get("watchInfo")?.toString().trim() || null;
  const notes = formData.get("notes")?.toString().trim() || null;
  const serviceTypeRaw = formData.get("serviceType")?.toString();

  const customerId = formData.get("customerId")?.toString() || null;
  const customerName = formData.get("customerName")?.toString().trim();
  const customerPhone = formData.get("customerPhone")?.toString().trim();
  const ownerAgeRaw = formData.get("ownerAge")?.toString().trim();
  const ownerCharacter = formData.get("ownerCharacter")?.toString().trim() || null;

  if (!watchBrand) {
    return NextResponse.json({ error: "Merk jam wajib diisi." }, { status: 400 });
  }
  if (!customerId && (!customerName || !customerPhone)) {
    return NextResponse.json(
      { error: "Pilih customer atau isi nama & no. HP customer baru." },
      { status: 400 },
    );
  }
  if (!serviceTypeRaw || !VALID_SERVICE_TYPES.has(serviceTypeRaw as ServiceType)) {
    return NextResponse.json({ error: "Jenis service wajib dipilih." }, { status: 400 });
  }
  const serviceType = serviceTypeRaw as ServiceType;

  let ownerAge: number | null = null;
  if (ownerAgeRaw) {
    const parsedAge = Number(ownerAgeRaw);
    if (!Number.isInteger(parsedAge) || parsedAge <= 0) {
      return NextResponse.json({ error: "Usia owner tidak valid." }, { status: 400 });
    }
    ownerAge = parsedAge;
  }

  const photos = extractPhotoFiles(formData);
  try {
    validatePhotos(photos);
  } catch (error) {
    if (error instanceof InvalidPhotoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const customer = customerId
    ? await prisma.customer.findUnique({ where: { id: customerId } })
    : await prisma.customer.create({
        data: {
          name: customerName!,
          phone: customerPhone!,
          ownerAge,
          ownerCharacter,
        },
      });

  if (!customer) {
    return NextResponse.json({ error: "Customer tidak ditemukan." }, { status: 400 });
  }

  const orderNumber = await generateOrderNumber();
  const order = await prisma.repairOrder.create({
    data: {
      orderNumber,
      customerId: customer.id,
      watchBrand,
      watchModel,
      watchInfo,
      serviceType,
      notes,
      status: OrderStatus.INTAKE,
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: OrderStatus.INTAKE,
          note: "Jam diterima dari klien.",
        },
      },
    },
  });

  await saveUploadedPhotos(order.id, photos, "INTAKE");

  return NextResponse.json(order, { status: 201 });
}
