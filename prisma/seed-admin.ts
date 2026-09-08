import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

// Safe to run on every deploy: only ensures the admin account exists,
// never touches customers/orders (unlike prisma/seed.ts, which is demo-data
// only and wipes existing rows — do not run that one in production).
async function main() {
  const passwordHash = await bcrypt.hash("watchyoung123", 10);
  await prisma.user.upsert({
    where: { email: "admin@watchyoung.local" },
    update: {},
    create: { name: "Admin WatchYongs", email: "admin@watchyoung.local", passwordHash },
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
