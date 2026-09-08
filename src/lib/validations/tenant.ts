import { z } from "zod";

export const tenantTypeValues = ["KRES", "ETUT"] as const;

export const createTenantSchema = z.object({
  name: z.string().min(1, "Şube adı zorunludur").max(200),
  slug: z
    .string()
    .min(1, "Şube kodu zorunludur")
    .max(100)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Sadece küçük harf, rakam ve tire (-) kullanılabilir",
    ),
  type: z.enum(tenantTypeValues),
  adminName: z.string().min(1, "Yönetici adı zorunludur").max(200),
  adminEmail: z.string().email("Geçerli bir e-posta girin").max(255),
  adminPassword: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .max(100),
});

export type CreateTenantFormValues = z.infer<typeof createTenantSchema>;
