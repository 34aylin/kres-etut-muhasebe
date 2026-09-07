import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
} from "../src/lib/default-chart-of-accounts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Demo1234!";

const TENANTS = [
  { slug: "merkez-sube", name: "Merkez Şube Kreş & Etüt" },
  { slug: "yildiz-sube", name: "Yıldız Şube Kreş & Etüt" },
] as const;

async function seedTenant(tenant: (typeof TENANTS)[number]) {
  const createdTenant = await prisma.tenant.upsert({
    where: { slug: tenant.slug },
    update: {},
    create: { slug: tenant.slug, name: tenant.name },
  });

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const demoUsers = [
    {
      email: `yonetici@${tenant.slug}.test`,
      name: "Demo Yönetici",
      role: "ADMIN" as const,
    },
    {
      email: `muhasebe@${tenant.slug}.test`,
      name: "Demo Muhasebe",
      role: "ACCOUNTANT" as const,
    },
    {
      email: `ogretmen@${tenant.slug}.test`,
      name: "Demo Öğretmen",
      role: "TEACHER" as const,
    },
  ];

  for (const demoUser of demoUsers) {
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        ...demoUser,
        passwordHash,
        tenantId: createdTenant.id,
      },
    });
  }

  const demoParentId = `demo-parent-${tenant.slug}`;
  const demoParent = await prisma.parent.upsert({
    where: { id: demoParentId },
    update: {},
    create: {
      id: demoParentId,
      tenantId: createdTenant.id,
      firstName: "Ayşe",
      lastName: "Yılmaz",
      phone: "0555 000 00 00",
      email: `ayse.yilmaz@${tenant.slug}.test`,
    },
  });

  const demoStudentId = `demo-student-${tenant.slug}`;
  const demoStudent = await prisma.student.upsert({
    where: { id: demoStudentId },
    update: {},
    create: {
      id: demoStudentId,
      tenantId: createdTenant.id,
      firstName: "Ali",
      lastName: "Yılmaz",
      status: "ACTIVE",
    },
  });

  await prisma.studentParent.upsert({
    where: {
      studentId_parentId: {
        studentId: demoStudent.id,
        parentId: demoParent.id,
      },
    },
    update: {},
    create: {
      tenantId: createdTenant.id,
      studentId: demoStudent.id,
      parentId: demoParent.id,
      relation: "anne",
    },
  });

  // Varsayılan hesap planı: Kasa/Banka hesapları + gelir/gider kategorileri.
  const accountsByName = new Map<string, string>();
  for (const [index, account] of DEFAULT_ACCOUNTS.entries()) {
    const id = `demo-account-${index}-${tenant.slug}`;
    await prisma.account.upsert({
      where: { id },
      update: {},
      create: {
        id,
        tenantId: createdTenant.id,
        name: account.name,
        type: account.type,
      },
    });
    accountsByName.set(account.name, id);
  }

  const categoriesByName = new Map<string, string>();
  for (const [index, category] of DEFAULT_CATEGORIES.entries()) {
    const id = `demo-category-${index}-${tenant.slug}`;
    await prisma.category.upsert({
      where: { id },
      update: {},
      create: {
        id,
        tenantId: createdTenant.id,
        name: category.name,
        type: category.type,
      },
    });
    categoriesByName.set(category.name, id);
  }

  // Demo aidat planı: 3 taksit x 500 TL, ilk taksit tahsil edilmiş.
  const feePlanId = `demo-feeplan-${tenant.slug}`;
  const aidatCategoryId = categoriesByName.get("Aidat Geliri")!;
  const kasaAccountId = accountsByName.get("Kasa")!;
  const startDate = new Date(Date.UTC(2026, 8, 1));

  await prisma.feePlan.upsert({
    where: { id: feePlanId },
    update: {},
    create: {
      id: feePlanId,
      tenantId: createdTenant.id,
      studentId: demoStudent.id,
      parentId: demoParent.id,
      categoryId: aidatCategoryId,
      name: "2026-2027 Aylık Aidat",
      installmentAmount: 500,
      installmentCount: 3,
      startDate,
    },
  });

  const chargeIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const dueDate = new Date(Date.UTC(2026, 8 + i, 1));
    const chargeId = `demo-charge-${i}-${tenant.slug}`;
    await prisma.charge.upsert({
      where: { id: chargeId },
      update: {},
      create: {
        id: chargeId,
        tenantId: createdTenant.id,
        studentId: demoStudent.id,
        parentId: demoParent.id,
        categoryId: aidatCategoryId,
        feePlanId,
        amount: 500,
        dueDate,
        description: `${dueDate.toLocaleString("tr-TR", { month: "long", year: "numeric" })} aidatı`,
      },
    });
    chargeIds.push(chargeId);
  }

  // İlk taksit tahsil edilmiş gösterilir.
  await prisma.transaction.upsert({
    where: { id: `demo-payment-0-${tenant.slug}` },
    update: {},
    create: {
      id: `demo-payment-0-${tenant.slug}`,
      tenantId: createdTenant.id,
      type: "INCOME",
      amount: 500,
      date: startDate,
      accountId: kasaAccountId,
      categoryId: aidatCategoryId,
      studentId: demoStudent.id,
      parentId: demoParent.id,
      chargeId: chargeIds[0],
      paymentMethod: "CASH",
      description: "Eylül aidatı tahsilatı",
    },
  });

  console.log(`Seed tamamlandı: ${tenant.slug}`);
}

async function main() {
  for (const tenant of TENANTS) {
    await seedTenant(tenant);
  }

  console.log("\nDemo giriş bilgileri (tüm kullanıcılar için şifre aynıdır):");
  console.log(`  Şifre: ${DEMO_PASSWORD}`);
  for (const tenant of TENANTS) {
    console.log(
      `  [${tenant.slug}] yonetici@${tenant.slug}.test / muhasebe@${tenant.slug}.test / ogretmen@${tenant.slug}.test`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
