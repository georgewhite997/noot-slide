/*
  Warnings:

  - Added the required column `iconPath` to the `Upgrade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Upgrade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upgradeLabel` to the `Upgrade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `upgrade` ADD COLUMN `iconPath` VARCHAR(191) NOT NULL,
    ADD COLUMN `unit` VARCHAR(191) NOT NULL,
    ADD COLUMN `upgradeLabel` VARCHAR(191) NOT NULL;
