import { Pencil, Plus, Trash2 } from "lucide-react";

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
import { PaginationControls } from "@/components/shared/pagination-controls";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { TransactionFilters } from "./transaction-filters";
import { deleteTransaction } from "./actions";

const PAGE_SIZE = 15;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const { type, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const session = await auth();
  const user = session!.user;
  const canManage = canManageRecords(user.role);
  const db = forTenant(user.tenantId);

  const typeFilter: "INCOME" | "EXPENSE" | undefined =
    type === "INCOME" ? "INCOME" : type === "EXPENSE" ? "EXPENSE" : undefined;
  const where = typeFilter ? { type: typeFilter } : {};

  const [transactions, total, accounts, categories, students, parents] =
    await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { account: true, category: true, student: true, parent: true },
      }),
      db.transaction.count({ where }),
      db.account.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      db.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      db.student.findMany({ orderBy: { firstName: "asc" } }),
      db.parent.findMany({ orderBy: { firstName: "asc" } }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const accountOptions = accounts.map((a) => ({ id: a.id, label: a.name }));
  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));
  const studentOptions = students.map((s) => ({
    id: s.id,
    label: `${s.firstName} ${s.lastName}`,
  }));
  const parentOptions = parents.map((p) => ({
    id: p.id,
    label: `${p.firstName} ${p.lastName}`,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gelir/Gider Hareketleri</CardTitle>
        {canManage && (
          <TransactionFormDialog
            mode="create"
            accounts={accountOptions}
            categories={categoryOptions}
            students={studentOptions}
            parents={parentOptions}
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                Yeni Hareket
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <TransactionFilters value={typeFilter} />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Hesap</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Veli/Öğrenci</TableHead>
              <TableHead>Ödeme</TableHead>
              {canManage && (
                <TableHead className="text-right">İşlemler</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 8 : 7}
                  className="text-center text-muted-foreground"
                >
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            )}
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.date.toLocaleDateString("tr-TR")}</TableCell>
                <TableCell>
                  <Badge
                    variant={tx.type === "INCOME" ? "secondary" : "outline"}
                  >
                    {TRANSACTION_TYPE_LABELS[tx.type]}
                  </Badge>
                </TableCell>
                <TableCell>{tx.category?.name ?? "—"}</TableCell>
                <TableCell>{tx.account.name}</TableCell>
                <TableCell
                  className={
                    tx.type === "INCOME"
                      ? "font-medium text-emerald-600"
                      : "font-medium text-red-600"
                  }
                >
                  {tx.type === "INCOME" ? "+" : "-"}
                  {formatMoney(tx.amount)}
                </TableCell>
                <TableCell>
                  {tx.parent
                    ? `${tx.parent.firstName} ${tx.parent.lastName}`
                    : tx.student
                      ? `${tx.student.firstName} ${tx.student.lastName}`
                      : "—"}
                </TableCell>
                <TableCell>{PAYMENT_METHOD_LABELS[tx.paymentMethod]}</TableCell>
                {canManage && (
                  <TableCell className="flex justify-end gap-2">
                    <TransactionFormDialog
                      mode="edit"
                      transactionId={tx.id}
                      accounts={accountOptions}
                      categories={categoryOptions}
                      students={studentOptions}
                      parents={parentOptions}
                      defaultValues={{
                        type: tx.type,
                        amount: Number(tx.amount),
                        date: tx.date.toISOString().slice(0, 10),
                        accountId: tx.accountId,
                        categoryId: tx.categoryId ?? "",
                        studentId: tx.studentId ?? "",
                        parentId: tx.parentId ?? "",
                        paymentMethod: tx.paymentMethod,
                        description: tx.description ?? "",
                      }}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <DeleteConfirmButton
                      title="Hareketi sil"
                      description="Bu hareket kalıcı olarak silinecek ve ilgili hesap bakiyesini/borç durumunu etkileyecektir."
                      onConfirm={deleteTransaction.bind(null, tx.id)}
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
