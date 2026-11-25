# Desain: Multi Cabang (Ruko Golden 8 + Hampton)

Tanggal: 2026-11-25 · Status: disetujui dan diimplementasikan

## 1. Tujuan dan alasan

WatchYongs sekarang punya 2 toko: **Ruko Golden 8** (cabang lama) dan **Hampton** (baru). Sistem
belum mengenal cabang. Semua order, customer, dan invoice tercampur, jadi staff Hampton bisa melihat
dan mengubah pekerjaan Golden 8, begitu juga sebaliknya.

Yang diminta pemilik:

1. Tambah cabang kedua (Hampton).
2. Akun non-MASTER diikat ke satu cabang dan **hanya bisa mengakses data cabangnya**.
3. Sediakan SQL-nya.

Keputusan yang sudah disepakati di percakapan:

- Mockup 5 layar disetujui sebagai arah tampilan: switcher cabang untuk master, chip cabang yang
  terkunci untuk staff, field Cabang di halaman Staff dan di Intake, serta header PDF per cabang.
- **Customer dipakai bersama semua cabang dan bisa dicari dari cabang mana pun**, tapi riwayat order
  tetap per cabang. Rinciannya ada di bagian 4.4.
- Pendekatan: tabel `Branch` + filter cabang yang ditulis eksplisit lewat helper bersama (bagian 3).

## 2. Goals / non-goals / anti-goals

**Goals**
- Setiap order, invoice, dan customer (sebagai "cabang asal") punya cabang.
- STAFF hanya melihat dan mengubah order/invoice cabangnya, baik di daftar, pencarian, dashboard,
  link langsung, API, file PDF/foto, maupun export.
- MASTER melihat semua cabang dan bisa memfilter ke satu cabang lewat switcher di sidebar.
- Nomor order dan invoice berurutan per cabang. Golden 8 melanjutkan `WY-`/`INV-`, Hampton mulai
  dari `WYH-0001`/`INVH-0001`.
- Semua data lama otomatis masuk ke Ruko Golden 8 tanpa ada data yang hilang.

**Non-goals (sengaja tidak dibuat sekarang)**
- Halaman untuk menambah atau mengedit cabang. Dua cabang dibuat oleh migrasi, alamat dan HP diisi
  lewat SQL. Cabang ke-3 nanti cukup tambah satu baris di tabel `Branch`.
- Staff yang memegang lebih dari satu cabang.
- Rekening bank, T&C, atau IG yang berbeda per cabang. Untuk kedua cabang tetap sama.
- Memindahkan order dari satu cabang ke cabang lain.

**Anti-goals (dianggap gagal walaupun "jalan")**
- Data cabang lain cuma *disembunyikan* di tampilan tapi masih bisa diakses lewat URL, API, atau
  `/uploads/...`.
- Nomor order atau invoice lama ikut berubah. Nomor itu sudah tercetak di tiket dan PDF.
- Migrasi yang menghapus kolom atau data. Build Hostinger menjalankan `prisma migrate deploy` ke DB
  produksi pada setiap deploy.

## 3. Pendekatan

| | Pendekatan | Trade-off |
|---|---|---|
| **✔ A** | **Tabel `Branch` + kolom `branchId` + helper eksplisit** (`lib/branch.ts`) yang dipakai setiap halaman dan route | Jelas, gampang dibaca dan diuji. Menyentuh sekitar 25 file. Risikonya halaman baru yang lupa memakai helper, dimitigasi dengan `findOrderForUser()` sebagai satu-satunya pintu untuk mengambil order by id. |
| B | Prisma client extension yang menyisipkan filter cabang otomatis | Perubahannya lebih sedikit, tapi cara kerjanya tersembunyi. Rawan di query relasi (invoice gabungan, laporan, nested include) dan sulit di-debug. |
| C | Cabang sebagai enum di kode | Paling simpel, tapi alamat, HP, dan prefix nomor tertanam di kode, dan cabang ke-3 butuh ubah kode + migrasi. |

Dipilih **A** (pilihan Claude, cara membangunnya diserahkan ke Claude oleh pemilik).

## 4. Desain

### 4.1 Data model (`prisma/schema.prisma`)

