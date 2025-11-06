-- AlterTable
ALTER TABLE `users` ADD COLUMN `drupalUserId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_drupalUserId_key` ON `users`(`drupalUserId`);

-- CreateIndex
CREATE INDEX `users_drupalUserId_idx` ON `users`(`drupalUserId`);
