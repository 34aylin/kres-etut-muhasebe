import type { Prisma, TransactionType } from "@/generated/prisma/client";

type Money = Prisma.Decimal | number | string;
type TxLike = {
  date: Date;
  type: TransactionType;
  amount: Money;
  categoryId: string | null;
};

export type MonthlyPoint = {
  month: string;
  label: string;
  income: number;
  expense: number;
};

/**
 * Referans tarihten geriye doğru `monthsBack` ay için gelir/gider toplamını
 * çıkarır. Boş aylar da 0 olarak listede yer alır (grafikte boşluk kalmasın).
 */
export function groupTransactionsByMonth(
  transactions: TxLike[],
  monthsBack: number,
  referenceDate: Date = new Date(),
): MonthlyPoint[] {
  const months: MonthlyPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth() - i,
        1,
      ),
    );
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({
      month: key,
      label: d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
      income: 0,
      expense: 0,
    });
  }

  const byKey = new Map(months.map((m) => [m.month, m]));
  for (const tx of transactions) {
    const key = `${tx.date.getUTCFullYear()}-${String(tx.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = byKey.get(key);
    if (!bucket) continue;
    if (tx.type === "INCOME") bucket.income += Number(tx.amount);
    else bucket.expense += Number(tx.amount);
  }

  return months;
}

export type CategoryTotal = {
  categoryId: string | null;
  name: string;
  total: number;
};

/**
 * Verilen işlemleri kategoriye göre gruplayıp azalan sırada toplam çıkarır.
 * `categoryId` null olanlar "Kategorisiz" altında toplanır.
 */
export function summarizeByCategory(
  transactions: TxLike[],
  categoryNames: Map<string, string>,
): CategoryTotal[] {
  const totals = new Map<string | null, number>();
  for (const tx of transactions) {
    const key = tx.categoryId;
    totals.set(key, (totals.get(key) ?? 0) + Number(tx.amount));
  }

  return Array.from(totals.entries())
    .map(([categoryId, total]) => ({
      categoryId,
      name: categoryId
        ? (categoryNames.get(categoryId) ?? "Bilinmeyen Kategori")
        : "Kategorisiz",
      total,
    }))
    .sort((a, b) => b.total - a.total);
}
