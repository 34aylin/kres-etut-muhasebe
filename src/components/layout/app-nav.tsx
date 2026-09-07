"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma/client";

const NAV_ITEMS: Array<{ href: string; label: string; roles?: UserRole[] }> = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/parents", label: "Veliler" },
  { href: "/students", label: "Öğrenciler" },
  { href: "/admin", label: "Yönetici Paneli", roles: ["ADMIN"] },
];

export function AppNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map(
        (item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                isActive ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        },
      )}
    </nav>
  );
}
