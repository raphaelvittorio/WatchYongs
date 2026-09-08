import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
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
import { UserRowActions } from "@/components/users/UserRowActions";

export default async function UsersPage() {
  const [users, currentUser] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    getCurrentUser(),
  ]);

  const isLastUser = users.length <= 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Staff</h1>
          <p className="text-sm text-muted-foreground">{users.length} akun staff</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<a href="/api/backup" />}
            nativeButton={false}
            className="flex-1 sm:flex-none"
          >
            Backup Database
          </Button>
          <Button
            render={<Link href="/users/new" />}
            nativeButton={false}
            className="flex-1 sm:flex-none"
          >
            + Staff Baru
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          {/* Mobile: tiap staff jadi satu blok, tombol aksi turun ke bawah. */}
          <ul className="divide-y md:hidden">
            {users.map((user) => (
              <li key={user.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">
                    {user.name}
                    {currentUser?.id === user.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(kamu)</span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Dibuat {user.createdAt.toLocaleDateString("id-ID")}
                  </p>
                </div>
                <UserRowActions
                  userId={user.id}
                  userName={user.name}
                  isSelf={currentUser?.id === user.id}
                  isLastUser={isLastUser}
                />
              </li>
            ))}
          </ul>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {currentUser?.id === user.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(kamu)</span>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.createdAt.toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <UserRowActions
                        userId={user.id}
                        userName={user.name}
                        isSelf={currentUser?.id === user.id}
                        isLastUser={isLastUser}
                      />
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
