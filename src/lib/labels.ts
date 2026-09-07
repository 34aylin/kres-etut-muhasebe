import type { ProgramType, StudentStatus } from "@/generated/prisma/client";

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Pasif",
  GRADUATED: "Mezun",
};

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  KRES: "Kreş",
  ETUT: "Etüt",
};
