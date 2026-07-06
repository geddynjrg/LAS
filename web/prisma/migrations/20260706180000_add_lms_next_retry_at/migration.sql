-- AlterTable
ALTER TABLE `applications` ADD COLUMN `lmsNextRetryAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `applications_lmsNextRetryAt_idx` ON `applications`(`lmsNextRetryAt`);
