"use server";

import { revalidatePath } from "next/cache";

import { adminAuth } from "@/auth-admin";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
} from "@/lib/default-chart-of-accounts";
import {
  createTenantSchema,
  type CreateTenantFormValues,
} from "@/lib/validations/tenant";

async function requirePlatformAdmin() {
  const session = await adminAuth();
  if (!session?.user?.isPlatformAdmin) {
    throw new Error("Bu işlem için platform yönetici oturumu gerekir");
  }
  return session.user;
}

export async function createTenant(values: CreateTenantFormValues) {
  await requirePlatformAdmin();
  const parsed = createTenantSchema.parse(values);

  const existingSlug = await prisma.tenant.findUnique({
    where: { slug: parsed.slug },
    select: { id: true },
  });
  if (existingSlug) {
    throw new Error("Bu şube kodu (slug) zaten kullanılıyor.");
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: parsed.adminEmail },
    select: { id: true },
  });
  if (existingEmail) {
    throw new Error("Bu e-posta zaten kullanılıyor.");
  }

  const passwordHash = await hashPassword(parsed.adminPassword);

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: parsed.name, slug: parsed.slug, type: parsed.type },
    });

    await tx.user.create({
      data: {
        tenantId: tenant.id,
        name: parsed.adminName,
        email: parsed.adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });

    await tx.account.createMany({
      data: DEFAULT_ACCOUNTS.map((account) => ({
        tenantId: tenant.id,
        name: account.name,
        type: account.type,
      })),
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({
        tenantId: tenant.id,
        name: category.name,
        type: category.type,
      })),
    });

    return tenant;
  });

  revalidatePath("/admin");
}
