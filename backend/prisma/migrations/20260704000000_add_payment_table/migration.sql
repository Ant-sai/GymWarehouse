-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NOT NULL,
    `type` ENUM('FORFAIT', 'ENTREE') NOT NULL,
    `period` VARCHAR(100) NOT NULL,
    `payment_mode` ENUM('CASH', 'QRCODE') NOT NULL DEFAULT 'CASH',
    `price` DECIMAL(10, 2) NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_memberId_fkey`(`member_id`),
    INDEX `payments_createdAt_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
