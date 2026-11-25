import Link from "next/link";
import { ChevronRight, Plus, Search, Users, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { branchLabel, customerListWhere, filterWhere, requireScopePage } from "@/lib/branch";
import { BranchBadge } from "@/components/shared/BranchBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/format";

export const metadata = { title: "Customer" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const scope = await requireScopePage();
  // Pencarian menjangkau customer semua cabang; jumlah & order terakhir tetap
  // hanya menghitung order cabang yang sedang dilihat.
  const orderWhere = filterWhere(scope);

  const [customers, totalCustomers] = await Promise.all([
    prisma.customer.findMany({
      where: customerListWhere(scope, q),
      orderBy: { name: "asc" },
      include: {
        branch: true,
        _count: { select: { orders: { where: orderWhere } } },
        orders: {
          where: orderWhere,
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.customer.count({ where: customerListWhere(scope, null) }),
  ]);
  // Tandai customer dari cabang asal lain (hasil pencarian lintas cabang).
  const showHomeBranch = (branchId: string) =>
    scope.filterBranchId === null || branchId !== scope.filterBranchId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer"
        description={
          q
            ? `${customers.length} customer dari semua cabang cocok dengan "${q}"`
            : `${branchLabel(scope.branch)} · ${totalCustomers} customer`
        }
        actions={
          <Button render={<Link href="/customers/new" />} nativeButton={false}>
            <Plus />
            Customer Baru
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <form method="get" className="flex gap-2 border-b p-4 sm:p-5">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Cari nama atau no. HP..."
              defaultValue={q ?? ""}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Cari
          </Button>
          {q && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Hapus pencarian"
              render={<Link href="/customers" />}
              nativeButton={false}
            >
              <X />
            </Button>
          )}
        </form>

        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={q ? "Tidak ada customer yang cocok" : "Belum ada customer"}
            description={
              q
                ? "Coba kata kunci lain, atau daftarkan customer baru."
                : "Customer otomatis terdaftar saat intake, atau tambahkan manual."
            }
            action={
              <Button
                variant="outline"
                render={<Link href="/customers/new" />}
                nativeButton={false}
              >
                <Plus />
                Customer Baru
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile: daftar kartu yang bisa ditekan, tanpa scroll horizontal. */}
            <ul className="divide-y md:hidden">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <Link
                    href={`/customers/${customer.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-muted"
                  >
                    <UserAvatar name={customer.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{customer.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {customer.phone}
                        {showHomeBranch(customer.branchId) && <BranchBadge branch={customer.branch} />}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                      {customer._count.orders} order
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Customer</TableHead>
                    <TableHead>No. HP</TableHead>
                    <TableHead>Order Terakhir</TableHead>
                    <TableHead className="text-right">Jumlah Order</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Buka</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="group relative cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar name={customer.name} size="sm" />
                          <div className="min-w-0">
                            <Link
                              href={`/customers/${customer.id}`}
                              className="font-semibold after:absolute after:inset-0 after:content-['']"
                            >
                              {customer.name}
                            </Link>
                            {customer.email && (
                              <p className="max-w-60 truncate text-xs text-muted-foreground">
                                {customer.email}
                              </p>
                            )}
                            {showHomeBranch(customer.branchId) && (
                              <BranchBadge branch={customer.branch} className="mt-1" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{customer.phone}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.orders[0] ? formatShortDate(customer.orders[0].createdAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex min-w-8 justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                          {customer._count.orders}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
