"use client";

import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers/CustomerForm";
import type { BranchFieldOptions } from "@/components/branches/BranchField";

export function NewCustomerForm({ branchOptions }: { branchOptions: BranchFieldOptions }) {
  const router = useRouter();
  return (
    <CustomerForm
      branchOptions={branchOptions}
      onSuccess={(customer) => {
        router.push(`/customers/${customer.id}`);
        router.refresh();
      }}
    />
  );
}
