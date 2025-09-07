-- CreateEnum
CREATE TYPE "public"."Period" AS ENUM ('PER_EXPENSE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."ReviewRoute" AS ENUM ('AUTO_APPROVE', 'MANUAL_REVIEW');

-- CreateTable
CREATE TABLE "public"."Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "orgId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "period" "public"."Period" NOT NULL,
    "reviewRoute" "public"."ReviewRoute" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Policy_orgId_idx" ON "public"."Policy"("orgId");

-- CreateIndex
CREATE INDEX "Policy_categoryId_idx" ON "public"."Policy"("categoryId");

-- CreateIndex
CREATE INDEX "Policy_userId_idx" ON "public"."Policy"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_orgId_categoryId_userId_key" ON "public"."Policy"("orgId", "categoryId", "userId");

-- AddForeignKey
ALTER TABLE "public"."Policy" ADD CONSTRAINT "Policy_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Policy" ADD CONSTRAINT "Policy_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Policy" ADD CONSTRAINT "Policy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
