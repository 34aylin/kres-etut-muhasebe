import type {
  AccountType,
  AuditAction,
  CategoryType,
  PaymentMethod,
  ProgramType,
  StudentStatus,
  TransactionType,
} from "@/generated/prisma/client";

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Pasif",
  GRADUATED: "Mezun",
};

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  KRES: "Kreş",
  ETUT: "Etüt",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Kasa",
  BANK: "Banka",
};

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: "Gelir",
  EXPENSE: "Gider",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Gelir",
  EXPENSE: "Gider",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Nakit",
  BANK_TRANSFER: "Havale/EFT",
  CARD: "Kart",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Oluşturuldu",
  UPDATE: "Güncellendi",
  DELETE: "Silindi",
  LOGIN: "Giriş Yapıldı",
};
