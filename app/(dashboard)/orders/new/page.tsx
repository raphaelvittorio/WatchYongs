import { prisma } from "@/lib/db";
import { branchFieldOptions, requireScopePage } from "@/lib/branch";
import { IntakeForm } from "@/components/orders/IntakeForm";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "Intake Baru" };

export default async function NewOrderPage() {
  const scope = await requireScopePage();
  // Customer dipakai bersama: staff cabang mana pun bisa memilih customer lama.
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        back={{ href: "/orders", label: "Order Reparasi" }}
        eyebrow="Order baru"
        title="Intake Jam"
        description="Catat jam yang baru diterima dari customer. Nomor order dibuat otomatis."
      />
      <IntakeForm customers={customers} branchOptions={branchFieldOptions(scope)} />
    </div>
  );
}
