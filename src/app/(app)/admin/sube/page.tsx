import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { TenantNameForm } from "./tenant-name-form";

export default async function BranchSettingsPage() {
  const session = await auth();
  const user = session!.user;

  if (user.role !== "ADMIN") redirect("/");

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: user.tenantId },
  });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Şube Ayarları</CardTitle>
        <CardDescription>
          Şube (tenant) bilgilerini görüntüleyin ve düzenleyin. Bu bilgiler
          yalnızca sizin şubenizi etkiler.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Şube kodu (slug): <span className="font-mono">{tenant.slug}</span>
        </p>
        <TenantNameForm initialName={tenant.name} />
      </CardContent>
    </Card>
  );
}
