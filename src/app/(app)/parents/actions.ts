"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { recordAudit } from "@/lib/audit";
import { parentSchema, type ParentFormValues } from "@/lib/validations/parent";

async function requireManager() {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error("Oturum bulunamadı");
  if (!canManageRecords(user.role))
    throw new Error("Bu işlem için yetkiniz yok");
  return user;
}

function normalize(values: ParentFormValues) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone || null,
    email: values.email || null,
    nationalId: values.nationalId || null,
  };
}

export async function createParent(values: ParentFormValues) {
  const user = await requireManager();
  const parsed = parentSchema.parse(values);

  // `forTenant` tenantId'yi runtime'da otomatik enjekte eder; burada da
  // açıkça veriyoruz çünkü Prisma'nın üretilen create tipi tenantId'yi
  // zorunlu kılıyor (extension bunu tip seviyesinde yansıtmıyor).
  const created = await forTenant(user.tenantId).parent.create({
    data: { ...normalize(parsed), tenantId: user.tenantId },
  });

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "CREATE",
    entityType: "Parent",
    entityId: created.id,
    metadata: { firstName: created.firstName, lastName: created.lastName },
  });

  revalidatePath("/parents");
}

export async function updateParent(id: string, values: ParentFormValues) {
  const user = await requireManager();
  const parsed = parentSchema.parse(values);

  await forTenant(user.tenantId).parent.update({
    where: { id },
    data: normalize(parsed),
  });

  revalidatePath("/parents");
}

export async function deleteParent(id: string) {
  const user = await requireManager();
  const db = forTenant(user.tenantId);

  // Charge/FeePlan modelleri Parent üzerinden Cascade silinir; bu veliye ait
  // borç/plan kaydı varsa (tahsilat görmüş olsun ya da olmasın) sessizce yok
  // olmasın diye önce elle kaldırılmasını zorunlu kılıyoruz.
  const [chargeCount, feePlanCount] = await Promise.all([
    db.charge.count({ where: { parentId: id } }),
    db.feePlan.count({ where: { parentId: id } }),
  ]);
  if (chargeCount > 0 || feePlanCount > 0) {
    throw new Error(
      "Bu veliye ait borç/ücret planı kayıtları var; önce onları kaldırın.",
    );
  }

  const deleted = await db.parent.delete({
    where: { id },
  });

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "DELETE",
    entityType: "Parent",
    entityId: id,
    metadata: { firstName: deleted.firstName, lastName: deleted.lastName },
  });

  revalidatePath("/parents");
}
