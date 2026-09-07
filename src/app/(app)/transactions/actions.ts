"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
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

export async function createTransaction(values: TransactionFormValues) {
  const user = await requireManager();

  await forTenant(user.tenantId).transaction.create({
    data: { ...toData(values), tenantId: user.tenantId },
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
}

export async function updateTransaction(
  id: string,
  values: TransactionFormValues,
) {
  const user = await requireManager();

  await forTenant(user.tenantId).transaction.update({
    where: { id },
    data: toData(values),
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
}

export async function deleteTransaction(id: string) {
  const user = await requireManager();

  await forTenant(user.tenantId).transaction.delete({
    where: { id },
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
}
