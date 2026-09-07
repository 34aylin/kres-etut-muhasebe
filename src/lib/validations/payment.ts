import { z } from "zod";

import { paymentMethodValues } from "./transaction";

export const paymentSchema = z.object({
  amount: z
    .number()
    .positive("Tutar 0'dan büyük olmalıdır")
    .max(99_999_999.99, "Tutar çok büyük"),
  date: z.string().min(1, "Tarih zorunludur"),
  accountId: z.string().min(1, "Kasa/Banka hesabı seçin"),
  paymentMethod: z.enum(paymentMethodValues),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
