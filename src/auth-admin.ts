import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

/**
 * Platform-admin auth, tenant kullanıcılarının (`src/auth.ts`) tamamen
 * ayrı bir instance'ı: farklı tablo (`PlatformAdmin`), farklı session
 * çerezi, farklı login sayfası. Tenant `User` modeliyle hiçbir ilişkisi
 * yoktur; tenant izolasyonu (`forTenant`) bu tarafı hiç ilgilendirmez.
 */

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const {
  handlers,
  auth: adminAuth,
  signIn: adminSignIn,
  signOut: adminSignOut,
} = NextAuth({
  basePath: "/api/admin-auth",
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: "authjs.admin-session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const admin = await prisma.platformAdmin.findUnique({
          where: { email },
        });
        if (!admin || !admin.isActive) return null;

        const isValid = await verifyPassword(password, admin.passwordHash);
        if (!isValid) return null;

        // Aşağıdaki role/tenantId/tenantSlug/tenantType alanları global
        // next-auth tip genişletmesinin (src/types/next-auth.d.ts) tenant
        // tarafıyla paylaşıldığı için zorunludur ama platform-admin
        // oturumunda hiçbir yerde okunmaz — sadece `isPlatformAdmin` alanı
        // anlamlıdır.
        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: "ADMIN",
          tenantId: "",
          tenantSlug: "",
          tenantType: "KRES",
          isPlatformAdmin: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.isPlatformAdmin = true;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.isPlatformAdmin = true;
      return session;
    },
  },
});
