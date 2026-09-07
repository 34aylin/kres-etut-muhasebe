import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

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
import { StatusFilter } from "./status-filter";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { STUDENT_STATUS_LABELS } from "@/lib/labels";
import { studentStatusValues } from "@/lib/validations/student";
import { StudentFormDialog } from "./student-form-dialog";
import { deleteStudent } from "./actions";

const PAGE_SIZE = 10;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const { q = "", page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const session = await auth();
  const user = session!.user;
  const canManage = canManageRecords(user.role);

  const db = forTenant(user.tenantId);

  const statusFilter =
    status && (studentStatusValues as readonly string[]).includes(status)
      ? (status as (typeof studentStatusValues)[number])
      : undefined;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [students, total, parents] = await Promise.all([
    db.student.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { parents: { include: { parent: true } } },
    }),
    db.student.count({ where }),
    canManage
      ? db.parent.findMany({ orderBy: { firstName: "asc" } })
      : Promise.resolve([]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Öğrenciler</CardTitle>
        {canManage && (
          <StudentFormDialog
            mode="create"
            availableParents={parents}
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                Yeni Öğrenci
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput placeholder="Ad veya soyad ara..." />
          <StatusFilter value={statusFilter} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Doğum Tarihi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Veli(ler)</TableHead>
              {canManage && (
                <TableHead className="text-right">İşlemler</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 5 : 4}
                  className="text-center text-muted-foreground"
                >
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            )}
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Link
                    href={`/students/${student.id}`}
                    className="font-medium underline"
                  >
                    {student.firstName} {student.lastName}
                  </Link>
                </TableCell>
                <TableCell>
                  {student.birthDate
                    ? new Date(student.birthDate).toLocaleDateString("tr-TR")
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {STUDENT_STATUS_LABELS[student.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {student.parents.length === 0
                    ? "—"
                    : student.parents
                        .map(
                          (sp) =>
                            `${sp.parent.firstName} ${sp.parent.lastName}`,
                        )
                        .join(", ")}
                </TableCell>
                {canManage && (
                  <TableCell className="flex justify-end gap-2">
                    <DeleteConfirmButton
                      title="Öğrenciyi sil"
                      description={`${student.firstName} ${student.lastName} kalıcı olarak silinecek (kayıtları ve veli bağlantıları dahil). Bu işlem geri alınamaz.`}
                      onConfirm={deleteStudent.bind(null, student.id)}
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
