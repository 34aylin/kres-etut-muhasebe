import type { Prisma } from "@/generated/prisma/client";

const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export function formatMoney(value: Prisma.Decimal | number | string) {
  return formatter.format(Number(value));
}

export function toNumber(value: Prisma.Decimal | number | string) {
  return Number(value);
}
