import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { forTenant } from "@/lib/tenant-db";
import { canManageRecords } from "@/lib/roles";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const session = await auth();
  const user = session?.user;
  if (!user || !canManageRecords(user.role)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (from && to) {
    where.date = {
      gte: new Date(`${from}T00:00:00.000Z`),
      lte: new Date(`${to}T23:59:59.999Z`),
    };
  }
  if (type === "INCOME" || type === "EXPENSE") {
    where.type = type;
  }

  const db = forTenant(user.tenantId);
  const transactions = await db.transaction.findMany({
    where,
    orderBy: { date: "asc" },
    include: { account: true, category: true, student: true, parent: true },
  });

  const rows = transactions.map((tx) => ({
    Tarih: tx.date.toLocaleDateString("tr-TR"),
    Tur: TRANSACTION_TYPE_LABELS[tx.type],
    Kategori: tx.category?.name ?? "",
    Hesap: tx.account.name,
    Tutar: Number(tx.amount).toFixed(2),
    Veli: tx.parent ? `${tx.parent.firstName} ${tx.parent.lastName}` : "",
    Ogrenci: tx.student ? `${tx.student.firstName} ${tx.student.lastName}` : "",
    OdemeYontemi: PAYMENT_METHOD_LABELS[tx.paymentMethod],
    Aciklama: tx.description ?? "",
  }));

  const csv = toCsv(rows);
  const filename = `hareketler_${from ?? "tumu"}_${to ?? "tumu"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
