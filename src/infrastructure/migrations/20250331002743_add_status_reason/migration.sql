-- CreateEnum
CREATE TYPE "OrderStatusReason" AS ENUM ('INVALID_CUSTOMER', 'NO_INVENTORY', 'PAYMENT_FAILED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "statusReason" TEXT;
