"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const tenantSchema = z.object({
  name: z.string().min(1, "Şube adı zorunludur").max(200),
});

export async function updateTenantName(name: string) {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new Error("Oturum bulunamadı");
  if (user.role !== "ADMIN") throw new Error("Bu işlem için yetkiniz yok");

  const parsed = tenantSchema.parse({ name });

  // Tenant modelinin kendisi tenant-scoped değildir (kök varlık); izolasyon
  // burada `where: { id: user.tenantId }` ile manuel sağlanır — kullanıcı
  // yalnızca kendi tenant'ını güncelleyebilir.
  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: { name: parsed.name },
  });

  revalidatePath("/admin/sube");
}
