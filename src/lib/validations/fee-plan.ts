import { z } from "zod";

export const feePlanSchema = z.object({
  name: z.string().min(1, "Plan adı zorunludur").max(150),
  parentId: z.string().min(1, "Veli seçin"),
  categoryId: z.string().optional().or(z.literal("")),
  installmentAmount: z
    .number()
    .positive("Taksit tutarı 0'dan büyük olmalıdır")
    .max(99_999_999.99, "Tutar çok büyük"),
  installmentCount: z
    .number()
    .int()
    .min(1, "En az 1 taksit olmalıdır")
    .max(36, "En fazla 36 taksit girilebilir"),
  startDate: z.string().min(1, "Başlangıç tarihi zorunludur"),
});

export type FeePlanFormValues = z.infer<typeof feePlanSchema>;
