import { z } from "zod";

import { paymentMethodValues } from "./transaction";

export const paymentSchema = z.object({
  amount: z.number().positive("Tutar 0'dan büyük olmalıdır"),
  date: z.string().min(1, "Tarih zorunludur"),
  accountId: z.string().min(1, "Kasa/Banka hesabı seçin"),
  paymentMethod: z.enum(paymentMethodValues),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
