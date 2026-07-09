-- AlterTable
ALTER TABLE `payments`
  ADD COLUMN `subscription_start_date` DATE NULL,
  ADD COLUMN `subscription_end_date` DATE NULL,
  ADD COLUMN `duration_months` INT NULL;
