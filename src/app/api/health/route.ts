import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * Docker HEALTHCHECK ve orkestrasyon araçları için genel, kimlik doğrulama
 * gerektirmeyen sağlık kontrolü. Sadece uygulamanın ayakta olduğunu değil,
 * veritabanına gerçekten bağlanabildiğini de doğrular.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Health check başarısız:", error);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
