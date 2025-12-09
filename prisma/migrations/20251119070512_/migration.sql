/*
  Warnings:

  - A unique constraint covering the columns `[confirmation_token]` on the table `member_data` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `member_data` ADD COLUMN `confirmation_confirmed_at` DATETIME(3) NULL,
    ADD COLUMN `confirmation_sent_at` DATETIME(3) NULL,
    ADD COLUMN `confirmation_status` ENUM('pending', 'sent', 'confirmed', 'declined', 'failed') NULL DEFAULT 'pending',
    ADD COLUMN `confirmation_token` VARCHAR(64) NULL,
    ADD COLUMN `confirmation_token_expires_at` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `member_data_confirmation_token_key` ON `member_data`(`confirmation_token`);

-- CreateIndex
CREATE INDEX `member_data_confirmation_token_idx` ON `member_data`(`confirmation_token`);

-- CreateIndex
CREATE INDEX `member_data_confirmation_status_idx` ON `member_data`(`confirmation_status`);

-- CreateIndex
CREATE INDEX `member_data_confirmation_token_expires_at_idx` ON `member_data`(`confirmation_token_expires_at`);
