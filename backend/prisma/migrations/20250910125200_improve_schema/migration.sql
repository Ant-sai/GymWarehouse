/*
  Warnings:

  - You are about to drop the column `status` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "status";

-- DropEnum
DROP TYPE "public"."OrderStatus";
