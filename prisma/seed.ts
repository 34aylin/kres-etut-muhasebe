import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

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
