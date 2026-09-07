"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import {
  studentSchema,
  type StudentFormValues,
} from "@/lib/validations/student";
import {
  enrollmentSchema,
  type EnrollmentFormValues,
} from "@/lib/validations/enrollment";

async function requireManager() {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error("Oturum bulunamadı");
  if (!canManageRecords(user.role))
    throw new Error("Bu işlem için yetkiniz yok");
  return user;
}

function toBasicData(values: StudentFormValues) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    birthDate: values.birthDate ? new Date(values.birthDate) : null,
    status: values.status,
  };
}

export async function createStudent(values: StudentFormValues) {
  const user = await requireManager();
  const parsed = studentSchema.parse(values);
  const db = forTenant(user.tenantId);

  const student = await db.student.create({
    data: { ...toBasicData(parsed), tenantId: user.tenantId },
  });

  if (parsed.parentIds.length > 0) {
    await db.studentParent.createMany({
      data: parsed.parentIds.map((parentId) => ({
        studentId: student.id,
        parentId,
        tenantId: user.tenantId,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/students");
  return student.id;
}

export async function updateStudent(id: string, values: StudentFormValues) {
  const user = await requireManager();
  const parsed = studentSchema.parse(values);

  await forTenant(user.tenantId).student.update({
    where: { id },
    data: toBasicData(parsed),
  });

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
}

export async function deleteStudent(id: string) {
  const user = await requireManager();

  await forTenant(user.tenantId).student.delete({
    where: { id },
  });

  revalidatePath("/students");
}

export async function addParentLink(
  studentId: string,
  parentId: string,
  relation?: string,
) {
  const user = await requireManager();

  await forTenant(user.tenantId).studentParent.create({
    data: {
      studentId,
      parentId,
      relation: relation || null,
      tenantId: user.tenantId,
    },
  });

  revalidatePath(`/students/${studentId}`);
}

export async function removeParentLink(
  studentParentId: string,
  studentId: string,
) {
  const user = await requireManager();

  await forTenant(user.tenantId).studentParent.delete({
    where: { id: studentParentId },
  });

  revalidatePath(`/students/${studentId}`);
}

export async function createEnrollment(
  studentId: string,
  values: EnrollmentFormValues,
) {
  const user = await requireManager();
  const parsed = enrollmentSchema.parse(values);

  await forTenant(user.tenantId).enrollment.create({
    data: {
      studentId,
      program: parsed.program,
      status: parsed.status,
      startDate: new Date(parsed.startDate),
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
      tenantId: user.tenantId,
    },
  });

  revalidatePath(`/students/${studentId}`);
}

export async function updateEnrollment(
  id: string,
  studentId: string,
  values: EnrollmentFormValues,
) {
  const user = await requireManager();
  const parsed = enrollmentSchema.parse(values);

  await forTenant(user.tenantId).enrollment.update({
    where: { id },
    data: {
      program: parsed.program,
      status: parsed.status,
      startDate: new Date(parsed.startDate),
      endDate: parsed.endDate ? new Date(parsed.endDate) : null,
    },
  });

  revalidatePath(`/students/${studentId}`);
}

export async function deleteEnrollment(id: string, studentId: string) {
  const user = await requireManager();

  await forTenant(user.tenantId).enrollment.delete({
    where: { id },
  });

  revalidatePath(`/students/${studentId}`);
}
