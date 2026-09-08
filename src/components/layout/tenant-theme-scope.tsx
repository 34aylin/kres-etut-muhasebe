import type { TenantType } from "@/generated/prisma/client";

/**
 * Bir alt ağacı tenant türüne göre temalar (bkz. globals.css
 * [data-app-theme="kres"|"etut"]). CSS custom property'ler miras
 * yoluyla yayıldığından, içindeki tüm shadcn bileşenleri (Button, Card,
 * Sidebar, ...) hiçbir değişiklik gerekmeden yeni renk/radius'u kullanır.
 */
export function TenantThemeScope({
  tenantType,
  className,
  children,
}: {
  tenantType: TenantType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-app-theme={tenantType === "KRES" ? "kres" : "etut"}
      className={`min-h-svh bg-background text-foreground ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
