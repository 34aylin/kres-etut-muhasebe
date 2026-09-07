import { Pencil, Plus } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { ACCOUNT_TYPE_LABELS, CATEGORY_TYPE_LABELS } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { AccountFormDialog } from "./account-form-dialog";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeactivateButton } from "./deactivate-button";

export default async function AccountsPage() {
  const session = await auth();
  const user = session!.user;
  const canManage = canManageRecords(user.role);
  const db = forTenant(user.tenantId);

  const [accounts, categories, incomeSums, expenseSums] = await Promise.all([
    db.account.findMany({ orderBy: { createdAt: "asc" } }),
    db.category.findMany({ orderBy: { createdAt: "asc" } }),
    db.transaction.groupBy({
      by: ["accountId"],
      where: { type: "INCOME" },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["accountId"],
      where: { type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ]);

  const incomeByAccount = new Map(
    incomeSums.map((row) => [row.accountId, row._sum.amount ?? 0]),
  );
  const expenseByAccount = new Map(
    expenseSums.map((row) => [row.accountId, row._sum.amount ?? 0]),
  );

  function balanceOf(accountId: string) {
    const income = Number(incomeByAccount.get(accountId) ?? 0);
    const expense = Number(expenseByAccount.get(accountId) ?? 0);
    return income - expense;
  }

  return (
    <Tabs defaultValue="accounts">
      <TabsList>
        <TabsTrigger value="accounts">Kasa/Banka Hesapları</TabsTrigger>
        <TabsTrigger value="categories">Gelir/Gider Kategorileri</TabsTrigger>
      </TabsList>

      <TabsContent value="accounts">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kasa/Banka Hesapları</CardTitle>
            {canManage && (
              <AccountFormDialog
                mode="create"
                trigger={
                  <Button size="sm">
                    <Plus className="size-4" />
                    Yeni Hesap
                  </Button>
                }
              />
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead>Durum</TableHead>
                  {canManage && (
                    <TableHead className="text-right">İşlemler</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{ACCOUNT_TYPE_LABELS[account.type]}</TableCell>
                    <TableCell className="font-medium">
                      {formatMoney(balanceOf(account.id))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={account.isActive ? "secondary" : "outline"}
                      >
                        {account.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="flex justify-end gap-2">
                        <AccountFormDialog
                          mode="edit"
                          accountId={account.id}
                          defaultValues={{
                            name: account.name,
                            type: account.type,
                          }}
                          trigger={
                            <Button variant="outline" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        {account.isActive && (
                          <DeactivateButton
                            kind="account"
                            id={account.id}
                            label={account.name}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categories">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Gelir/Gider Kategorileri</CardTitle>
            {canManage && (
              <CategoryFormDialog
                mode="create"
                trigger={
                  <Button size="sm">
                    <Plus className="size-4" />
                    Yeni Kategori
                  </Button>
                }
              />
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Durum</TableHead>
                  {canManage && (
                    <TableHead className="text-right">İşlemler</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          category.type === "INCOME" ? "secondary" : "outline"
                        }
                      >
                        {CATEGORY_TYPE_LABELS[category.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {category.isActive ? "Aktif" : "Pasif"}
                    </TableCell>
                    {canManage && (
                      <TableCell className="flex justify-end gap-2">
                        <CategoryFormDialog
                          mode="edit"
                          categoryId={category.id}
                          defaultValues={{
                            name: category.name,
                            type: category.type,
                          }}
                          trigger={
                            <Button variant="outline" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        {category.isActive && (
                          <DeactivateButton
                            kind="category"
                            id={category.id}
                            label={category.name}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
