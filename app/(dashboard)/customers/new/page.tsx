"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customer Baru</h1>
        <p className="text-sm text-muted-foreground">
          Daftarkan customer sebelum atau tanpa langsung membuat order.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <CustomerForm
            onSuccess={(customer) => {
              router.push(`/customers/${customer.id}`);
              router.refresh();
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
