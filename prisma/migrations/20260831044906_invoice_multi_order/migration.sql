-- AlterTable: add new nullable FK column on RepairOrder first
ALTER TABLE `repairorder` ADD COLUMN `invoiceId` VARCHAR(191) NULL;

-- Data migration: carry over existing 1:1 repairOrderId -> invoiceId mapping
UPDATE `repairorder` r
JOIN `invoice` i ON i.`repairOrderId` = r.`id`
SET r.`invoiceId` = i.`id`;

-- DropForeignKey
ALTER TABLE `invoice` DROP FOREIGN KEY `Invoice_repairOrderId_fkey`;

-- DropIndex
DROP INDEX `Invoice_repairOrderId_key` ON `invoice`;

-- AlterTable
ALTER TABLE `invoice` DROP COLUMN `repairOrderId`;

-- AddForeignKey
ALTER TABLE `RepairOrder` ADD CONSTRAINT `RepairOrder_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
