-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `applications` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `status` ENUM('UNSUBMITTED', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'UNSUBMITTED',
    `applicationProgress` INTEGER NOT NULL DEFAULT 1,
    `userId` VARCHAR(191) NOT NULL,
    `syncStatus` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `syncAttempts` INTEGER NOT NULL DEFAULT 0,
    `lastSyncAt` DATETIME(3) NULL,
    `syncError` TEXT NULL,
    `externalId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `applications_applicationId_key`(`applicationId`),
    INDEX `applications_userId_idx`(`userId`),
    INDEX `applications_status_idx`(`status`),
    INDEX `applications_syncStatus_idx`(`syncStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_data` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `groupName` VARCHAR(191) NOT NULL,
    `groupRegistrationNumber` VARCHAR(191) NOT NULL,
    `dateFormed` DATETIME(3) NOT NULL,
    `groupRegistrationCertificate` JSON NOT NULL,
    `listOfMembersOnCertificate` JSON NOT NULL,
    `purposeOfTheGroup` JSON NOT NULL,
    `keyActivitiesOfTheGroup` JSON NOT NULL,
    `groupCreditHistory` JSON NOT NULL,
    `other` VARCHAR(191) NULL,
    `valueChain` JSON NULL,
    `tableBankingExperience` INTEGER NULL,
    `tableBankingShareContribution` DOUBLE NULL,
    `tableBankingTotalLoanedOut` DOUBLE NULL,
    `tableBankingTotalRevolvingFund` DOUBLE NULL,
    `countyOfOperation` VARCHAR(191) NOT NULL,
    `constituency` VARCHAR(191) NOT NULL,
    `ward` VARCHAR(191) NOT NULL,
    `meetingPoint` VARCHAR(191) NOT NULL,
    `nearestLandmark` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `group_data_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_data` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `natureOfTheGroup` VARCHAR(191) NOT NULL,
    `fullname` VARCHAR(191) NOT NULL,
    `nationalIdCode` VARCHAR(191) NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    `type` ENUM('Chairman', 'Secretary', 'Member') NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `photoOfId` JSON NOT NULL,
    `certificateOfDisability` VARCHAR(191) NULL,
    `pwdNumber` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `member_data_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_conditions` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `purposeOfLoan` JSON NOT NULL,
    `loanType` VARCHAR(191) NOT NULL,
    `loanAmount` DOUBLE NOT NULL,
    `repaymentPeriod` INTEGER NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `bankNameOther` VARCHAR(191) NULL,
    `bankBranch` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loan_conditions_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposed_business` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `natureOfBusiness` VARCHAR(191) NOT NULL,
    `businessType` JSON NOT NULL,
    `yearsInBusiness` INTEGER NOT NULL,
    `averageIncome` DOUBLE NOT NULL,
    `costOfGoods` DOUBLE NOT NULL,
    `rentForBusiness` DOUBLE NOT NULL,
    `salaries` DOUBLE NOT NULL,
    `transportForBusinessStock` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `proposed_business_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `confirmations` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `membersConfirm` BOOLEAN NOT NULL DEFAULT false,
    `correctInformationConfirm` BOOLEAN NOT NULL DEFAULT false,
    `liabilityConfirm` BOOLEAN NOT NULL DEFAULT false,
    `fundsEligibleConfirm` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `confirmations_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `taxonomy_vocabularies` (
    `id` VARCHAR(191) NOT NULL,
    `vocabularyId` VARCHAR(191) NOT NULL,
    `vocabularyLabel` VARCHAR(191) NOT NULL,
    `vocabularyDescription` TEXT NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `entityType` ENUM('application', 'group_member') NOT NULL,
    `cardinality` ENUM('single', 'multiple') NOT NULL,
    `autoCreate` BOOLEAN NOT NULL DEFAULT false,
    `totalTerms` INTEGER NOT NULL,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `taxonomy_vocabularies_vocabularyId_key`(`vocabularyId`),
    INDEX `taxonomy_vocabularies_fieldName_idx`(`fieldName`),
    INDEX `taxonomy_vocabularies_entityType_idx`(`entityType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `taxonomy_terms` (
    `id` VARCHAR(191) NOT NULL,
    `tid` INTEGER NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` JSON NOT NULL,
    `weight` INTEGER NOT NULL,
    `parentIds` JSON NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `language` JSON NOT NULL,
    `vocabularyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `taxonomy_terms_uuid_key`(`uuid`),
    INDEX `taxonomy_terms_vocabularyId_idx`(`vocabularyId`),
    INDEX `taxonomy_terms_tid_idx`(`tid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_queue` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `payload` JSON NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `scheduledFor` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `sync_queue_status_scheduledFor_idx`(`status`, `scheduledFor`),
    INDEX `sync_queue_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_data` ADD CONSTRAINT `group_data_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_data` ADD CONSTRAINT `member_data_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_conditions` ADD CONSTRAINT `loan_conditions_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposed_business` ADD CONSTRAINT `proposed_business_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `confirmations` ADD CONSTRAINT `confirmations_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taxonomy_terms` ADD CONSTRAINT `taxonomy_terms_vocabularyId_fkey` FOREIGN KEY (`vocabularyId`) REFERENCES `taxonomy_vocabularies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
