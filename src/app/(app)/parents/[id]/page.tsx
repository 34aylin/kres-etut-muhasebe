import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { formatMoney } from "@/lib/money";
import { FeePlanFormDialog } from "../fee-plan-form-dialog";
import { RecordPaymentDialog } from "../record-payment-dialog";
import { deleteCharge, deleteFeePlan } from "../finance-actions";

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user;
  const canManage = canManageRecords(user.role);
  const db = forTenant(user.tenantId);

  const parent = await db.parent.findUnique({
    where: { id },
    include: { students: { include: { student: true } } },
  });

  if (!parent) notFound();

  const [charges, feePlans, accounts, incomeCategories, paidTotal] =
    await Promise.all([
      db.charge.findMany({
        where: { parentId: id },
        orderBy: { dueDate: "asc" },
        include: { student: true, payments: true },
      }),
      db.feePlan.findMany({
        where: { parentId: id },
        orderBy: { createdAt: "desc" },
      }),
      db.account.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      db.category.findMany({
        where: { isActive: true, type: "INCOME" },
        orderBy: { name: "asc" },
      }),
      db.transaction.aggregate({
        where: { parentId: id, type: "INCOME" },
        _sum: { amount: true },
      }),
    ]);

  const totalCharged = charges.reduce(
    (sum, charge) => sum + Number(charge.amount),
    0,
  );
  const totalPaidAgainstCharges = charges.reduce(
    (sum, charge) =>
      sum + charge.payments.reduce((s, p) => s + Number(p.amount), 0),
    0,
  );
  const remainingDebt = totalCharged - totalPaidAgainstCharges;
  const totalPaidOverall = Number(paidTotal._sum.amount ?? 0);

  const studentOptions = parent.students.map((sp) => ({
    id: sp.student.id,
    label: `${sp.student.firstName} ${sp.student.lastName}`,
  }));
  const accountOptions = accounts.map((a) => ({ id: a.id, label: a.name }));
  const incomeCategoryOptions = incomeCategories.map((c) => ({
    id: c.id,
    label: c.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/parents"
          className="text-sm text-muted-foreground underline"
        >
          ← Velilere dön
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {parent.firstName} {parent.lastName}
          </CardTitle>
          <CardDescription>
            {parent.phone ?? "Telefon yok"} · {parent.email ?? "E-posta yok"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Toplam Tahakkuk</p>
            <p className="text-lg font-semibold">{formatMoney(totalCharged)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Toplam Ödenen</p>
            <p className="text-lg font-semibold text-emerald-600">
              {formatMoney(totalPaidOverall)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Kalan Borç</p>
            <p
              className={`text-lg font-semibold ${remainingDebt > 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              {formatMoney(remainingDebt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Ücret Planları</CardTitle>
          {canManage && (
            <FeePlanFormDialog
              parentId={id}
              students={studentOptions}
              incomeCategories={incomeCategoryOptions}
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="size-4" />
                  Yeni Plan
                </Button>
              }
            />
          )}
        </CardHeader>
        <CardContent>
          {feePlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz bir ücret planı yok.
            </p>
          ) : (
            <ul className="space-y-2">
              {feePlans.map((plan) => (
                <li
                  key={plan.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span>
                    {plan.name} — {plan.installmentCount} taksit x{" "}
                    {formatMoney(plan.installmentAmount)}
                  </span>
                  {canManage && (
                    <DeleteConfirmButton
                      title="Planı sil"
                      description="Bu plan ve ödenmemiş taksitleri silinecek. Tahsil edilmiş taksitler varsa önce onları kaldırın."
                      onConfirm={deleteFeePlan.bind(null, plan.id, id)}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Trash2 className="size-4" />
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
        <CardHeader>
          <CardTitle className="text-base">Borç / Tahsilat Dökümü</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Açıklama</TableHead>
                <TableHead>Öğrenci</TableHead>
                <TableHead>Vade</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Ödenen</TableHead>
                <TableHead>Kalan</TableHead>
                <TableHead>Durum</TableHead>
                {canManage && (
                  <TableHead className="text-right">İşlemler</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 8 : 7}
                    className="text-center text-muted-foreground"
                  >
                    Henüz borç kaydı yok.
                  </TableCell>
                </TableRow>
              )}
              {charges.map((charge) => {
                const paid = charge.payments.reduce(
                  (sum, p) => sum + Number(p.amount),
                  0,
                );
                const remaining = Number(charge.amount) - paid;
                const status =
                  remaining <= 0
                    ? "Ödendi"
                    : paid > 0
                      ? "Kısmi Ödendi"
                      : "Bekliyor";
                return (
                  <TableRow key={charge.id}>
                    <TableCell>{charge.description ?? "—"}</TableCell>
                    <TableCell>
                      {charge.student ? (
                        <Link
                          href={`/students/${charge.student.id}`}
                          className="underline"
                        >
                          {charge.student.firstName} {charge.student.lastName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {charge.dueDate.toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell>{formatMoney(charge.amount)}</TableCell>
                    <TableCell>{formatMoney(paid)}</TableCell>
                    <TableCell className={remaining > 0 ? "text-red-600" : ""}>
                      {formatMoney(remaining)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={remaining <= 0 ? "secondary" : "outline"}>
                        {status}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="flex justify-end gap-2">
                        {remaining > 0 && (
                          <RecordPaymentDialog
                            chargeId={charge.id}
                            parentId={id}
                            remainingAmount={remaining}
                            accounts={accountOptions}
                            trigger={<Button size="sm">Tahsilat Al</Button>}
                          />
                        )}
                        {charge.payments.length === 0 && (
                          <DeleteConfirmButton
                            title="Borcu sil"
                            description="Bu borç kaydı kalıcı olarak silinecek."
                            onConfirm={deleteCharge.bind(null, charge.id, id)}
                            trigger={
                              <Button variant="outline" size="icon">
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
