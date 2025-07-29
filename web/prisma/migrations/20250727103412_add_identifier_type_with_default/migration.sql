/*
  Warnings:

  - A unique constraint covering the columns `[phoneNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `identifierType` ENUM('EMAIL', 'PHONE', 'NAME') NOT NULL DEFAULT 'EMAIL',
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_phoneNumber_key` ON `users`(`phoneNumber`);

-- CreateIndex
CREATE INDEX `users_email_idx` ON `users`(`email`);

-- CreateIndex
CREATE INDEX `users_phoneNumber_idx` ON `users`(`phoneNumber`);

-- CreateIndex
CREATE INDEX `users_name_idx` ON `users`(`name`);

-- CreateIndex
CREATE INDEX `users_identifierType_idx` ON `users`(`identifierType`);
