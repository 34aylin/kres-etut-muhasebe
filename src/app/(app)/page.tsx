import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/roles";
import { TENANT_TYPE_LABELS } from "@/lib/tenant-type";
import { formatMoney } from "@/lib/money";
import { forTenant } from "@/lib/tenant-db";
import { cn } from "@/lib/utils";

async function getEtutStats(tenantId: string) {
  const db = forTenant(tenantId);
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const [activeStudentCount, monthlyIncome, charges, paidByCharge] =
    await Promise.all([
      db.student.count({ where: { status: "ACTIVE" } }),
      db.transaction.aggregate({
        where: { type: "INCOME", date: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      }),
      db.charge.findMany({ select: { id: true, amount: true } }),
      db.transaction.groupBy({
        by: ["chargeId"],
        where: { type: "INCOME", chargeId: { not: null } },
        _sum: { amount: true },
      }),
    ]);

  const paidByChargeId = new Map(
    paidByCharge.map((row) => [row.chargeId as string, Number(row._sum.amount ?? 0)]),
  );
  const pendingChargeCount = charges.filter(
    (charge) => Number(charge.amount) - (paidByChargeId.get(charge.id) ?? 0) > 0,
  ).length;

  return {
    activeStudentCount,
    monthlyIncome: Number(monthlyIncome._sum.amount ?? 0),
    pendingChargeCount,
  };
}

export default async function Home() {
  const session = await auth();
  const user = session!.user;
  const isKres = user.tenantType === "KRES";
  const etutStats = isKres ? null : await getEtutStats(user.tenantId);

  return (
    <div>
      <Card
        className={cn(
          "max-w-2xl",
          isKres && "rounded-[calc(var(--radius)+8px)] border-2 border-dashed border-[#F3B23E]",
        )}
      >
        <CardHeader>
          <CardTitle className={cn(isKres && "font-heading")}>
            Hoş geldiniz, {user.name}
            {isKres ? " \u{1F389}" : ""}
          </CardTitle>
          <CardDescription>
            {isKres
              ? "Küçük dostlarımızın bugünü nasıl geçiyor, bir göz atalım! 🎈"
              : `${TENANT_TYPE_LABELS[user.tenantType]} için veli, öğrenci ve kayıt yönetimi — sol menüyü kullanabilirsiniz.`}
          </CardDescription>
          <Badge
            variant="secondary"
            className={cn("mt-2 w-fit", isKres && "font-heading rounded-full")}
          >
            {TENANT_TYPE_LABELS[user.tenantType]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Şube (Tenant):</span>{" "}
            {user.tenantSlug}
          </p>
          <p>
            <span className="text-muted-foreground">Rol:</span>{" "}
            {ROLE_LABELS[user.role]}
          </p>
          <p>
            <span className="text-muted-foreground">E-posta:</span>{" "}
            {user.email}
          </p>
        </CardContent>
      </Card>

      {etutStats && (
        <div className="mt-4 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-primary/10 p-4">
            <p className="text-2xl font-semibold text-primary">
              {etutStats.activeStudentCount}
            </p>
            <p className="text-xs text-muted-foreground">Aktif kursiyer</p>
          </div>
          <div className="rounded-lg bg-accent p-4">
            <p className="text-2xl font-semibold text-accent-foreground">
              {formatMoney(etutStats.monthlyIncome)}
            </p>
            <p className="text-xs text-muted-foreground">Bu ay tahsilat</p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-2xl font-semibold text-secondary-foreground">
              {etutStats.pendingChargeCount}
            </p>
            <p className="text-xs text-muted-foreground">Bekleyen taksit</p>
          </div>
        </div>
      )}
    </div>
  );
}
