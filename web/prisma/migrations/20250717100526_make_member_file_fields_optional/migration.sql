/*
  Warnings:

  - You are about to alter the column `certificateOfDisability` on the `member_data` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `member_data` MODIFY `certificateOfDisability` JSON NULL;
