import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";

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
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { PROGRAM_TYPE_LABELS, STUDENT_STATUS_LABELS } from "@/lib/labels";
import { StudentFormDialog } from "../student-form-dialog";
import { removeParentLink, deleteEnrollment } from "../actions";
import { AddParentLinkDialog } from "./add-parent-link-dialog";
import { EnrollmentFormDialog } from "./enrollment-form-dialog";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user;
  const canManage = canManageRecords(user.role);
  const db = forTenant(user.tenantId);

  const student = await db.student.findUnique({
    where: { id },
    include: {
      parents: { include: { parent: true } },
      enrollments: { orderBy: { startDate: "desc" } },
    },
  });

  if (!student) notFound();

  const linkedParentIds = new Set(student.parents.map((sp) => sp.parentId));
  const allParents = canManage
    ? await db.parent.findMany({ orderBy: { firstName: "asc" } })
    : [];
  const availableParents = allParents.filter(
    (parent) => !linkedParentIds.has(parent.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/students"
          className="text-sm text-muted-foreground underline"
        >
          ← Öğrencilere dön
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {student.firstName} {student.lastName}
            </CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">
                {STUDENT_STATUS_LABELS[student.status]}
              </Badge>
              {student.birthDate && (
                <span className="text-sm text-muted-foreground">
                  Doğum:{" "}
                  {new Date(student.birthDate).toLocaleDateString("tr-TR")}
                </span>
              )}
            </div>
          </div>
          {canManage && (
            <StudentFormDialog
              mode="edit"
              studentId={student.id}
              defaultValues={{
                firstName: student.firstName,
                lastName: student.lastName,
                birthDate: student.birthDate
                  ? student.birthDate.toISOString().slice(0, 10)
                  : "",
                status: student.status,
                parentIds: [],
              }}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="size-4" />
                  Düzenle
                </Button>
              }
            />
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Bağlı Veliler</CardTitle>
          {canManage && (
            <AddParentLinkDialog
              studentId={student.id}
              availableParents={availableParents}
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="size-4" />
                  Veli Bağla
                </Button>
              }
            />
          )}
        </CardHeader>
        <CardContent>
          {student.parents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz bağlı veli yok.
            </p>
          ) : (
            <ul className="space-y-2">
              {student.parents.map((sp) => (
                <li
                  key={sp.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span>
                    <Link href="/parents" className="underline">
                      {sp.parent.firstName} {sp.parent.lastName}
                    </Link>
                    {sp.relation && (
                      <span className="ml-2 text-muted-foreground">
                        ({sp.relation})
                      </span>
                    )}
                  </span>
                  {canManage && (
                    <DeleteConfirmButton
                      title="Veli bağlantısını kaldır"
                      description={`${sp.parent.firstName} ${sp.parent.lastName} bu öğrenciden ayrılacak (veli kaydı silinmez).`}
                      onConfirm={removeParentLink.bind(null, sp.id, student.id)}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <X className="size-4" />
                        </Button>
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Kayıtlar (Kreş/Etüt)</CardTitle>
          {canManage && (
            <EnrollmentFormDialog
              mode="create"
              studentId={student.id}
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="size-4" />
                  Yeni Kayıt
                </Button>
              }
            />
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Durum</TableHead>
                {canManage && (
                  <TableHead className="text-right">İşlemler</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.enrollments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    className="text-center text-muted-foreground"
                  >
                    Henüz kayıt yok.
                  </TableCell>
                </TableRow>
              )}
              {student.enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    {PROGRAM_TYPE_LABELS[enrollment.program]}
                  </TableCell>
                  <TableCell>
                    {enrollment.startDate.toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell>
                    {enrollment.endDate
                      ? enrollment.endDate.toLocaleDateString("tr-TR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {STUDENT_STATUS_LABELS[enrollment.status]}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="flex justify-end gap-2">
                      <EnrollmentFormDialog
                        mode="edit"
                        studentId={student.id}
                        enrollmentId={enrollment.id}
                        defaultValues={{
                          program: enrollment.program,
                          startDate: enrollment.startDate
                            .toISOString()
                            .slice(0, 10),
                          endDate: enrollment.endDate
                            ? enrollment.endDate.toISOString().slice(0, 10)
                            : "",
                          status: enrollment.status,
                        }}
                        trigger={
                          <Button variant="outline" size="icon">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <DeleteConfirmButton
                        title="Kaydı sil"
                        description="Bu kayıt kalıcı olarak silinecek."
                        onConfirm={deleteEnrollment.bind(
                          null,
                          enrollment.id,
                          student.id,
                        )}
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
        </CardContent>
      </Card>
    </div>
  );
}
