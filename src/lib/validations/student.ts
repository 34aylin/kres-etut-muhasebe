import { z } from "zod";

export const studentStatusValues = ["ACTIVE", "INACTIVE", "GRADUATED"] as const;

export const studentSchema = z.object({
  firstName: z.string().min(1, "Ad zorunludur").max(100),
  lastName: z.string().min(1, "Soyad zorunludur").max(100),
  birthDate: z.string().optional().or(z.literal("")),
  status: z.enum(studentStatusValues),
  parentIds: z.array(z.string()),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
