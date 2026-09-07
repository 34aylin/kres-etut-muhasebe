import type { AccountType, CategoryType } from "@/generated/prisma/client";

/**
 * Proje planında (bkz. kres-etut-muhasebe-plan.md §4.1) tanımlanan örnek basit
 * hesap planı. Yeni bir tenant oluşturulduğunda seed script bu listeyi kullanır.
 */
export const DEFAULT_ACCOUNTS: { name: string; type: AccountType }[] = [
  { name: "Kasa", type: "CASH" },
  { name: "Banka Hesabı", type: "BANK" },
];

export const DEFAULT_CATEGORIES: { name: string; type: CategoryType }[] = [
  { name: "Aidat Geliri", type: "INCOME" },
  { name: "Kayıt Ücreti Geliri", type: "INCOME" },
  { name: "Etüt/Kurs Geliri", type: "INCOME" },
  { name: "Servis Geliri", type: "INCOME" },
  { name: "Yemek Geliri", type: "INCOME" },
  { name: "Diğer Gelirler", type: "INCOME" },
  { name: "Personel Maaş Gideri", type: "EXPENSE" },
  { name: "Kira Gideri", type: "EXPENSE" },
  { name: "Elektrik/Su/Doğalgaz/İnternet Gideri", type: "EXPENSE" },
  { name: "Kırtasiye/Malzeme Gideri", type: "EXPENSE" },
  { name: "Bakım-Onarım Gideri", type: "EXPENSE" },
  { name: "Vergi/SGK Gideri", type: "EXPENSE" },
  { name: "Diğer Giderler", type: "EXPENSE" },
];
