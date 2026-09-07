import type { Prisma, TransactionType } from "@/generated/prisma/client";

type Money = Prisma.Decimal | number | string;

type PaymentLike = { amount: Money; type: TransactionType };
type ChargeLike = { amount: Money; payments: PaymentLike[] };

export type ChargeStatus = "PENDING" | "PARTIAL" | "PAID";

/**
 * Bir borca (Charge) yapılan tahsilatların toplamı. Yalnızca INCOME tipli
 * hareketler tahsilat sayılır — bir ödeme kaydı sonradan /transactions
 * üzerinden GİDER'e çevrilse bile bu toplam bozulmaz.
 */
export function sumPayments(payments: PaymentLike[]): number {
  return payments
    .filter((p) => p.type === "INCOME")
    .reduce((sum, p) => sum + Number(p.amount), 0);
}

export function computeChargeSummary(charge: ChargeLike) {
  const amount = Number(charge.amount);
  const paid = sumPayments(charge.payments);
  const remaining = amount - paid;
  const status: ChargeStatus =
    remaining <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";
  return { amount, paid, remaining, status };
}

/**
 * Bir velinin tüm borçlarından tek bir özet çıkarır. `totalPaid` ve
 * `remainingDebt` kasıtlı olarak AYNI `charges` listesinden türetilir ki
 * ekranda gösterilen rakamlar birbiriyle asla çelişmesin.
 */
export function computeParentDebtSummary(charges: ChargeLike[]) {
  let totalCharged = 0;
  let totalPaid = 0;

  for (const charge of charges) {
    const summary = computeChargeSummary(charge);
    totalCharged += summary.amount;
    totalPaid += summary.paid;
  }

  return {
    totalCharged,
    totalPaid,
    remainingDebt: totalCharged - totalPaid,
  };
}
