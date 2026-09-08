import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { TenantThemeScope } from "@/components/layout/tenant-theme-scope";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session!.user;

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: user.tenantId },
    select: { name: true },
  });

  return (
    <TenantThemeScope tenantType={user.tenantType}>
      <SidebarProvider>
        <AppSidebar
          role={user.role}
          userName={user.name ?? ""}
          tenantName={tenant.name}
          tenantType={user.tenantType}
          signOutSlot={<SignOutButton />}
        />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <p className="text-sm text-muted-foreground">{user.tenantSlug}</p>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TenantThemeScope>
  );
}
