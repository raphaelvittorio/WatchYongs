import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { OrderStatus } from "../app/generated/prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

async function main() {
  // Idempotent: clear previously seeded data (children first) so this script
  // can be re-run safely to reset the demo dataset.
  await prisma.assessment.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.repairOrder.deleteMany();
  await prisma.customer.deleteMany();

  const passwordHash = await bcrypt.hash("watchyoung123", 10);
  await prisma.user.upsert({
    where: { email: "admin@watchyoung.local" },
    update: {},
    create: { name: "Admin WatchYoung", email: "admin@watchyoung.local", passwordHash },
  });

  const [hery, budi, siti] = await Promise.all([
    prisma.customer.create({ data: { name: "Pak Hery", phone: "0812-1122-3344" } }),
    prisma.customer.create({ data: { name: "Budi Santoso", phone: "0812-3456-7890" } }),
    prisma.customer.create({ data: { name: "Siti Aminah", phone: "0812-9876-5432" } }),
  ]);

  const seedOrders = [
    {
      orderNumber: "WY-0001",
      customerId: hery.id,
      watchBrand: "Rolex",
      watchModel: "Datejust",
      status: OrderStatus.ONPROCESS,
      createdAt: daysAgo(20),
      statusChangedAt: daysAgo(16), // >14 hari di ONPROCESS -> harus muncul di alert dashboard
      notes: "Servis otomatis, ganti seal & pelumasan.",
    },
    {
      orderNumber: "WY-0002",
      customerId: budi.id,
      watchBrand: "Seiko",
      watchModel: "5 Sports",
      status: OrderStatus.COMPLETED,
      createdAt: daysAgo(12),
      statusChangedAt: daysAgo(9), // >7 hari selesai belum diambil -> harus muncul di alert dashboard
      notes: "Ganti tali & servis kecil.",
    },
    {
      orderNumber: "WY-0003",
      customerId: siti.id,
      watchBrand: "Casio",
      watchModel: "Edifice",
      status: OrderStatus.ASSESSMENT,
      createdAt: daysAgo(3),
      statusChangedAt: daysAgo(2),
      notes: "Kaca depan retak, menunggu persetujuan biaya.",
    },
    {
      orderNumber: "WY-0004",
      customerId: budi.id,
      watchBrand: "Fossil",
      watchModel: "Grant",
      status: OrderStatus.INTAKE,
      createdAt: daysAgo(1),
      statusChangedAt: daysAgo(1),
      notes: "Baterai habis, belum dicek lebih lanjut.",
    },
  ] as const;

  for (const order of seedOrders) {
    const created = await prisma.repairOrder.create({
      data: {
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        watchBrand: order.watchBrand,
        watchModel: order.watchModel,
        status: order.status,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.statusChangedAt,
        statusChangedAt: order.statusChangedAt,
      },
    });

    await prisma.statusHistory.create({
      data: {
        repairOrderId: created.id,
        fromStatus: null,
        toStatus: OrderStatus.INTAKE,
        changedAt: order.createdAt,
        note: "Jam diterima dari klien.",
      },
    });

    if (order.status !== OrderStatus.INTAKE) {
      await prisma.statusHistory.create({
        data: {
          repairOrderId: created.id,
          fromStatus: OrderStatus.INTAKE,
          toStatus: order.status,
          changedAt: order.statusChangedAt,
          note: "Update status.",
        },
      });
    }

    if (order.orderNumber === "WY-0003") {
      await prisma.assessment.create({
        data: {
          repairOrderId: created.id,
          estimatedPrice: 350000,
          diagnosis: "Kaca depan retak akibat benturan, perlu ganti kaca + gasket.",
          decision: "PENDING",
        },
      });
    }
  }

  await prisma.counter.upsert({
    where: { id: "order_number" },
    update: { value: seedOrders.length },
    create: { id: "order_number", value: seedOrders.length },
  });

  console.log("Seed selesai. Login staff:");
  console.log("  email:    admin@watchyoung.local");
  console.log("  password: watchyoung123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
