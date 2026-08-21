import { prisma } from "@/lib/db";
import { IntakeForm } from "@/components/orders/IntakeForm";

export default async function NewOrderPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Intake Baru</h1>
        <p className="text-sm text-muted-foreground">
          Catat jam yang baru diterima dari customer.
        </p>
      </div>
      <IntakeForm customers={customers} />
    </div>
  );
}
