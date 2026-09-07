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

export const parentLinkSchema = z.object({
  studentId: z.string().min(1, "Öğrenci zorunludur"),
  parentId: z.string().min(1, "Veli zorunludur"),
  relation: z.string().max(50).optional().or(z.literal("")),
});

export type ParentLinkValues = z.infer<typeof parentLinkSchema>;
