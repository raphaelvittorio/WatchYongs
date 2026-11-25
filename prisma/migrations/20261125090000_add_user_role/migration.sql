-- AlterTable
ALTER TABLE `User` ADD COLUMN `role` ENUM('MASTER', 'STAFF') NOT NULL DEFAULT 'STAFF';

-- Sebelum ada role, semua akun punya akses penuh. Akun yang sudah ada saat
-- migrasi ini jalan tetap MASTER supaya tidak ada yang kehilangan akses;
-- akun yang dibuat sesudahnya default STAFF.
UPDATE `User` SET `role` = 'MASTER';
