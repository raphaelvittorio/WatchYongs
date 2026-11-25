import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

// Safe to run on every deploy: only ensures the admin account exists,
// never touches customers/orders (unlike prisma/seed.ts, which is demo-data
// only and wipes existing rows — do not run that one in production).
// The password only applies when the admin account is first created; set
// ADMIN_INITIAL_PASSWORD in production so the public default isn't used.
async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_INITIAL_PASSWORD || "watchyoung123",
    10,
  );
  await prisma.user.upsert({
    where: { email: "admin@watchyoung.local" },
    update: {},
    create: { name: "Admin WatchYongs", email: "admin@watchyoung.local", passwordHash, role: "MASTER" },
  });
  console.log("Admin user siap: admin@watchyoung.local");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
