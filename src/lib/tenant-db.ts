import { prisma } from "@/lib/prisma";

/**
 * Tenant izolasyonu uygulanan Prisma modelleri.
 * Yeni bir tenant'a bağlı model eklendiğinde buraya da eklenmelidir.
 */
const TENANT_SCOPED_MODELS = new Set([
  "User",
  "Parent",
  "Student",
  "StudentParent",
  "Enrollment",
  "Account",
  "Category",
  "Transaction",
  "Charge",
  "FeePlan",
  "AuditLog",
]);

const READ_AND_BULK_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

const SINGLE_TARGET_OPS = new Set([
  "update",
  "updateManyAndReturn",
  "delete",
  "upsert",
]);

/**
 * Belirli bir tenant'a kilitlenmiş bir Prisma Client döndürür.
 * Bu client ile yapılan tüm sorgular otomatik olarak `tenantId` ile filtrelenir
 * (find/update/delete) ve yeni kayıtlara otomatik olarak `tenantId` eklenir (create).
 *
 * Uygulama kodu asla ham `prisma` client'ı ile tenant'a bağlı modelleri
 * sorgulamamalı; bunun yerine bu fonksiyonun döndürdüğü client kullanılmalı.
 * Böylece bir tenant'ın verisi yanlışlıkla (veya kötü niyetle) başka bir
 * tenant'ın oturumu üzerinden görüntülenemez/değiştirilemez.
 */
export function forTenant(tenantId: string) {
  if (!tenantId) {
    throw new Error("forTenant: tenantId zorunludur");
  }

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const scopedArgs = args as any;

          if (READ_AND_BULK_OPS.has(operation)) {
            scopedArgs.where = { ...(scopedArgs.where ?? {}), tenantId };
          } else if (SINGLE_TARGET_OPS.has(operation)) {
            scopedArgs.where = { ...(scopedArgs.where ?? {}), tenantId };
          } else if (operation === "create") {
            scopedArgs.data = { ...(scopedArgs.data ?? {}), tenantId };
          } else if (
            operation === "createMany" ||
            operation === "createManyAndReturn"
          ) {
            if (Array.isArray(scopedArgs.data)) {
              scopedArgs.data = scopedArgs.data.map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (row: any) => ({ ...row, tenantId }),
              );
            }
          }

          return query(scopedArgs);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof forTenant>;

/**
 * Bir modele referans veren bir ID'nin (örn. formdan gelen `parentId`,
 * `accountId`) gerçekten bu tenant'a ait olduğunu doğrular.
 *
 * ÖNEMLİ: `forTenant()` yalnızca bir sorgunun KENDİ `where`/`data` alanına
 * `tenantId` ekler; `include` ile çekilen ilişkili kayıtları veya bir
 * create/update payload'ında başka bir modele verilen yabancı anahtar
 * (foreign key) değerlerinin o tenant'a ait olup olmadığını KONTROL ETMEZ.
 * Bu yüzden istemciden gelen ve başka bir modele referans veren her ID,
 * kullanılmadan önce bu fonksiyonla (ya da eşdeğer bir `findUnique`
 * kontrolüyle) doğrulanmalıdır — aksi halde bir tenant, ID'sini bildiği
 * (veya tahmin ettiği) başka bir tenant'ın kaydını kendi verisine
 * bağlayıp o kaydın alanlarını (`include` üzerinden) görüntüleyebilir.
 */
export async function assertOwnedByTenant(
  db: TenantPrismaClient,
  model: "student" | "parent" | "account" | "category",
  id: string,
  message = "Geçersiz veya bu şubeye ait olmayan kayıt.",
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (db as any)[model].findUnique({
    where: { id },
    select: { id: true },
  });
  if (!record) {
    throw new Error(message);
  }
}
