import { Suspense } from "react";
import Link from "next/link";

import { TenantThemeScope } from "@/components/layout/tenant-theme-scope";
import { LoginForm } from "../login-form";

export default function EtutLoginPage() {
  return (
    <TenantThemeScope tenantType="ETUT">
      <div
        className="flex min-h-svh flex-col items-center justify-center gap-4 p-4"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(59,130,196,.14) 0 1.5px, transparent 1.5px 16px)",
        }}
      >
        <Suspense>
          <LoginForm
            expectedType="ETUT"
            title="Etüt Girişi"
            description="Etüt Yönetimi — Kreş & Etüt Merkezi Muhasebe Sistemi"
            mismatchMessage="E-posta veya şifre hatalı. Kreş şubesi kullanıcısıysanız Kreş girişini kullanın."
          />
        </Suspense>
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline"
        >
          ← Diğer giriş türünü seç
        </Link>
      </div>
    </TenantThemeScope>
  );
}
