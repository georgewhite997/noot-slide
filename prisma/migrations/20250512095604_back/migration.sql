/*
  Warnings:

  - You are about to alter the column `highestScore` on the `user` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `fishes` on the `user` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `highestScore` INTEGER NOT NULL DEFAULT 0,
    MODIFY `fishes` INTEGER NOT NULL DEFAULT 0;
