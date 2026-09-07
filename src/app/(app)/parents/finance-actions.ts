"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { assertOwnedByTenant, forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { recordAudit } from "@/lib/audit";
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

  await assertOwnedByTenant(db, "student", studentId, "Geçersiz öğrenci.");
  await assertOwnedByTenant(
    db,
    "parent",
    parsed.parentId,
    "Geçersiz veli seçimi.",
  );
  if (parsed.categoryId) {
    await assertOwnedByTenant(
      db,
      "category",
      parsed.categoryId,
      "Geçersiz kategori seçimi.",
    );
  }

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

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "CREATE",
    entityType: "FeePlan",
    entityId: feePlan.id,
    metadata: {
      name: parsed.name,
      installmentAmount: parsed.installmentAmount,
      installmentCount: parsed.installmentCount,
    },
  });

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

  const feePlan = await db.feePlan.findUniqueOrThrow({
    where: { id: feePlanId },
  });
  await db.charge.deleteMany({ where: { feePlanId } });
  await db.feePlan.delete({ where: { id: feePlanId } });

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "DELETE",
    entityType: "FeePlan",
    entityId: feePlanId,
    metadata: { name: feePlan.name },
  });

  revalidatePath(`/parents/${parentId}`);
}

export async function deleteCharge(chargeId: string, parentId: string) {
  const user = await requireManager();
  const db = forTenant(user.tenantId);

  const paidCount = await db.transaction.count({ where: { chargeId } });
  if (paidCount > 0) {
    throw new Error("Bu tahakkuka ait tahsilat var; önce onu kaldırın.");
  }

  const charge = await db.charge.delete({ where: { id: chargeId } });

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "DELETE",
    entityType: "Charge",
    entityId: chargeId,
    metadata: {
      amount: Number(charge.amount),
      description: charge.description,
    },
  });

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

  await assertOwnedByTenant(
    db,
    "account",
    parsed.accountId,
    "Geçersiz hesap seçimi.",
  );
  const charge = await db.charge.findUniqueOrThrow({ where: { id: chargeId } });

  const alreadyPaid = await db.transaction.aggregate({
    where: { chargeId: charge.id, type: "INCOME" },
    _sum: { amount: true },
  });
  const remaining =
    Number(charge.amount) - Number(alreadyPaid._sum.amount ?? 0);
  if (parsed.amount > remaining) {
    throw new Error(
      `Tutar kalan borçtan (${remaining.toFixed(2)} ₺) fazla olamaz.`,
    );
  }

  const payment = await db.transaction.create({
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

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "CREATE",
    entityType: "Transaction",
    entityId: payment.id,
    metadata: { type: "INCOME", amount: parsed.amount, chargeId: charge.id },
  });

  revalidatePath(`/parents/${parentId}`);
  revalidatePath("/transactions");
  revalidatePath("/accounts");
}
