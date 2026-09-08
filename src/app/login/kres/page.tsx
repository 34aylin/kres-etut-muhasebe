import { Suspense } from "react";
import Link from "next/link";

import { TenantThemeScope } from "@/components/layout/tenant-theme-scope";
import { LoginForm } from "../login-form";

export default function KresLoginPage() {
  return (
    <TenantThemeScope tenantType="KRES">
      <div
        className="flex min-h-svh flex-col items-center justify-center gap-4 p-4"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Ccircle cx='9' cy='9' r='2' fill='white' fill-opacity='.95'/%3E%3C/svg%3E\")",
          backgroundSize: "18px 18px",
        }}
      >
        <Suspense>
          <LoginForm
            expectedType="KRES"
            title="Kreş Girişi 🧸"
            description="Kreş Yönetimi — Kreş & Etüt Merkezi Muhasebe Sistemi"
            mismatchMessage="E-posta veya şifre hatalı. Etüt şubesi kullanıcısıysanız Etüt girişini kullanın."
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
