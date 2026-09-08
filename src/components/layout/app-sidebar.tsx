"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  GraduationCap,
  Home,
  Landmark,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/roles";
import { TENANT_TYPE_LABELS } from "@/lib/tenant-type";
import { cn } from "@/lib/utils";
import type { TenantType, UserRole } from "@/generated/prisma/client";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}> = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/parents", label: "Veliler", icon: Users },
  { href: "/students", label: "Öğrenciler", icon: GraduationCap },
  { href: "/transactions", label: "Gelir/Gider", icon: Wallet },
  { href: "/accounts", label: "Hesaplar", icon: Landmark },
  {
    href: "/reports",
    label: "Raporlar",
    icon: BarChart3,
    roles: ["ADMIN", "ACCOUNTANT"],
  },
  {
    href: "/sube-yonetimi",
    label: "Yönetici Paneli",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
];

// Kreş Yönetimi'nde her menü ikonu kendi renkli çipinde durur (bkz. tema
// karşılaştırma tasarımı). Etüt Yönetimi'nde aynı ikonlar soluk/tarafsız
// çiplerde kalır — sade ve ciddi görünüm.
const KRES_CHIP_COLORS = [
  { bg: "#4338CA", fg: "#FFFFFF" },
  { bg: "#FF8C42", fg: "#FFFFFF" },
  { bg: "#FF6F59", fg: "#FFFFFF" },
  { bg: "#2EC4B6", fg: "#023B36" },
  { bg: "#FFC93C", fg: "#5B3A00" },
  { bg: "#FF9ECD", fg: "#5B0F35" },
  { bg: "#B8E986", fg: "#2B4A0A" },
];

const ETUT_CHIP_COLORS = [
  "#E9E7FB",
  "#FCE3EF",
  "#FBEAE7",
  "#DCEDF9",
  "#FAF2DC",
  "#FBEAF3",
  "#E7F1E0",
];

export function AppSidebar({
  role,
  userName,
  tenantName,
  tenantType,
  signOutSlot,
}: {
  role: UserRole;
  userName: string;
  tenantName: string;
  tenantType: TenantType;
  signOutSlot: React.ReactNode;
}) {
  const pathname = usePathname();
  const isKres = tenantType === "KRES";

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    // Puantiye/çizgi dokusu buradan değil globals.css'teki
    // [data-app-theme] [data-slot="sidebar-inner"] kuralından gelir —
    // bu bileşenin kendi `style`/`className`'ı gerçek arka planı boyayan
    // iç elemana değil, onun şeffaf üst kabına uygulanıyor.
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-0.5 px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={cn(
                "text-base leading-tight font-semibold tracking-tight group-data-[collapsible=icon]:hidden",
                isKres && "font-heading text-lg",
              )}
            >
              Kreş &amp; Etüt Muhasebe
            </p>
            <p className="mt-0.5 text-sm leading-tight text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
              {TENANT_TYPE_LABELS[tenantType]} · {tenantName}
            </p>
          </div>
          {isKres && (
            <span
              className="text-3xl leading-none group-data-[collapsible=icon]:hidden"
              aria-hidden
            >
              🧸
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {visibleItems.map((item, index) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const chipStyle = isKres
                  ? {
                      background: KRES_CHIP_COLORS[index]?.bg,
                      color: KRES_CHIP_COLORS[index]?.fg,
                    }
                  : { background: ETUT_CHIP_COLORS[index] };
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      size="lg"
                      className={cn(
                        "text-[15px]",
                        isKres && "rounded-2xl border-2 border-dashed border-[#E8AE4D]",
                      )}
                      render={
                        <Link href={item.href}>
                          <span
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                            style={chipStyle}
                          >
                            <item.icon className="size-4" />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 px-3 py-3 group-data-[collapsible=icon]:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{userName}</p>
          <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
        </div>
        {signOutSlot}
      </SidebarFooter>
    </Sidebar>
  );
}
