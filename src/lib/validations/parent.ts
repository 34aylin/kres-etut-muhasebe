import { z } from "zod";

export const parentSchema = z.object({
  firstName: z.string().min(1, "Ad zorunludur").max(100),
  lastName: z.string().min(1, "Soyad zorunludur").max(100),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .email("Geçerli bir e-posta girin")
    .max(255)
    .optional()
    .or(z.literal("")),
  nationalId: z.string().max(11).optional().or(z.literal("")),
});

export type ParentFormValues = z.infer<typeof parentSchema>;
