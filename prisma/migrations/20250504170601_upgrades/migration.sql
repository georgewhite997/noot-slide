/*
  Warnings:

  - You are about to drop the column `fish` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `User_id_key` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `fish`,
    ADD COLUMN `fishes` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Upgrade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `levels` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserUpgrade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `upgradeId` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserUpgrade` ADD CONSTRAINT `UserUpgrade_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserUpgrade` ADD CONSTRAINT `UserUpgrade_upgradeId_fkey` FOREIGN KEY (`upgradeId`) REFERENCES `Upgrade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
