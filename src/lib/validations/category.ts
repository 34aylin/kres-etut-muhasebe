import { z } from "zod";

export const categoryTypeValues = ["INCOME", "EXPENSE"] as const;

export const categorySchema = z.object({
  name: z.string().min(1, "Kategori adı zorunludur").max(100),
  type: z.enum(categoryTypeValues),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
