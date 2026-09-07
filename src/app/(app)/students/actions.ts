"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { assertOwnedByTenant, forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import {
  parentLinkSchema,
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
    // Her parentId'nin bu tenant'a ait gerçek bir Parent kaydı olduğunu
    // doğrula — aksi halde başka bir şubenin velisi bağlanabilir.
    for (const parentId of parsed.parentIds) {
      await assertOwnedByTenant(
        db,
        "parent",
        parentId,
        "Geçersiz veli seçimi.",
      );
    }

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
  const db = forTenant(user.tenantId);

  // Charge/FeePlan modelleri Student üzerinden de Cascade silinir; bu
  // öğrenciye ait borç/plan kaydı varsa sessizce yok olmasın diye önce
  // elle kaldırılmasını zorunlu kılıyoruz.
  const [chargeCount, feePlanCount] = await Promise.all([
    db.charge.count({ where: { studentId: id } }),
    db.feePlan.count({ where: { studentId: id } }),
  ]);
  if (chargeCount > 0 || feePlanCount > 0) {
    throw new Error(
      "Bu öğrenciye ait borç/ücret planı kayıtları var; önce onları kaldırın.",
    );
  }

  await db.student.delete({
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
  const {
    studentId: validStudentId,
    parentId: validParentId,
    relation: validRelation,
  } = parentLinkSchema.parse({ studentId, parentId, relation });
  const db = forTenant(user.tenantId);

  // Hem öğrencinin hem de velinin bu tenant'a ait olduğunu doğrula.
  await assertOwnedByTenant(db, "student", validStudentId, "Geçersiz öğrenci.");
  await assertOwnedByTenant(
    db,
    "parent",
    validParentId,
    "Geçersiz veli seçimi.",
  );

  await db.studentParent.create({
    data: {
      studentId: validStudentId,
      parentId: validParentId,
      relation: validRelation || null,
      tenantId: user.tenantId,
    },
  });

  revalidatePath(`/students/${validStudentId}`);
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
  const db = forTenant(user.tenantId);

  await assertOwnedByTenant(db, "student", studentId, "Geçersiz öğrenci.");

  await db.enrollment.create({
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
