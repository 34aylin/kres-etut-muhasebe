import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { formatMoney } from "@/lib/money";
import { ParentFormDialog } from "./parent-form-dialog";
import { deleteParent } from "./actions";

const PAGE_SIZE = 10;

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const session = await auth();
  const user = session!.user;
  const canManage = canManageRecords(user.role);

  const db = forTenant(user.tenantId);

  const where = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [parents, total] = await Promise.all([
    db.parent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { students: { include: { student: true } } },
    }),
    db.parent.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const parentIds = parents.map((p) => p.id);
  const [chargedSums, paidSums] = await Promise.all([
    db.charge.groupBy({
      by: ["parentId"],
      where: { parentId: { in: parentIds } },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["parentId"],
      where: {
        parentId: { in: parentIds },
        type: "INCOME",
        chargeId: { not: null },
      },
      _sum: { amount: true },
    }),
  ]);
  const chargedByParent = new Map(
    chargedSums.map((row) => [row.parentId, Number(row._sum.amount ?? 0)]),
  );
  const paidByParent = new Map(
    paidSums.map((row) => [
      row.parentId as string,
      Number(row._sum.amount ?? 0),
    ]),
  );
  function debtOf(parentId: string) {
    return (
      (chargedByParent.get(parentId) ?? 0) - (paidByParent.get(parentId) ?? 0)
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Veliler</CardTitle>
        {canManage && (
          <ParentFormDialog
            mode="create"
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                Yeni Veli
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <SearchInput placeholder="Ad, soyad, telefon veya e-posta ara..." />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Öğrenciler</TableHead>
              <TableHead>Borç</TableHead>
              {canManage && (
                <TableHead className="text-right">İşlemler</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {parents.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className="text-center text-muted-foreground"
                >
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            )}
            {parents.map((parent) => (
              <TableRow key={parent.id}>
                <TableCell>
                  <Link
                    href={`/parents/${parent.id}`}
                    className="font-medium underline"
                  >
                    {parent.firstName} {parent.lastName}
                  </Link>
                </TableCell>
                <TableCell>{parent.phone ?? "—"}</TableCell>
                <TableCell>{parent.email ?? "—"}</TableCell>
                <TableCell>
                  {parent.students.length === 0
                    ? "—"
                    : parent.students
                        .map(
                          (sp) =>
                            `${sp.student.firstName} ${sp.student.lastName}`,
                        )
                        .join(", ")}
                </TableCell>
                <TableCell>
                  {debtOf(parent.id) > 0 ? (
                    <Badge variant="outline" className="text-red-600">
                      {formatMoney(debtOf(parent.id))}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="flex justify-end gap-2">
                    <ParentFormDialog
                      mode="edit"
                      parentId={parent.id}
                      defaultValues={{
                        firstName: parent.firstName,
                        lastName: parent.lastName,
                        phone: parent.phone ?? "",
                        email: parent.email ?? "",
                        nationalId: parent.nationalId ?? "",
                      }}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <DeleteConfirmButton
                      title="Veliyi sil"
                      description={`${parent.firstName} ${parent.lastName} kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
                      onConfirm={deleteParent.bind(null, parent.id)}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Trash2 className="size-4" />
                        </Button>
                      }
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationControls page={page} totalPages={totalPages} />
      </CardContent>
    </Card>
  );
}
