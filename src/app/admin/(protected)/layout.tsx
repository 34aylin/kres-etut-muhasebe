import { redirect } from "next/navigation";

import { adminAuth } from "@/auth-admin";
import { AdminSignOutButton } from "@/components/layout/admin-sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await adminAuth();
  if (!session?.user?.isPlatformAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div>
          <p className="font-semibold">Platform Yönetimi</p>
          <p className="text-sm text-muted-foreground">
            {session.user.name}
          </p>
        </div>
        <AdminSignOutButton />
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-6">{children}</main>
    </div>
  );
}
