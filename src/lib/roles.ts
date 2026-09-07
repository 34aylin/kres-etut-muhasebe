import type { UserRole } from "@/generated/prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Yönetici",
  ACCOUNTANT: "Muhasebe",
  TEACHER: "Öğretmen/Personel",
};

/**
 * Veli/Öğrenci/Kayıt gibi operasyonel verileri oluşturma/düzenleme/silme yetkisi.
 * TEACHER rolü bu verileri görüntüleyebilir ama değiştiremez (salt okunur).
 */
export function canManageRecords(role: UserRole) {
  return role === "ADMIN" || role === "ACCOUNTANT";
}
