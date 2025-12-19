/*
  Warnings:

  - The values [Other] on the enum `member_data_gender` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `member_data` MODIFY `gender` ENUM('Male', 'Female') NOT NULL;
