import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Customer</h1>
          <p className="text-sm text-muted-foreground">
            {customers.length} customer terdaftar
          </p>
        </div>
        <Button
          render={<Link href="/customers/new" />}
          nativeButton={false}
          className="w-full sm:w-auto"
        >
          + Customer Baru
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {/* Mobile: daftar kartu yang bisa ditekan, tanpa scroll horizontal. */}
          <ul className="divide-y md:hidden">
            {customers.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Belum ada customer.
              </li>
            )}
            {customers.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/customers/${customer.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors active:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.phone} · {customer._count.orders} order
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>No. HP</TableHead>
                  <TableHead className="text-right">Jumlah Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Belum ada customer.
                    </TableCell>
                  </TableRow>
                )}
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="text-right">
                      {customer._count.orders}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
