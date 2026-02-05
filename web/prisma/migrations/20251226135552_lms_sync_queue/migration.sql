-- AlterTable
ALTER TABLE `applications` ADD COLUMN `lmsLastSyncAt` DATETIME(3) NULL,
    ADD COLUMN `lmsReferenceId` VARCHAR(191) NULL,
    ADD COLUMN `lmsSyncAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lmsSyncError` VARCHAR(191) NULL,
    ADD COLUMN `lmsSyncStatus` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `LmsSyncQueue` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `syncQueueId` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `lastAttemptAt` DATETIME(3) NULL,
    `nextRetryAt` DATETIME(3) NULL,
    `error` VARCHAR(191) NULL,
    `successData` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LmsSyncQueue_applicationId_key`(`applicationId`),
    UNIQUE INDEX `LmsSyncQueue_syncQueueId_key`(`syncQueueId`),
    INDEX `LmsSyncQueue_status_idx`(`status`),
    INDEX `LmsSyncQueue_nextRetryAt_idx`(`nextRetryAt`),
    INDEX `LmsSyncQueue_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LmsSyncQueue` ADD CONSTRAINT `LmsSyncQueue_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`applicationId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LmsSyncQueue` ADD CONSTRAINT `LmsSyncQueue_syncQueueId_fkey` FOREIGN KEY (`syncQueueId`) REFERENCES `sync_queue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
