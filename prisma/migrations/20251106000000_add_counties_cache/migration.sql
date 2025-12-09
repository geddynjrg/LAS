-- This migration captures the counties cache tables that were added via db:push
-- The tables already exist in the database, so this is a baseline migration

-- CreateTable
CREATE TABLE `counties_cache` (
    `id` VARCHAR(191) NOT NULL,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalCounties` INTEGER NOT NULL,
    `totalConstituencies` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `counties` (
    `id` VARCHAR(191) NOT NULL,
    `tid` INTEGER NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `weight` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `language` LONGTEXT NOT NULL,
    `cacheId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `counties_uuid_key`(`uuid`),
    INDEX `counties_cacheId_idx`(`cacheId`),
    INDEX `counties_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `constituencies` (
    `id` VARCHAR(191) NOT NULL,
    `tid` INTEGER NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `weight` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `language` LONGTEXT NOT NULL,
    `countyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `constituencies_uuid_key`(`uuid`),
    INDEX `constituencies_countyId_idx`(`countyId`),
    INDEX `constituencies_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `counties` ADD CONSTRAINT `counties_cacheId_fkey` FOREIGN KEY (`cacheId`) REFERENCES `counties_cache`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `constituencies` ADD CONSTRAINT `constituencies_countyId_fkey` FOREIGN KEY (`countyId`) REFERENCES `counties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
