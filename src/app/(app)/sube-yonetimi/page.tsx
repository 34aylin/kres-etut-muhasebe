import Link from "next/link";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { forTenant } from "@/lib/tenant-db";
import { ROLE_LABELS } from "@/lib/roles";
import { isLockedOut } from "@/lib/login-attempts";
import { UnlockUserButton } from "./unlock-user-button";

export default async function AdminPage() {
  const session = await auth();
  const user = session!.user;

  // Sadece bu oturumun tenant'ına ait kullanıcılar döner; tenantId
  // `forTenant` tarafından otomatik olarak where koşuluna eklenir.
  const tenantUsers = await forTenant(user.tenantId).user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yönetici Paneli — {user.tenantSlug}</CardTitle>
        <CardDescription>
          Bu ekran sadece ADMIN rolüne açıktır ve yalnızca oturumun bağlı olduğu
          tenant&apos;a ait kullanıcıları listeler (tenant izolasyon
          doğrulaması).
        </CardDescription>
        <div className="flex gap-4">
          <Link href="/sube-yonetimi/sube" className="text-sm text-primary underline">
            Şube ayarlarını düzenle →
          </Link>
          <Link href="/sube-yonetimi/audit" className="text-sm text-primary underline">
            Denetim kaydını görüntüle →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenantUsers.map((tenantUser) => {
              const locked = isLockedOut(tenantUser.lockedUntil);
              return (
                <TableRow key={tenantUser.id}>
                  <TableCell>{tenantUser.name}</TableCell>
                  <TableCell>{tenantUser.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ROLE_LABELS[tenantUser.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!tenantUser.isActive ? (
                      "Pasif"
                    ) : locked ? (
                      <Badge variant="outline" className="text-red-600">
                        Kilitli
                      </Badge>
                    ) : (
                      "Aktif"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {locked && <UnlockUserButton userId={tenantUser.id} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
