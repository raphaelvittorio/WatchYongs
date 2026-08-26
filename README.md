# WatchYoung — Sistem Reparasi Jam Tangan

Dashboard internal untuk mengelola alur reparasi jam: Intake → Assessment → On Process → Completed → Picked Up.

## Tech Stack

- **Next.js 16** (App Router, TypeScript) — dashboard + API dalam satu codebase
- **Prisma ORM + SQLite** — database lokal (`prisma/dev.db`), gampang pindah ke PostgreSQL nanti tinggal ganti provider + `DATABASE_URL`
- **Tailwind CSS + shadcn/ui** (Base UI primitives)
- **bcryptjs + jose** — auth staff (session cookie JWT, tanpa provider pihak ketiga)
- **react-hook-form + zod** — validasi form

## Setup Awal

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Login dengan akun seed:

- Email: `admin@watchyoung.local`
- Password: `watchyoung123`

`npm run db:seed` bisa dijalankan ulang kapan saja untuk reset ke data contoh (idempotent — akan menghapus data lama dulu).

## Struktur Utama

- `prisma/schema.prisma` — data model (Customer, RepairOrder, Photo, StatusHistory, Assessment, Counter, User)
- `lib/status.ts` — label status, aturan transisi status, helper tanggal
- `lib/auth.ts` / `proxy.ts` — session login & proteksi route
- `lib/photo-upload.ts` — validasi & penyimpanan foto (`public/uploads/{orderId}/...`)
- `app/(dashboard)/` — halaman dashboard, order, customer (perlu login)
- `app/api/` — route handler untuk order, status, assessment, foto, customer

## Fitur yang Sudah Ada

- Login staff
- Dashboard: ringkasan jumlah order per status + alert otomatis (On Process > 14 hari, Completed belum diambil > 7 hari)
- Intake baru: pilih/buat customer, data jam, foto kondisi awal, auto nomor order (`WY-000x`)
- Detail order: timeline status, update status, assessment (estimasi harga + Setuju/Tolak)
- Data customer & riwayat order-nya

## Backup & Restore Database

Tombol **"Backup Database"** di halaman `/users` men-download dump `.sql` lengkap (via `mysqldump`) dari database MySQL/MariaDB yang sedang dipakai.

Restore dari file backup:

```bash
mysql -u root watchyoung < watchyoung-backup-xxxxx.sql
```

## Belum Dikerjakan (Roadmap)

- Notifikasi WhatsApp (intake masuk, quote assessment, reminder pickup)
- Generate invoice PDF + arsip otomatis ke Google Drive
- Reminder otomatis terjadwal (cron/N8N) — data pendukungnya (`statusChangedAt`, `StatusHistory`) sudah ada di schema
- Migrasi SQLite → PostgreSQL untuk production
