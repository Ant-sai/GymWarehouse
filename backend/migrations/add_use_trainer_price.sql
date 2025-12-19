-- Migration pour ajouter la colonne use_trainer_price à la table orders
-- Date: 2025-12-19

-- Ajouter la colonne use_trainer_price avec une valeur par défaut false
ALTER TABLE `orders`
ADD COLUMN `use_trainer_price` BOOLEAN NOT NULL DEFAULT false;

-- Créer un index si nécessaire (optionnel)
-- CREATE INDEX `idx_use_trainer_price` ON `orders` (`use_trainer_price`);
