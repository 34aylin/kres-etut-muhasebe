import type { UserRole } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: UserRole;
    tenantId: string;
    tenantSlug: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string;
      tenantSlug: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    tenantId: string;
    tenantSlug: string;
  }
}