```prisma
model Branch {
  id            String        @id            // "golden8", "hampton" — id tetap, mudah dibaca di SQL
  name          String                       // "Ruko Golden 8", "Hampton"
  orderPrefix   String        @unique        // "WY", "WYH"
  invoicePrefix String        @unique        // "INV", "INVH"
  address       String?
  phone         String?
  createdAt     DateTime      @default(now())
  users         User[]
  customers     Customer[]
  orders        RepairOrder[]
  invoices      Invoice[]
}
```

Kolom baru:

| Model | Kolom | Wajib? | Arti |
|---|---|---|---|
| `User` | `branchId String?` | null untuk MASTER, wajib untuk STAFF (dicek di API) | cabang tempat staff bekerja |
| `RepairOrder` | `branchId String` | wajib | cabang tempat jam diterima |
| `Invoice` | `branchId String` | wajib | cabang penerbit (sama dengan cabang order-ordernya) |
| `Customer` | `branchId String` | wajib | **cabang asal**, tempat customer pertama kali didaftarkan |

Masing-masing kolom diberi index dan relasi ke `Branch` (tanpa cascade).

**Counter nomor:** Golden 8 **tetap memakai baris counter lama** (`order_number`,
`invoice_number`) tanpa diganti nama, sedangkan cabang lain memakai `order_number:<branchId>` /
`invoice_number:<branchId>`. Aturan ini ada di satu fungsi `counterId(base, branch)` di
`lib/order-number.ts`, dengan konstanta `LEGACY_BRANCH_ID = "golden8"`.
Alasannya: selama build Hostinger, kode lama masih melayani request. Kalau baris counter lama
di-rename, kode lama akan membuat ulang counter dari 1 dan menimpa `invoice-INV-0001.pdf` yang asli
sebelum insert-nya gagal. Dengan counter lama tetap dipakai, kode lama paling buruk hanya melewati
satu nomor. Sebagai pengaman tambahan, `ensureInvoice()` menulis PDF dengan flag `wx`, sehingga
gagal kalau file dengan nama itu sudah ada, bukan menimpanya.
`generateOrderNumber(branch)` / `generateInvoiceNumber(branch)` memakai `branch.orderPrefix` /
`branch.invoicePrefix`. Kolom `orderNumber` dan `invoiceNumber` tetap `@unique` global, dan prefix
yang berbeda menjamin tidak ada tabrakan.

### 4.2 Lingkup akses (`lib/branch.ts`, server-only)

```ts
type BranchScope = {
  user: CurrentUser;          // id, name, email, role, branchId
  branchId: string | null;    // null = semua cabang (hanya mungkin untuk MASTER)
  branch: Branch | null;      // cabang aktif (untuk label, default form)
  branches: Branch[];         // daftar cabang (untuk switcher/select master)
};
```

- `getBranchScope()` (di-`cache()` per request seperti `getCurrentUser`):
  - STAFF memakai `branchId = user.branchId`, dan cookie diabaikan.
  - MASTER memakai cookie `wy_branch`: id cabang yang valid → cabang itu. Kosong, `all`, atau tidak
    valid → `null` (semua cabang).
  - Tidak login, atau STAFF tanpa cabang → `null` scope (pemanggil menolak akses).
Ada **dua jenis batas** yang sengaja dipisah:

- **Hak akses** (siapa kamu): STAFF → hanya cabangnya. MASTER → semua cabang, **selalu**, apa pun
  pilihan switcher-nya.
- **Filter tampilan** (apa yang sedang kamu lihat): STAFF → cabangnya. MASTER → cabang pilihan di
  switcher, atau semua.

Akibatnya, master yang sedang memilih Golden 8 tetap bisa membuka link order Hampton, dan setelah
intake untuk Hampton langsung diarahkan ke halaman order itu tanpa 404.

- `accessWhere(scope)` → `{ branchId: user.branchId }` untuk STAFF, `{}` untuk MASTER. Dipakai untuk
  membuka satu item by id: order, invoice, upload, kartu kerja, validasi sibling saat complete.
- `orderFilterWhere(scope)` / `invoiceFilterWhere(scope)` → `{ branchId }` atau `{}` sesuai filter
  tampilan. Dipakai untuk semua daftar dan agregat: `findMany` daftar, `count`, `groupBy`, dashboard,
  laporan, export.
