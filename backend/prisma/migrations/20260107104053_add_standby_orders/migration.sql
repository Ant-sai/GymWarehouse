-- CreateTable
CREATE TABLE `standby_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `payment_method` ENUM('CREDITCARD', 'PAYPAL', 'CASH', 'QRCODE', 'ACCOUNT_DEBIT', 'FREE') NOT NULL,
    `notes` TEXT NULL,
    `discount_value` DOUBLE NOT NULL DEFAULT 0,
    `discount_comment` TEXT NULL,
    `cart_data` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `standby_orders_userId_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `standby_orders` ADD CONSTRAINT `standby_orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
