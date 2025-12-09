-- AlterTable: Convert member_data.type from ENUM to VARCHAR
-- This preserves all existing data while allowing dynamic taxonomy values

-- Step 1: Add a temporary column
ALTER TABLE `member_data` ADD COLUMN `type_new` VARCHAR(191) NULL;

-- Step 2: Copy data from enum to varchar
UPDATE `member_data` SET `type_new` = CAST(`type` AS CHAR);

-- Step 3: Drop the old enum column
ALTER TABLE `member_data` DROP COLUMN `type`;

-- Step 4: Rename the new column to the original name
ALTER TABLE `member_data` CHANGE COLUMN `type_new` `type` VARCHAR(191) NOT NULL;

-- Drop the MemberType enum as it's no longer needed
-- Note: MySQL will handle this automatically when the last column using it is removed
