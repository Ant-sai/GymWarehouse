-- AlterTable
ALTER TABLE `standby_orders` MODIFY `user_id` INTEGER NULL,
    MODIFY `payment_method` ENUM('CREDITCARD', 'PAYPAL', 'CASH', 'QRCODE', 'ACCOUNT_DEBIT', 'FREE') NULL;
