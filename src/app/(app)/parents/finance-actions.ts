"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import {
  feePlanSchema,
  type FeePlanFormValues,
} from "@/lib/validations/fee-plan";
import {
  paymentSchema,
  type PaymentFormValues,
} from "@/lib/validations/payment";

async function requireManager() {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error("Oturum bulunamadı");
  if (!canManageRecords(user.role))
    throw new Error("Bu işlem için yetkiniz yok");
  return user;
}

/** Bir taksit/aidat planı oluşturur ve otomatik olarak N adet Charge (tahakkuk) üretir. */
export async function createFeePlan(
  studentId: string,
  values: FeePlanFormValues,
) {
  const user = await requireManager();
  const parsed = feePlanSchema.parse(values);
  const db = forTenant(user.tenantId);

  const startDate = new Date(parsed.startDate);

  const feePlan = await db.feePlan.create({
    data: {
      tenantId: user.tenantId,
      studentId,
      parentId: parsed.parentId,
      categoryId: parsed.categoryId || null,
      name: parsed.name,
      installmentAmount: parsed.installmentAmount,
      installmentCount: parsed.installmentCount,
      startDate,
    },
  });

  const charges = Array.from(
    { length: parsed.installmentCount },
    (_, index) => {
      const dueDate = new Date(startDate);
      dueDate.setUTCMonth(dueDate.getUTCMonth() + index);
      return {
        tenantId: user.tenantId,
        studentId,
        parentId: parsed.parentId,
        categoryId: parsed.categoryId || null,
        feePlanId: feePlan.id,
        amount: parsed.installmentAmount,
        dueDate,
        description: `${parsed.name} — ${index + 1}/${parsed.installmentCount}. taksit`,
      };
    },
  );

  await db.charge.createMany({ data: charges });

  revalidatePath(`/parents/${parsed.parentId}`);
  revalidatePath(`/students/${studentId}`);
}

export async function deleteFeePlan(feePlanId: string, parentId: string) {
  const user = await requireManager();
  const db = forTenant(user.tenantId);

  const paidCount = await db.transaction.count({
    where: { charge: { feePlanId } },
  });
  if (paidCount > 0) {
    throw new Error(
      "Bu plana ait tahsil edilmiş taksitler var; önce onları kaldırın.",
    );
  }

  await db.charge.deleteMany({ where: { feePlanId } });
  await db.feePlan.delete({ where: { id: feePlanId } });

  revalidatePath(`/parents/${parentId}`);
}

export async function deleteCharge(chargeId: string, parentId: string) {
  const user = await requireManager();
  const db = forTenant(user.tenantId);

  const paidCount = await db.transaction.count({ where: { chargeId } });
  if (paidCount > 0) {
    throw new Error("Bu tahakkuka ait tahsilat var; önce onu kaldırın.");
  }

  await db.charge.delete({ where: { id: chargeId } });

  revalidatePath(`/parents/${parentId}`);
}

/** Bir tahakkuka (Charge) karşılık tahsilat (Transaction) kaydeder. */
export async function recordPayment(
  chargeId: string,
  parentId: string,
  values: PaymentFormValues,
) {
  const user = await requireManager();
  const parsed = paymentSchema.parse(values);
  const db = forTenant(user.tenantId);

  const charge = await db.charge.findUniqueOrThrow({ where: { id: chargeId } });

  await db.transaction.create({
    data: {
      tenantId: user.tenantId,
      type: "INCOME",
      amount: parsed.amount,
      date: new Date(parsed.date),
      accountId: parsed.accountId,
      categoryId: charge.categoryId,
      studentId: charge.studentId,
      parentId: charge.parentId,
      chargeId: charge.id,
      paymentMethod: parsed.paymentMethod,
      description: parsed.description || null,
    },
  });

  revalidatePath(`/parents/${parentId}`);
  revalidatePath("/transactions");
  revalidatePath("/accounts");
}
