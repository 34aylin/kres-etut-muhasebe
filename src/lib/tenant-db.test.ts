import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "./prisma";
import { assertOwnedByTenant, forTenant } from "./tenant-db";

/**
 * Bu test, daha önce üretimde bulunan gerçek bir güvenlik açığının
 * regresyon testidir: `forTenant()` yalnızca bir sorgunun kendi
 * `tenantId` alanını filtreler; başka bir modele referans veren ID'lerin
 * (parentId, accountId vb.) çağıranın tenant'ına ait olup olmadığını
 * doğrulamak `assertOwnedByTenant()`'ın işidir. Bu test her ikisini de
 * gerçek bir veritabanına karşı doğrular.
 */
describe("multi-tenant isolation", () => {
  let tenantA: { id: string };
  let tenantB: { id: string };
  let parentA: { id: string };
  let parentB: { id: string };

  beforeAll(async () => {
    tenantA = await prisma.tenant.create({
      data: { name: "Test Tenant A", slug: `test-tenant-a-${Date.now()}` },
    });
    tenantB = await prisma.tenant.create({
      data: { name: "Test Tenant B", slug: `test-tenant-b-${Date.now()}` },
    });
    parentA = await prisma.parent.create({
      data: { tenantId: tenantA.id, firstName: "Tenant A", lastName: "Veli" },
    });
    parentB = await prisma.parent.create({
      data: { tenantId: tenantB.id, firstName: "Tenant B", lastName: "Veli" },
    });
  });

  afterAll(async () => {
    await prisma.parent.deleteMany({
      where: { tenantId: { in: [tenantA.id, tenantB.id] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantA.id, tenantB.id] } },
    });
    await prisma.$disconnect();
  });

  it("forTenant().create() always stamps the caller's own tenantId", async () => {
    const db = forTenant(tenantA.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await (db.parent.create as any)({
      data: {
        firstName: "Yeni",
        lastName: "Veli",
        tenantId: "spoofed-tenant-id",
      },
    });
    expect(created.tenantId).toBe(tenantA.id);
    await prisma.parent.delete({ where: { id: created.id } });
  });

  it("forTenant(A) cannot read tenant B's row by id", async () => {
    const dbA = forTenant(tenantA.id);
    const result = await dbA.parent.findUnique({ where: { id: parentB.id } });
    expect(result).toBeNull();
  });

  it("forTenant(A) can read its own row by id", async () => {
    const dbA = forTenant(tenantA.id);
    const result = await dbA.parent.findUnique({ where: { id: parentA.id } });
    expect(result?.id).toBe(parentA.id);
  });

  it("assertOwnedByTenant rejects an id belonging to another tenant", async () => {
    const dbA = forTenant(tenantA.id);
    await expect(
      assertOwnedByTenant(dbA, "parent", parentB.id),
    ).rejects.toThrow();
  });

  it("assertOwnedByTenant accepts an id belonging to the caller's own tenant", async () => {
    const dbA = forTenant(tenantA.id);
    await expect(
      assertOwnedByTenant(dbA, "parent", parentA.id),
    ).resolves.toBeUndefined();
  });
});
