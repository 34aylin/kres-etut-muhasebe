import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { TENANT_TYPE_LABELS } from "@/lib/tenant-type";
import { NewTenantDialog } from "./new-tenant-dialog";

export default async function AdminPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Şubeler</CardTitle>
          <CardDescription>
            Tüm kreş/etüt şubelerini (tenant) buradan yönetin.
          </CardDescription>
        </div>
        <NewTenantDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Şube Adı</TableHead>
              <TableHead>Kod (slug)</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Kullanıcı Sayısı</TableHead>
              <TableHead>Oluşturulma</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Henüz şube yok.
                </TableCell>
              </TableRow>
            )}
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  {tenant.slug}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {TENANT_TYPE_LABELS[tenant.type]}
                  </Badge>
                </TableCell>
                <TableCell>{tenant._count.users}</TableCell>
                <TableCell>
                  {tenant.createdAt.toLocaleDateString("tr-TR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
