import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createParent, deleteParent } from "./actions";

// `auth` gerçekte hem oturum sorgulama hem de proxy sarmalayıcısı olarak
// aşırı yüklenmiş (overloaded) bir fonksiyon; test amacıyla sadece oturum
// döndüren basit bir mock olarak tiplendiriyoruz.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any;

/**
 * Bu test, gerçek server action'ları (mock'lanmış bir oturumla) çağırarak
 * RBAC kontrolünün UI'ı değil, sunucu tarafını doğruladığını gösterir —
 * yani biri tarayıcıdan geçip action'ı doğrudan çağırsa bile TEACHER
 * rolüyle bir veli oluşturulamaz.
 */
describe("parents/actions RBAC", () => {
  let tenant: { id: string };
  let teacherUser: { id: string };
  let accountantUser: { id: string };

  function sessionFor(user: {
    id: string;
    role: "ADMIN" | "ACCOUNTANT" | "TEACHER";
  }) {
    return {
      user: {
        id: user.id,
        role: user.role,
        tenantId: tenant.id,
        tenantSlug: tenant.id,
        name: user.role,
        email: "",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  beforeAll(async () => {
    tenant = await prisma.tenant.create({
      data: { name: "RBAC Test Tenant", slug: `rbac-test-${Date.now()}` },
    });
    const passwordHash = await hashPassword("Test1234!");
    teacherUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: "Test Öğretmen",
        email: `teacher-${Date.now()}@test.local`,
        passwordHash,
        role: "TEACHER",
      },
    });
    accountantUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: "Test Muhasebe",
        email: `accountant-${Date.now()}@test.local`,
        passwordHash,
        role: "ACCOUNTANT",
      },
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.parent.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
    await prisma.$disconnect();
  });

  it("rejects an unauthenticated caller", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(
      createParent({
        firstName: "A",
        lastName: "B",
        phone: "",
        email: "",
        nationalId: "",
      }),
    ).rejects.toThrow("Oturum bulunamadı");
  });

  it("rejects TEACHER (read-only role) from creating a parent", async () => {
    mockAuth.mockResolvedValue(sessionFor({ id: teacherUser.id, role: "TEACHER" }));
    await expect(
      createParent({
        firstName: "A",
        lastName: "B",
        phone: "",
        email: "",
        nationalId: "",
      }),
    ).rejects.toThrow("Bu işlem için yetkiniz yok");

    const count = await prisma.parent.count({ where: { tenantId: tenant.id } });
    expect(count).toBe(0);
  });

  it("allows ACCOUNTANT to create and delete a parent, scoped to their tenant", async () => {
    mockAuth.mockResolvedValue(sessionFor({ id: accountantUser.id, role: "ACCOUNTANT" }));

    await createParent({
      firstName: "Test",
      lastName: "Veli",
      phone: "",
      email: "",
      nationalId: "",
    });

    const created = await prisma.parent.findFirstOrThrow({
      where: { tenantId: tenant.id },
    });
    expect(created.tenantId).toBe(tenant.id);

    await deleteParent(created.id);
    const afterDelete = await prisma.parent.findUnique({
      where: { id: created.id },
    });
    expect(afterDelete).toBeNull();
  });
});
