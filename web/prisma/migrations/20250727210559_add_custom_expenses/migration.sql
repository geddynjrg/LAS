-- CreateTable
CREATE TABLE `custom_expenses` (
    `id` VARCHAR(191) NOT NULL,
    `proposedBusinessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `custom_expenses_proposedBusinessId_idx`(`proposedBusinessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `custom_expenses` ADD CONSTRAINT `custom_expenses_proposedBusinessId_fkey` FOREIGN KEY (`proposedBusinessId`) REFERENCES `proposed_business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
