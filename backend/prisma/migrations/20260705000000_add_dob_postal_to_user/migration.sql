-- AlterTable
ALTER TABLE `users`
  ADD COLUMN `date_of_birth` DATE NULL,
  ADD COLUMN `postal_code` VARCHAR(20) NULL;
