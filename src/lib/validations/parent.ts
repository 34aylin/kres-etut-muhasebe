import { z } from "zod";

const phoneSchema = z
  .string()
  .max(30)
  .regex(/^[\d\s()+-]+$/, "Telefon sadece rakam ve +, -, (), boşluk içerebilir")
  .optional()
  .or(z.literal(""));

const nationalIdSchema = z
  .string()
  .regex(
    /^\d{11}$/,
    "TC Kimlik No 11 haneli olmalı ve sadece rakam içermelidir",
  )
  .optional()
  .or(z.literal(""));

export const parentSchema = z.object({
  firstName: z.string().min(1, "Ad zorunludur").max(100),
  lastName: z.string().min(1, "Soyad zorunludur").max(100),
  phone: phoneSchema,
  email: z
    .string()
    .email("Geçerli bir e-posta girin")
    .max(255)
    .optional()
    .or(z.literal("")),
  nationalId: nationalIdSchema,
});

export type ParentFormValues = z.infer<typeof parentSchema>;
