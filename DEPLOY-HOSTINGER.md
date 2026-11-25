# Deploy WatchYongs ke Hostinger (Node.js Web App)

Butuh paket **Business** atau **Cloud** (Node.js Web App). Repo GitHub sudah tersambung, jadi setiap `git push` ke `main` otomatis memicu build ulang.

> File `.env` **tidak** ikut ke GitHub (sengaja, karena isinya rahasia). Semua isinya harus diisi ulang di Hostinger lewat menu **Environment variables**. Inilah penyebab error `The datasource.url property is required...`.

## 1. Buat database MySQL

hPanel → **Websites** → **Manage** (website Node.js-nya) → **Databases** → **Management**

- Isi nama database, username, password → **Create**
- Hostinger menambahkan awalan otomatis, misalnya `u123456789_watchyongs` dan `u123456789_admin`. Catat **nama lengkap** keduanya + password-nya.
- Angka `u123456789` itu juga nama user hosting kamu (dipakai lagi di langkah 2).

## 2. Isi Environment Variables

Dashboard web app → sidebar **Environment variables** → tambah 4 variabel:

| Nama | Nilai | Keterangan |
|---|---|---|
| `DATABASE_URL` | `mysql://u123456789_admin:PASSWORD@127.0.0.1:3306/u123456789_watchyongs` | Pakai **`127.0.0.1`**, jangan `localhost` (di Node 17+ jadi `Access denied`). |
| `AUTH_SECRET` | string acak minimal 32 karakter | Untuk tanda tangan cookie login. Buat dengan perintah di bawah. |
| `ADMIN_INITIAL_PASSWORD` | password admin pertama | Dipakai sekali saat akun admin pertama dibuat. |
| `UPLOAD_DIR` | `/home/u123456789/watchyongs-uploads` | Folder foto & PDF invoice, **di luar** folder build supaya tidak terhapus setiap deploy. |

Membuat `AUTH_SECRET` (jalankan di komputer sendiri):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Kalau password database mengandung karakter khusus, ubah dulu di `DATABASE_URL`: `@` → `%40`, `#` → `%23`, `:` → `%3A`, `/` → `%2F`, `?` → `%3F`, `%` → `%25`. Paling gampang: pakai password tanpa simbol-simbol itu.

Menyimpan environment variables otomatis memicu deploy ulang.

## 3. Build settings (cek saja)

Biasanya sudah terdeteksi benar:

- Framework: **Next.js** · Node.js: **22** · Package manager: **npm**
- Build command: `npm run build` · Output directory: `.next` · Entry file: kosong

`npm run build` sudah menjalankan `prisma migrate deploy` (membuat tabel) → `seed-admin` (membuat akun admin kalau belum ada) → `next build`. Data customer/order tidak pernah dihapus oleh build.

## 4. Cek log deploy

Dashboard → **Deployments** → buka deploy terbaru. Yang harus muncul:

```
4 migrations found in prisma/migrations
...
All migrations have been successfully applied.
Admin user siap: admin@watchyoung.local
...
✓ Compiled successfully
```

## 5. Login & amankan akun

- Buka domain sementara dari Hostinger pakai **https://**
- Login: `admin@watchyoung.local` + password dari `ADMIN_INITIAL_PASSWORD`
- Tambah akun staff di menu **Users**, dan pilih **cabang**-nya (Ruko Golden 8 / Hampton). Staff hanya bisa melihat data cabangnya; Master melihat semua cabang.

## 5a. Multi cabang (sekali saja, setelah deploy fitur cabang)

- Tabel `Branch` dan kolom cabang dibuat **otomatis** oleh build (`prisma migrate deploy`). Semua data lama masuk ke Ruko Golden 8.
- **Jangan** menjalankan file `prisma/migrations/.../migration.sql` manual di phpMyAdmin. Kalau dijalankan dua kali, deploy berikutnya gagal.
- Opsional: isi alamat & no. HP cabang untuk header invoice lewat `sql/setup-cabang.sql` (phpMyAdmin → tab SQL).
- Nomor order: Golden 8 melanjutkan `WY-xxxx` / `INV-xxxx`, Hampton mulai `WYH-0001` / `INVH-0001`.

## 6. Hubungkan domain sendiri (opsional)

Websites → ⋮ → **Connect domain** → ikuti instruksi DNS (A record / nameserver, untuk `domain.com` dan `www.domain.com`). SSL dipasang otomatis; propagasi bisa sampai 24 jam.

## 7. Pindahkan data dari komputer lokal (opsional)

Kalau mau data di Laragon ikut ke server:

1. Export database lokal: di aplikasi buka **Users → Backup Database** (download `.sql`).
2. hPanel → **Databases** → **phpMyAdmin** → pilih database `u123456789_watchyongs` → **Import** → upload file `.sql`.
   Ini mengganti tabel di server dengan isi lokal, termasuk akun login (password-nya jadi sama dengan lokal).
3. Foto & invoice lama: zip isi folder `public/uploads/` di komputer, lalu lewat hPanel **File Manager** upload ke `/home/u123456789/watchyongs-uploads/` dan extract di sana (struktur folder `{orderId}/...` dan `invoices/...` harus tetap sama).

## Backup di server

Tombol **Backup Database** memakai `mysqldump`, yang belum tentu tersedia di Node.js hosting Hostinger. Kalau gagal, pakai **phpMyAdmin → Export** atau menu **Backups** di hPanel. Folder `UPLOAD_DIR` tidak ikut backup database, jadi sesekali download juga lewat File Manager.

## Troubleshooting

| Error di log | Penyebab | Solusi |
|---|---|---|
| `The datasource.url property is required` | `DATABASE_URL` belum diisi | Langkah 2 |
| `Access denied for user ...` | Host `localhost`, atau user/password salah | Pakai `127.0.0.1`, cek nama lengkap ber-awalan `u123..._` |
| `P1001: Can't reach database server` | Host/port salah | `127.0.0.1:3306` |
| Tidak bisa login / terus kembali ke halaman login | `AUTH_SECRET` kosong, atau dibuka lewat `http://` | Isi `AUTH_SECRET`, buka lewat `https://` |
| Foto/invoice hilang setelah push baru | `UPLOAD_DIR` belum diisi | Langkah 2, lalu upload ulang file lama (langkah 7.3) |
| `P3009` / `migrate found failed migrations` | Ada migrasi gagal yang tercatat di `_prisma_migrations` | Perbaiki baris yang gagal di phpMyAdmin dulu, baru deploy ulang |
| Staff tidak bisa login: "belum diberi cabang" | Akun Staff tanpa cabang | Menu Staff → **Role & Cabang** |

Log aplikasi saat berjalan: Dashboard → **Runtime Logs**. Restart: klik badge **Running** → **Restart**.
