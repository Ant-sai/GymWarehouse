-- AlterTable: add session_count to users
ALTER TABLE "users" ADD COLUMN "session_count" INTEGER;

-- CreateTable: subscription_durations
CREATE TABLE "subscription_durations" (
    "id" SERIAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT "subscription_durations_pkey" PRIMARY KEY ("id")
);

-- Seed default subscription durations (prices to be updated by admin)
INSERT INTO "subscription_durations" ("duration", "label", "price") VALUES
(1, '1 mois', 0.00),
(3, '3 mois', 0.00),
(6, '6 mois', 0.00),
(12, '12 mois', 0.00),
(999, 'Domiciliation', 0.00);

-- CreateTable: session_pass_prices
CREATE TABLE "session_pass_prices" (
    "id" SERIAL NOT NULL,
    "sessions" INTEGER NOT NULL,
    "label" VARCHAR(50) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT "session_pass_prices_pkey" PRIMARY KEY ("id")
);

-- Seed default session pass prices (prices to be updated by admin)
INSERT INTO "session_pass_prices" ("sessions", "label", "price") VALUES
(1, '1 séance', 0.00),
(10, '10 séances', 0.00),
(20, '20 séances', 0.00),
(50, '50 séances', 0.00);
