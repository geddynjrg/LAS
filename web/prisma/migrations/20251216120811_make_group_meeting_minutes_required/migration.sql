/*
  Warnings:

  - Made the column `groupMeetingMinutes` on table `group_data` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `group_data` MODIFY `groupMeetingMinutes` LONGTEXT NOT NULL DEFAULT '[]';
