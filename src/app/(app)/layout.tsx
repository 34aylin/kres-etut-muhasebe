import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { AppNav } from "@/components/layout/app-nav";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ROLE_LABELS } from "@/lib/roles";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session!.user;

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex flex-col gap-3 border-b bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-semibold">Kreş &amp; Etüt Merkezi Muhasebe</p>
            <p className="text-sm text-muted-foreground">{user.tenantSlug}</p>
          </div>
          <AppNav role={user.role} />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="font-medium">{user.name}</p>
            <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
    </div>
  );
}
