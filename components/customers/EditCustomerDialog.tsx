"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomerForm, type CustomerRecord } from "@/components/customers/CustomerForm";

export function EditCustomerDialog({ customer }: { customer: CustomerRecord }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4" />
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <CustomerForm
          customer={customer}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
