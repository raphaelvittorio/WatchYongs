import { UserPlus } from "lucide-react";
import { branchFieldOptions, requireScopePage } from "@/lib/branch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewCustomerForm } from "@/components/customers/NewCustomerForm";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = { title: "Customer Baru" };

export default async function NewCustomerPage() {
  const scope = await requireScopePage();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        back={{ href: "/customers", label: "Customer" }}
        title="Customer Baru"
        description="Daftarkan customer sebelum atau tanpa langsung membuat order."
      />
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
              <UserPlus className="size-5" />
            </span>
            <div>
              <CardTitle>Data Customer</CardTitle>
              <CardDescription>Nama & No. HP wajib, sisanya opsional.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <NewCustomerForm branchOptions={branchFieldOptions(scope)} />
        </CardContent>
      </Card>
    </div>
  );
}
