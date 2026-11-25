-- Multi cabang: Ruko Golden 8 (cabang lama) + Hampton.
-- Ditulis manual (dari `prisma migrate diff --script`) supaya data lama ikut
-- diberi cabang sebelum kolomnya dibuat wajib. Tidak ada DROP: aman untuk
-- `prisma migrate deploy` di build Hostinger.
--
-- JANGAN jalankan isi file ini manual di phpMyAdmin — build Hostinger sudah
-- menjalankannya otomatis. Kalau dijalankan dua kali, deploy berikutnya gagal.

-- 1. Tabel cabang
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `orderPrefix` VARCHAR(191) NOT NULL,
    `invoicePrefix` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Branch_orderPrefix_key`(`orderPrefix`),
    UNIQUE INDEX `Branch_invoicePrefix_key`(`invoicePrefix`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Dua cabang. Golden 8 memakai prefix lama supaya nomor tetap berlanjut.
INSERT INTO `Branch` (`id`, `name`, `orderPrefix`, `invoicePrefix`) VALUES
    ('golden8', 'Ruko Golden 8', 'WY', 'INV'),
    ('hampton', 'Hampton', 'WYH', 'INVH');

-- 3. Kolom cabang, nullable dulu supaya baris lama bisa diisi.
ALTER TABLE `Customer` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `Invoice` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `RepairOrder` ADD COLUMN `branchId` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `branchId` VARCHAR(191) NULL;

-- 4. Semua data sebelum fitur ini berasal dari Ruko Golden 8.
UPDATE `Customer` SET `branchId` = 'golden8';
UPDATE `Invoice` SET `branchId` = 'golden8';
UPDATE `RepairOrder` SET `branchId` = 'golden8';
-- Master tidak punya cabang (akses semua). Staff yang sudah ada masuk Golden 8,
-- kecuali akun Hampton yang memang disiapkan untuk cabang kedua.
UPDATE `User` SET `branchId` = 'golden8' WHERE `role` = 'STAFF';
UPDATE `User` SET `branchId` = 'hampton' WHERE `role` = 'STAFF' AND `email` = 'hampton@watchyoung.local';

-- 5. Sekarang wajib (tanpa default, supaya kode yang lupa mengisi cabang gagal
--    keras, bukan diam-diam masuk Golden 8).
ALTER TABLE `Customer` MODIFY `branchId` VARCHAR(191) NOT NULL;
ALTER TABLE `Invoice` MODIFY `branchId` VARCHAR(191) NOT NULL;
ALTER TABLE `RepairOrder` MODIFY `branchId` VARCHAR(191) NOT NULL;

-- 6. Index + foreign key
CREATE INDEX `Customer_branchId_idx` ON `Customer`(`branchId`);
CREATE INDEX `Invoice_branchId_idx` ON `Invoice`(`branchId`);
CREATE INDEX `RepairOrder_branchId_idx` ON `RepairOrder`(`branchId`);
CREATE INDEX `User_branchId_idx` ON `User`(`branchId`);

ALTER TABLE `User` ADD CONSTRAINT `User_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RepairOrder` ADD CONSTRAINT `RepairOrder_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. Counter nomor TIDAK diubah: Golden 8 tetap memakai baris `order_number` /
--    `invoice_number` yang lama (lihat lib/order-number.ts). Hampton memakai
--    `order_number:hampton` / `invoice_number:hampton`, dibuat otomatis saat
--    order/invoice Hampton pertama.
