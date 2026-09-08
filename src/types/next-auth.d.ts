import type { TenantType, UserRole } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: UserRole;
    tenantId: string;
    tenantSlug: string;
    tenantType: TenantType;
    /**
     * Ayrı platform-admin auth instance'ı (src/auth-admin.ts) da bu aynı
     * global next-auth tiplerini paylaşır. Tenant alanları (role/tenantId/...)
     * bu tür oturumlarda anlamsız placeholder değerler taşır — gerçek
     * ayrım bu alanla yapılır.
     */
    isPlatformAdmin?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string;
      tenantSlug: string;
      tenantType: TenantType;
      isPlatformAdmin?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    tenantId: string;
    tenantSlug: string;
    tenantType: TenantType;
    isPlatformAdmin?: boolean;
  }
}
