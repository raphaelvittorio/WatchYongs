-- Setup data cabang WatchYongs (Ruko Golden 8 + Hampton).
--
-- Jalankan SEKALI di phpMyAdmin (pilih database produksi → tab SQL), SETELAH
-- deploy fitur multi cabang berhasil.
--
-- JANGAN jalankan isi prisma/migrations/20261125100000_add_branches/migration.sql
-- di sini. Tabel Branch dan kolom branchId sudah dibuat otomatis oleh build
-- Hostinger. Kalau dijalankan dua kali, deploy berikutnya gagal.
--
-- Semua langkah di bawah boleh dilewati:
-- - alamat dan no. HP kosong → header invoice/tanda terima tampil tanpa alamat
-- - cabang staff juga bisa diatur lewat menu Staff → "Role & Cabang"

-- 1. Alamat & no. HP cabang (dicetak di header invoice dan tanda terima).
--    Ganti teks dalam tanda kutip, lalu hapus tanda "-- " di depan baris UPDATE.
--    Invoice yang sudah terbit tidak berubah, hanya invoice berikutnya.
-- UPDATE `Branch` SET `address` = 'Ruko Golden 8 ...', `phone` = '08..' WHERE `id` = 'golden8';
-- UPDATE `Branch` SET `address` = 'Hampton ...',       `phone` = '08..' WHERE `id` = 'hampton';

-- 2. Cek cabang tiap akun. Migrasi sudah mengatur:
--    - semua Master   → tanpa cabang (akses semua cabang)
--    - semua Staff    → Ruko Golden 8
--    - hampton@watchyoung.local (kalau rolenya Staff) → Hampton
SELECT `name`, `email`, `role`, `branchId` FROM `User` ORDER BY `role`, `name`;

-- 3. Kalau ada staff lain yang sebenarnya bekerja di Hampton:
-- UPDATE `User` SET `branchId` = 'hampton' WHERE `email` = 'nama@watchyoung.local' AND `role` = 'STAFF';
