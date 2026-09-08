import type { TenantType } from "@/generated/prisma/client";

export const TENANT_TYPE_LABELS: Record<TenantType, string> = {
  KRES: "Kreş Yönetimi",
  ETUT: "Etüt Yönetimi",
};

/**
 * Enrollment.program (ProgramType) tenant türüyle bire bir eşleşir: bir
 * tenant tek bir işletme türü altında çalışır, dolayısıyla kayıt formunda
 * program seçimi kullanıcıya sorulmaz — tenant türünden otomatik türetilir.
 */
export const TENANT_TYPE_TO_PROGRAM: Record<TenantType, "KRES" | "ETUT"> = {
  KRES: "KRES",
  ETUT: "ETUT",
};
