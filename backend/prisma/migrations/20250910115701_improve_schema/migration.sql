/*
  Warnings:

  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `trainer_price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `cost` on the `products` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `balance` on the `users` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - Added the required column `total_price` to the `order_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `order_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `products` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `quantity` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `trainer_price` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cost` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- DropIndex
DROP INDEX "public"."order_details_productId_key";

-- DropIndex
DROP INDEX "public"."products_name_key";

-- AlterTable
ALTER TABLE "public"."order_details" ADD COLUMN     "total_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "unit_price" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "quantity" SET NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 0,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "trainer_price" SET NOT NULL,
ALTER COLUMN "trainer_price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "cost" SET NOT NULL,
ALTER COLUMN "cost" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(10,2);