- `findOrderForUser(id, args?)` → `findFirst({ where: { id, ...accessWhere }, ...args })`.
  **Satu-satunya cara mengambil order by id** di semua route `/api/orders/[id]/*`, halaman detail
  order, dan kartu kerja. Hasil `null` → 404 "Order tidak ditemukan." (bukan 403, supaya keberadaan
  order cabang lain tidak bocor).
- `requireScopeApi()` → `{ scope }` atau `NextResponse` 401. Dipakai di setiap API operasional, yang
  sekarang belum memanggil `getCurrentUser` sama sekali. Efek sampingnya, celah lama "JWT akun yang
  sudah dihapus masih bisa memakai API operasional" ikut tertutup.
- `requireScopePage()` → untuk halaman. Tidak login → `/login`. STAFF tanpa cabang → render pesan
  "Akun belum diberi cabang. Hubungi master."

**Saat MASTER membuat sesuatu dalam mode "Semua cabang"**, form wajib meminta Cabang dan defaultnya
kosong. Saat satu cabang sedang dipilih, defaultnya cabang itu.

### 4.3 Order, invoice, foto, PDF

- `POST /api/orders` (intake): STAFF → `branchId` dari akun, field dari client diabaikan. MASTER →
  `branchId` wajib dari form dan divalidasi ada di tabel `Branch`. Nomor dibuat per cabang.
- `IntakeForm`: tambah field **Cabang**, berupa select untuk master dan read-only terkunci untuk
  staff (mockup layar 4).
- Semua route `/api/orders/[id]/*` (GET/PATCH/DELETE, status, assessment, assessment/decision,
  complete, invoice, photos, tanda-terima, whatsapp-log) memakai `findOrderForUser`.
- **Invoice gabungan:** di halaman detail order, sibling order disaring ke `branchId` order yang
  sama. `POST /api/orders/[id]/complete` menolak `additionalOrderIds` yang beda cabang.
  `ensureInvoice()` menerima cabang order utama, menyimpan `Invoice.branchId`, dan memakai prefix
  cabang.
- **`/uploads/[...path]`** (sekarang hanya butuh login):
  - `invoices/<file>` → cari `Invoice` by `pdfPath`, lalu cek scope cabang.
  - `<orderId>/<file>` → cek scope order lewat `findOrderForUser`.
  - Di luar scope → 404. Ini wajib karena nama file invoice mudah ditebak (`invoice-INV-0005.pdf`).
- **PDF tanda terima dan kartu kerja:** header menampilkan "Cabang {name}" (+ alamat/HP cabang
  kalau diisi). **Invoice PDF sengaja tanpa nama cabang:** pemilik memilih desain invoice persis
  seperti referensi (keputusan di sesi "Tampilan Invoice", 2026-11-25). Cabang tetap terbaca dari
  nomornya (`INV-` Golden 8, `INVH-` Hampton). `InvoicePdfData.branch` tetap dikirim kalau nanti
  ingin ditampilkan.
- **Template WhatsApp:** "bisa diambil di toko" menjadi "bisa diambil di toko WatchYongs {nama
  cabang}" (pilihan Claude, supaya customer tahu tokonya).

### 4.4 Customer (dipakai bersama)

- Data customer satu untuk semua cabang. Picker customer di Intake tetap menampilkan **semua**
  customer, jadi staff Hampton bisa memilih customer yang terdaftar di Golden 8.
- Customer baru (lewat Intake atau `/customers/new`) mendapat `branchId` = cabang yang membuatnya.
  Untuk master, cabangnya dipilih di form.
- `/customers` untuk STAFF, atau MASTER yang memilih satu cabang:
  - tanpa kata kunci → customer dengan `branchId = cabang` **atau** yang punya order di cabang itu;
  - dengan kata kunci → **semua** customer yang cocok nama/HP.
  - Kolom jumlah order dan "order terakhir" hanya menghitung order cabang dalam scope.
- `/customers/[id]`: bisa dibuka siapa saja yang login. Info customer tampil penuh, riwayat order dan
  angka ringkasan hanya dari cabang dalam scope. Order cabang lain tidak tampil, jumlahnya pun tidak.
  Tampilkan label kecil "Terdaftar di {cabang asal}".
- Edit info customer: siapa saja (datanya satu). Hapus: tetap khusus MASTER dan tetap hanya jika
  customer tidak punya order di cabang mana pun.

### 4.5 Dashboard, daftar order, laporan, export

