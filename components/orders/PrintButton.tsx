"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PrintButton({ className }: { className?: string }) {
  return (
    <Button onClick={() => window.print()} className={cn("print:hidden", className)}>
      <Printer className="h-4 w-4" />
      Print
    </Button>
  );
}
