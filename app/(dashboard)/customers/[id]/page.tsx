import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { OrderCardList } from "@/components/orders/OrderCardList";
import { EditCustomerDialog } from "@/components/customers/EditCustomerDialog";
import { DeleteCustomerButton } from "@/components/customers/DeleteCustomerButton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" } } },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold break-words sm:text-2xl">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            {customer.phone}
            {customer.email ? ` · ${customer.email}` : ""}
          </p>
          {customer.address && (
            <p className="text-sm text-muted-foreground">{customer.address}</p>
          )}
          {(customer.ownerAge || customer.ownerCharacter) && (
            <p className="text-sm text-muted-foreground">
              {customer.ownerAge ? `${customer.ownerAge} tahun` : null}
              {customer.ownerAge && customer.ownerCharacter ? " · " : ""}
              {customer.ownerCharacter}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <EditCustomerDialog customer={customer} />
          {customer.orders.length === 0 && (
            <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Riwayat Order ({customer.orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderCardList
            className="md:hidden"
            orders={customer.orders}
            emptyLabel="Belum ada order."
            showCustomer={false}
          />
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Order</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada order.
                    </TableCell>
                  </TableRow>
                )}
                {customer.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {order.watchBrand}
                      {order.watchModel ? ` ${order.watchModel}` : ""}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {order.createdAt.toLocaleDateString("id-ID")}
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
