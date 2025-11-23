/*
  Warnings:

  - A unique constraint covering the columns `[applicationId,phoneNumber]` on the table `member_data` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[applicationId,nationalIdCode]` on the table `member_data` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `member_data_applicationId_phoneNumber_key` ON `member_data`(`applicationId`, `phoneNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `member_data_applicationId_nationalIdCode_key` ON `member_data`(`applicationId`, `nationalIdCode`);
