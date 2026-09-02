-- AlterTable
ALTER TABLE `invoiceitem` ADD COLUMN `repairOrderId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `InvoiceItem` ADD CONSTRAINT `InvoiceItem_repairOrderId_fkey` FOREIGN KEY (`repairOrderId`) REFERENCES `RepairOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
