-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('KRES', 'ETUT');

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "program" "ProgramType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enrollments_tenantId_idx" ON "enrollments"("tenantId");

-- CreateIndex
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
