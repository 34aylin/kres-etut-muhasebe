"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import {
  accountSchema,
  type AccountFormValues,
} from "@/lib/validations/account";
import {
  categorySchema,
  type CategoryFormValues,
} from "@/lib/validations/category";

async function requireManager() {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error("Oturum bulunamadı");
  if (!canManageRecords(user.role))
    throw new Error("Bu işlem için yetkiniz yok");
  return user;
}

export async function createAccount(values: AccountFormValues) {
  const user = await requireManager();
  const parsed = accountSchema.parse(values);

  await forTenant(user.tenantId).account.create({
    data: { ...parsed, tenantId: user.tenantId },
  });

  revalidatePath("/accounts");
}

export async function updateAccount(id: string, values: AccountFormValues) {
  const user = await requireManager();
  const parsed = accountSchema.parse(values);

  await forTenant(user.tenantId).account.update({
    where: { id },
    data: parsed,
  });

  revalidatePath("/accounts");
}

export async function deactivateAccount(id: string) {
  const user = await requireManager();

  await forTenant(user.tenantId).account.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/accounts");
}

export async function createCategory(values: CategoryFormValues) {
  const user = await requireManager();
  const parsed = categorySchema.parse(values);

  await forTenant(user.tenantId).category.create({
    data: { ...parsed, tenantId: user.tenantId },
  });

  revalidatePath("/accounts");
}

export async function updateCategory(id: string, values: CategoryFormValues) {
  const user = await requireManager();
  const parsed = categorySchema.parse(values);

  await forTenant(user.tenantId).category.update({
    where: { id },
    data: parsed,
  });

  revalidatePath("/accounts");
}

export async function deactivateCategory(id: string) {
  const user = await requireManager();

  await forTenant(user.tenantId).category.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/accounts");
}
