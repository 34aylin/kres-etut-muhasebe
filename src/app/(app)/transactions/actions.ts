"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import {
  assertOwnedByTenant,
  forTenant,
  type TenantPrismaClient,
} from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { recordAudit } from "@/lib/audit";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/lib/validations/transaction";

async function requireManager() {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error("Oturum bulunamadı");
  if (!canManageRecords(user.role))
    throw new Error("Bu işlem için yetkiniz yok");
  return user;
}

function toData(values: TransactionFormValues) {
  const parsed = transactionSchema.parse(values);
  return {
    type: parsed.type,
    amount: parsed.amount,
    date: new Date(parsed.date),
    accountId: parsed.accountId,
    categoryId: parsed.categoryId || null,
    studentId: parsed.studentId || null,
    parentId: parsed.parentId || null,
    paymentMethod: parsed.paymentMethod,
    description: parsed.description || null,
  };
}

/**
 * Forma göre seçilen hesap/kategori/öğrenci/veli ID'lerinin gerçekten bu
 * tenant'a ait olduğunu doğrular. Aksi halde bir kullanıcı başka bir
 * şubenin hesabına/velisine referans veren bir hareket oluşturabilir ve
 * bu, hareket listesinde (`include`) o şubenin verisini sızdırabilir.
 */
async function assertReferencesOwnedByTenant(
  db: TenantPrismaClient,
  data: ReturnType<typeof toData>,
) {
  await assertOwnedByTenant(
    db,
    "account",
    data.accountId,
    "Geçersiz hesap seçimi.",
  );
  if (data.categoryId) {
    await assertOwnedByTenant(
      db,
      "category",
      data.categoryId,
      "Geçersiz kategori seçimi.",
    );
  }
  if (data.studentId) {
    await assertOwnedByTenant(
      db,
      "student",
      data.studentId,
      "Geçersiz öğrenci seçimi.",
    );
  }
  if (data.parentId) {
    await assertOwnedByTenant(
      db,
      "parent",
      data.parentId,
      "Geçersiz veli seçimi.",
    );
  }
}

export async function createTransaction(values: TransactionFormValues) {
  const user = await requireManager();
  const db = forTenant(user.tenantId);
  const data = toData(values);
  await assertReferencesOwnedByTenant(db, data);

  const created = await db.transaction.create({
    data: { ...data, tenantId: user.tenantId },
  });

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "CREATE",
    entityType: "Transaction",
    entityId: created.id,
    metadata: {
      type: data.type,
      amount: data.amount,
      description: data.description,
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
}

export async function updateTransaction(
  id: string,
  values: TransactionFormValues,
) {
  const user = await requireManager();
  const db = forTenant(user.tenantId);
  const data = toData(values);
  await assertReferencesOwnedByTenant(db, data);

  await db.transaction.update({
    where: { id },
    data,
  });

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "UPDATE",
    entityType: "Transaction",
    entityId: id,
    metadata: { type: data.type, amount: data.amount },
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
}

export async function deleteTransaction(id: string) {
  const user = await requireManager();

  const deleted = await forTenant(user.tenantId).transaction.delete({
    where: { id },
  });

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "DELETE",
    entityType: "Transaction",
    entityId: id,
    metadata: {
      type: deleted.type,
      amount: Number(deleted.amount),
      description: deleted.description,
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
}
