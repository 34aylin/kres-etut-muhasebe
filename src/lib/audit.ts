import type { AuditAction, Prisma } from "@/generated/prisma/client";
import { forTenant } from "@/lib/tenant-db";

/**
 * Kritik bir işlemi (kayıt oluşturma/silme, tutar değişikliği, giriş vb.)
 * denetim kaydına (AuditLog) yazar. Bu fonksiyon asla ana işlemi
 * başarısız kılmamalıdır — bu yüzden hata durumunda sadece konsola loglar,
 * fırlatmaz (bir tahsilat kaydı sırf audit log yazılamadı diye kaybolmasın).
 */
export async function recordAudit(params: {
  tenantId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await forTenant(params.tenantId).auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("Audit log yazılamadı:", error);
  }
}