- **Dashboard:** semua hitungan, alert overdue, `PickupReminders`, dan order terbaru memakai
  `orderFilterWhere`. MASTER mode "Semua cabang" → stat card menampilkan rincian per cabang dan tabel
  order terbaru punya kolom Cabang (mockup layar 1).
- **`/orders` + `GET /api/orders` + `GET /api/orders/export`:** di-scope. Kolom/field Cabang muncul
  untuk MASTER mode semua cabang. CSV export selalu menyertakan kolom Cabang.
- **`/reports` + `GET /api/reports/export`** (MASTER saja): di-scope ke cabang terpilih. Mode semua
  cabang → tambahan satu card "Per cabang" (jumlah invoice + revenue per cabang). CSV menyertakan
  kolom Cabang. Card per cabang adalah pilihan Claude.
- `/api/backup` tidak berubah (MASTER, seluruh DB).

### 4.6 Navigasi dan switcher

- **Sidebar MASTER:** select "Cabang", berisi Semua cabang / Ruko Golden 8 / Hampton. Saat dipilih →
  `POST /api/branch-selection { branchId | "all" }` (MASTER saja, divalidasi) set cookie `wy_branch`
  (httpOnly, 1 tahun), lalu `router.refresh()`. Judul halaman menampilkan "· {cabang}".
- **Sidebar STAFF:** chip "Hampton 🔒" yang tidak bisa diklik (mockup layar 2). Footer user menampilkan
  "Staff · Hampton".
- **Mobile:** top bar menampilkan chip cabang aktif, dan drawer berisi switcher yang sama untuk
  master.
- Data cabang dikirim dari `layout.tsx` (server) ke `Sidebar` sebagai props.

### 4.7 Kelola staff (`/users`)

- Kartu user menampilkan badge cabang (mockup layar 3).
- `CreateUserForm` + `POST /api/users`: field **Cabang**, wajib bila role STAFF dan disembunyikan
  bila MASTER. API memaksa `branchId = null` untuk MASTER dan menolak STAFF tanpa cabang yang valid.
- `ChangeRoleDialog` menjadi "Ubah role / cabang". `PATCH /api/users/[id]` menerima `branchId` dengan
  aturan yang sama. Mengubah STAFF menjadi MASTER → `branchId` dikosongkan.
- `POST /api/auth/login`: STAFF tanpa cabang ditolak dengan pesan "Akun staff belum diberi cabang.
  Hubungi master."

### 4.8 SQL

**(a) Migrasi Prisma**: `prisma/migrations/20261125100000_add_branches/migration.sql`. File ini
**dijalankan otomatis** oleh build Hostinger (`prisma migrate deploy`). Isinya ditulis manual
mengikuti pola Round 12 (`migrate diff --script` lalu disisipi langkah data):

1. `CREATE TABLE Branch`.
2. `INSERT` 2 cabang: `('golden8','Ruko Golden 8','WY','INV')`, `('hampton','Hampton','WYH','INVH')`.
3. `ADD COLUMN branchId` (nullable dulu) ke `RepairOrder`, `Customer`, `Invoice`, `User`.
4. Backfill: `RepairOrder`/`Customer`/`Invoice` → `golden8`. `User` dengan role STAFF → `golden8`,
   lalu `UPDATE User SET branchId='hampton' WHERE email='hampton@watchyoung.local' AND role='STAFF'`.
   Penempatan akun Hampton dilakukan langsung di migrasi supaya tidak ada jeda antara deploy dan SQL
   manual, karena intake di jeda itu akan mendapat nomor Golden 8 permanen.
5. `MODIFY branchId NOT NULL` (tanpa default) untuk `RepairOrder`, `Customer`, `Invoice`.
6. Index + foreign key.
7. Counter **tidak diubah** (lihat 4.1).

Tidak ada `DROP`, jadi aman untuk `migrate deploy` ke produksi.

**Prasyarat deploy:** migrasi `20261125090000_add_user_role` sebelumnya gagal di produksi (`P3018
Duplicate column 'role'`). Selama baris gagal itu masih ada di `_prisma_migrations`,
`migrate deploy` menolak semua migrasi baru. Pastikan migrasi itu sudah dipulihkan (lihat catatan
deploy) dan role akun di produksi sudah benar **sebelum** deploy fitur ini. Kalau `UPDATE role`
dari migrasi itu tidak pernah jalan, perbaiki role-nya lebih dulu, karena penempatan cabang
bergantung pada `role = 'STAFF'`.

