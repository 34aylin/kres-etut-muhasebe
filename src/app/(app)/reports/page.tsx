import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";

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
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { groupTransactionsByMonth, summarizeByCategory } from "@/lib/reports";
import { DateRangeFilter } from "./date-range-filter";
import { MonthlyTrendChart } from "./monthly-trend-chart";

function startOfMonthIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  if (!canManageRecords(user.role)) redirect("/");

  const { from = startOfMonthIso(), to = todayIso() } = await searchParams;
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);

  const db = forTenant(user.tenantId);

  const [
    rangeTransactions,
    categories,
    accounts,
    incomeSums,
    expenseSums,
    twelveMonthTx,
  ] = await Promise.all([
    db.transaction.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      select: { type: true, amount: true, categoryId: true, date: true },
    }),
    db.category.findMany({ select: { id: true, name: true, type: true } }),
    db.account.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
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
    db.transaction.findMany({
      where: {
        date: {
          gte: new Date(
            Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth() - 11,
              1,
            ),
          ),
        },
      },
      select: { type: true, amount: true, categoryId: true, date: true },
    }),
  ]);

  const totalIncome = rangeTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = rangeTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const net = totalIncome - totalExpense;

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const incomeBreakdown = summarizeByCategory(
    rangeTransactions.filter((t) => t.type === "INCOME"),
    categoryNames,
  );
  const expenseBreakdown = summarizeByCategory(
    rangeTransactions.filter((t) => t.type === "EXPENSE"),
    categoryNames,
  );

  const incomeByAccount = new Map(
    incomeSums.map((row) => [row.accountId, Number(row._sum.amount ?? 0)]),
  );
  const expenseByAccount = new Map(
    expenseSums.map((row) => [row.accountId, Number(row._sum.amount ?? 0)]),
  );
  const totalBalance = accounts.reduce(
    (sum, a) =>
      sum +
      (incomeByAccount.get(a.id) ?? 0) -
      (expenseByAccount.get(a.id) ?? 0),
    0,
  );

  const monthlyTrend = groupTransactionsByMonth(twelveMonthTx, 12);

  const [chargedSums, paidSums] = await Promise.all([
    db.charge.groupBy({ by: ["parentId"], _sum: { amount: true } }),
    db.transaction.groupBy({
      by: ["parentId"],
      where: { type: "INCOME", chargeId: { not: null } },
      _sum: { amount: true },
    }),
  ]);
  const paidByParent = new Map(
    paidSums.map((row) => [
      row.parentId as string,
      Number(row._sum.amount ?? 0),
    ]),
  );
  const debtors = chargedSums
    .map((row) => ({
      parentId: row.parentId,
      debt:
        Number(row._sum.amount ?? 0) - (paidByParent.get(row.parentId) ?? 0),
    }))
    .filter((d) => d.debt > 0)
    .sort((a, b) => b.debt - a.debt);
  const debtorParents = await db.parent.findMany({
    where: { id: { in: debtors.map((d) => d.parentId) } },
    select: { id: true, firstName: true, lastName: true },
  });
  const parentNameById = new Map(
    debtorParents.map((p) => [p.id, `${p.firstName} ${p.lastName}`]),
  );
  const totalDebt = debtors.reduce((sum, d) => sum + d.debt, 0);

  const exportQuery = `from=${from}&to=${to}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4">
          <div>
            <CardTitle>Raporlar</CardTitle>
          </div>
          <DateRangeFilter from={from} to={to} />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Toplam Gelir</p>
            <p className="text-xl font-semibold text-emerald-600">
              {formatMoney(totalIncome)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Toplam Gider</p>
            <p className="text-xl font-semibold text-red-600">
              {formatMoney(totalExpense)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Net (Kâr/Zarar)</p>
            <p
              className={`text-xl font-semibold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatMoney(net)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Son 12 Ay — Gelir/Gider Trendi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyTrendChart data={monthlyTrend} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Gelir Kırılımı (seçili aralık)
            </CardTitle>
            <a href={`/api/reports/transactions?${exportQuery}&type=INCOME`}>
              <Button variant="outline" size="sm">
                <Download className="size-4" />
                CSV
              </Button>
            </a>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      Kayıt yok.
                    </TableCell>
                  </TableRow>
                )}
                {incomeBreakdown.map((row) => (
                  <TableRow key={row.categoryId ?? "none"}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Gider Kırılımı (seçili aralık)
            </CardTitle>
            <a href={`/api/reports/transactions?${exportQuery}&type=EXPENSE`}>
              <Button variant="outline" size="sm">
                <Download className="size-4" />
                CSV
              </Button>
            </a>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      Kayıt yok.
                    </TableCell>
                  </TableRow>
                )}
                {expenseBreakdown.map((row) => (
                  <TableRow key={row.categoryId ?? "none"}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kasa/Banka Bakiye Raporu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hesap</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead className="text-right">Bakiye</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{ACCOUNT_TYPE_LABELS[account.type]}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(
                      (incomeByAccount.get(account.id) ?? 0) -
                        (expenseByAccount.get(account.id) ?? 0),
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">
                  Toplam
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatMoney(totalBalance)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Veli Borç / Alacak Listesi
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Toplam bekleyen borç:{" "}
              <span className="font-medium text-red-600">
                {formatMoney(totalDebt)}
              </span>
            </p>
          </div>
          <a href="/api/reports/debts">
            <Button variant="outline" size="sm">
              <Download className="size-4" />
              CSV
            </Button>
          </a>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veli</TableHead>
                <TableHead className="text-right">Kalan Borç</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debtors.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    Bekleyen borç yok.
                  </TableCell>
                </TableRow>
              )}
              {debtors.map((d) => (
                <TableRow key={d.parentId}>
                  <TableCell>
                    <Link href={`/parents/${d.parentId}`} className="underline">
                      {parentNameById.get(d.parentId) ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-red-600">
                      {formatMoney(d.debt)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
