import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { recordAudit } from "@/lib/audit";
import {
  isLockedOut,
  recordFailedAttempt,
  resetLoginAttempts,
} from "@/lib/login-attempts";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
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

        // Kimlik doğrulama, giriş anında henüz bilinmeyen bir tenant'a
        // bağlı olamayacağından ham `prisma` client'ı ile global email
        // araması yapılır. Girişten sonraki tüm veri erişimi
        // `forTenant(session.user.tenantId)` üzerinden yapılmalıdır.
        const user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        });

        if (!user || !user.isActive) return null;

        // Hesap, çok sayıda başarısız denemeden sonra geçici olarak
        // kilitlenmiş olabilir. Kullanıcı sayısı taraması (enumeration)
        // riskini azaltmak için burada da genel "giriş başarısız" davranışı
        // korunur — kilitli olduğu ayrıca belirtilmez.
        if (isLockedOut(user.lockedUntil)) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          const next = recordFailedAttempt(user.failedLoginAttempts);
          await prisma.user.update({ where: { id: user.id }, data: next });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: resetLoginAttempts(),
        });
        await recordAudit({
          tenantId: user.tenantId,
          userId: user.id,
          action: "LOGIN",
          entityType: "User",
          entityId: user.id,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.tenantId = token.tenantId;
      session.user.tenantSlug = token.tenantSlug;
      return session;
    },
  },
});