**(b) SQL data untuk phpMyAdmin**: `sql/setup-cabang.sql`. Dijalankan **manual, sekali, setelah
deploy berhasil**:

```sql
UPDATE `Branch` SET `address` = '...', `phone` = '...' WHERE `id` = 'golden8';
UPDATE `Branch` SET `address` = '...', `phone` = '...' WHERE `id` = 'hampton';
UPDATE `User` SET `branchId` = 'hampton' WHERE `email` = 'hampton@watchyoung.local';
-- watchyongs@watchyoung.local sudah otomatis golden8 lewat migrasi.
```

Di bagian atas file dan di `DEPLOY-HOSTINGER.md` dicantumkan peringatan: **jangan menjalankan
isi file migrasi secara manual di phpMyAdmin.** Kolomnya akan sudah ada, lalu `migrate deploy`
berikutnya gagal dan build Hostinger berhenti. Penempatan cabang akun staff juga bisa dilakukan
lewat halaman Staff, tanpa SQL.

**(c)** `reset-data-watchyongs.sql` (milik pemilik, belum di-commit): tetap valid karena tidak
menyentuh `Branch` dan `User`. Tidak diubah.

### 4.9 Seed / dev lokal

- `prisma/seed.ts` (demo, hanya lokal): customer dan order demo mendapat `branchId`, sebagian di
  Hampton supaya isolasi bisa dicoba. Counter memakai id baru. Ditambah 1 akun STAFF Hampton demo
  untuk uji lokal.
- `prisma/seed-admin.ts`: tidak berubah (admin = MASTER, `branchId` null).

## 5. Verifikasi (tidak ada test suite; pola proyek = uji nyata lewat browser + skrip fetch)

Saat pengujian lokal, set `UPLOAD_DIR` ke folder **di luar** `public/`. Tanpa itu Next melayani
`public/uploads` secara statis tanpa melewati route `/uploads`, sehingga pengecekan cabang pada
file tidak teruji.

1. Migrasi di DB lokal (Laragon) yang berisi data → semua baris lama ber-`branchId = golden8`, dan
   counter berlanjut (order berikutnya di Golden 8 = nomor lama + 1).
2. Login sebagai STAFF Hampton → intake menghasilkan `WYH-0001`. Dashboard, order, dan laporan tidak
   menampilkan apa pun dari Golden 8.
3. Sebagai STAFF Hampton, panggil langsung `GET/PATCH /api/orders/<id Golden 8>`, `/status`,
   `/complete`, `/tanda-terima`, `/uploads/<id Golden 8>/...`, dan
   `/uploads/invoices/invoice-INV-0001.pdf` → semua 404.
4. STAFF Hampton mencari customer Golden 8 → ketemu, bisa dipilih di intake. Detailnya tidak
   menampilkan order Golden 8.
5. Invoice gabungan: sibling dari cabang lain tidak ditawarkan dan ditolak API. Invoice Hampton =
   `INVH-0001` dengan header Cabang Hampton.
6. MASTER: switcher mengganti isi dashboard, order, customer, dan laporan. Mode semua cabang
   menampilkan rincian per cabang. CSV punya kolom Cabang.
7. `npm run build` lulus (typecheck + lint).

## 6. Pilihan Claude (silakan dikoreksi)

- Nomor per cabang dengan prefix `WYH`/`INVH` untuk Hampton.
- Order/invoice cabang lain → 404, bukan 403.
- Switcher master hanya memfilter daftar dan angka. Master tetap bisa membuka item cabang mana pun.
- Golden 8 tetap memakai counter lama, dan akun `hampton@` ditempatkan langsung oleh migrasi.
- Pilihan cabang master disimpan di cookie per browser, bukan di database.
- Card "Per cabang" di Laporan, dan nama cabang di template WhatsApp.
- Label "Terdaftar di {cabang}" di detail customer.
- Belum ada halaman kelola cabang. Alamat/HP diisi lewat SQL.

## 7. Diserahkan ke builder

- Bentuk komponen switcher (Base UI `Select`, ingat pola `SelectValue` function child).
- Detail styling chip cabang (dua warna berbeda untuk dua cabang, mengikuti token yang ada).
- Urutan pengerjaan file, selama setiap API operasional memakai `requireScopeApi` /
  `findOrderForUser`.
