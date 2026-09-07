import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  const user = session?.user;
  if (!user || !canManageRecords(user.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const db = forTenant(user.tenantId);

  const [chargedSums, paidSums, parents] = await Promise.all([
    db.charge.groupBy({ by: ["parentId"], _sum: { amount: true } }),
    db.transaction.groupBy({
      by: ["parentId"],
      where: { type: "INCOME", chargeId: { not: null } },
      _sum: { amount: true },
    }),
    db.parent.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    }),
  ]);

  const paidByParent = new Map(
    paidSums.map((row) => [
      row.parentId as string,
      Number(row._sum.amount ?? 0),
    ]),
  );
  const parentById = new Map(parents.map((p) => [p.id, p]));

  const rows = chargedSums
    .map((row) => {
      const charged = Number(row._sum.amount ?? 0);
      const paid = paidByParent.get(row.parentId) ?? 0;
      const debt = charged - paid;
      const parent = parentById.get(row.parentId);
      return { parent, charged, paid, debt };
    })
    .filter((r) => r.debt > 0 && r.parent)
    .sort((a, b) => b.debt - a.debt)
    .map((r) => ({
      Veli: `${r.parent!.firstName} ${r.parent!.lastName}`,
      Telefon: r.parent!.phone ?? "",
      Eposta: r.parent!.email ?? "",
      ToplamTahakkuk: r.charged.toFixed(2),
      ToplamTahsilat: r.paid.toFixed(2),
      KalanBorc: r.debt.toFixed(2),
    }));

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="veli_borc_listesi.csv"`,
    },
  });
}
