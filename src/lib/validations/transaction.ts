import { z } from "zod";

export const transactionTypeValues = ["INCOME", "EXPENSE"] as const;
export const paymentMethodValues = ["CASH", "BANK_TRANSFER", "CARD"] as const;

export const transactionSchema = z.object({
  type: z.enum(transactionTypeValues),
  amount: z
    .number()
    .positive("Tutar 0'dan büyük olmalıdır")
    .max(99_999_999.99, "Tutar çok büyük"),
  date: z.string().min(1, "Tarih zorunludur"),
  accountId: z.string().min(1, "Kasa/Banka hesabı seçin"),
  categoryId: z.string().optional().or(z.literal("")),
  studentId: z.string().optional().or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(paymentMethodValues),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
