import { z } from "zod";

export const accountTypeValues = ["CASH", "BANK"] as const;

export const accountSchema = z.object({
  name: z.string().min(1, "Hesap adı zorunludur").max(100),
  type: z.enum(accountTypeValues),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
