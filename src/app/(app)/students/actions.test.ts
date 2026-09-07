import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { addParentLink } from "./actions";

const mockAuth = vi.mocked(auth);

/**
 * Regresyon testi: daha önce üretimde bulunan bir güvenlik açığının
 * (bkz. src/lib/tenant-db.test.ts) gerçek server action seviyesinde de
 * kapalı kaldığını doğrular — `addParentLink` başka bir tenant'ın
 * velisiyle çağrılırsa reddedilmelidir.
 */
describe("students/actions cross-tenant IDOR guard", () => {
  let tenantA: { id: string };
  let tenantB: { id: string };
  let accountantA: { id: string };
  let studentA: { id: string };
  let parentB: { id: string };

  beforeAll(async () => {
    tenantA = await prisma.tenant.create({
      data: { name: "IDOR Test A", slug: `idor-test-a-${Date.now()}` },
    });
    tenantB = await prisma.tenant.create({
      data: { name: "IDOR Test B", slug: `idor-test-b-${Date.now()}` },
    });
    const passwordHash = await hashPassword("Test1234!");
    accountantA = await prisma.user.create({
      data: {
        tenantId: tenantA.id,
        name: "Muhasebe A",
        email: `accountant-a-${Date.now()}@test.local`,
        passwordHash,
        role: "ACCOUNTANT",
      },
    });
    studentA = await prisma.student.create({
      data: {
        tenantId: tenantA.id,
        firstName: "A",
        lastName: "Öğrenci",
        status: "ACTIVE",
      },
    });
    parentB = await prisma.parent.create({
      data: { tenantId: tenantB.id, firstName: "B", lastName: "Veli" },
    });
  });

  afterAll(async () => {
    await prisma.studentParent.deleteMany({
      where: { tenantId: { in: [tenantA.id, tenantB.id] } },
    });
    await prisma.auditLog.deleteMany({
      where: { tenantId: { in: [tenantA.id, tenantB.id] } },
    });
    await prisma.student.deleteMany({ where: { tenantId: tenantA.id } });
    await prisma.parent.deleteMany({ where: { tenantId: tenantB.id } });
    await prisma.user.deleteMany({ where: { tenantId: tenantA.id } });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantA.id, tenantB.id] } },
    });
    await prisma.$disconnect();
  });

  it("rejects linking a student to another tenant's parent", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: accountantA.id,
        role: "ACCOUNTANT",
        tenantId: tenantA.id,
        tenantSlug: tenantA.id,
        name: "Muhasebe A",
        email: "",
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await expect(addParentLink(studentA.id, parentB.id)).rejects.toThrow(
      "Geçersiz veli seçimi.",
    );

    const links = await prisma.studentParent.count({
      where: { studentId: studentA.id },
    });
    expect(links).toBe(0);
  });
});
