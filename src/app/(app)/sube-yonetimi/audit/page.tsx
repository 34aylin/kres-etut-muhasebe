import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { forTenant } from "@/lib/tenant-db";
import { AUDIT_ACTION_LABELS } from "@/lib/labels";
import { AuditFilters } from "./audit-filters";

const PAGE_SIZE = 25;

const BADGE_VARIANT: Record<string, "secondary" | "outline"> = {
  CREATE: "secondary",
  UPDATE: "outline",
  DELETE: "outline",
  LOGIN: "outline",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const user = session!.user;
  if (user.role !== "ADMIN") redirect("/");

  const { action, entityType, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const db = forTenant(user.tenantId);

  const where = {
    ...(action
      ? { action: action as "CREATE" | "UPDATE" | "DELETE" | "LOGIN" }
      : {}),
    ...(entityType ? { entityType } : {}),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: true },
    }),
    db.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/sube-yonetimi" className="text-sm text-muted-foreground underline">
          ← Yönetici Paneline dön
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Denetim Kaydı (Audit Log)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuditFilters action={action} entityType={entityType} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Aksiyon</TableHead>
                <TableHead>Varlık</TableHead>
                <TableHead>Detay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Kayıt bulunamadı.
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {log.createdAt.toLocaleString("tr-TR")}
                  </TableCell>
                  <TableCell>{log.user?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={BADGE_VARIANT[log.action]}>
                      {AUDIT_ACTION_LABELS[log.action]}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls page={page} totalPages={totalPages} />
        </CardContent>
      </Card>
    </div>
  );
}
