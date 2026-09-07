import { z } from "zod";

export const programTypeValues = ["KRES", "ETUT"] as const;
export const enrollmentStatusValues = [
  "ACTIVE",
  "INACTIVE",
  "GRADUATED",
] as const;

export const enrollmentSchema = z.object({
  program: z.enum(programTypeValues),
  startDate: z.string().min(1, "Başlangıç tarihi zorunludur"),
  endDate: z.string().optional().or(z.literal("")),
  status: z.enum(enrollmentStatusValues),
});

export type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;
