import "server-only";

import { prisma } from "@/lib/db";

const ORDER_NUMBER_COUNTER_ID = "order_number";
const ORDER_NUMBER_PREFIX = "WY-";

export async function generateOrderNumber(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: ORDER_NUMBER_COUNTER_ID },
    create: { id: ORDER_NUMBER_COUNTER_ID, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${ORDER_NUMBER_PREFIX}${String(counter.value).padStart(4, "0")}`;
}
