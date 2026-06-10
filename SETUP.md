# Panduan Setup Klien Baru

Template POS Gerobak Multi-Cabang — Next.js 14, Prisma, PostgreSQL (Neon), NextAuth.

---

## Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Ganti Nama & Branding](#2-ganti-nama--branding)
3. [Ganti Warna Tema](#3-ganti-warna-tema)
4. [Hubungkan ke Database Neon Baru](#4-hubungkan-ke-database-neon-baru)
5. [Isi Data Awal: Akun Owner, Cabang, Menu](#5-isi-data-awal-akun-owner-cabang-menu)
6. [Deploy ke Vercel](#6-deploy-ke-vercel)
7. [Setelah Live: Isi Stok Harian & Akun Kasir](#7-setelah-live-isi-stok-harian--akun-kasir)
8. [Reset Password Owner yang Terlupakan](#8-reset-password-owner-yang-terlupakan)

---

## 1. Prasyarat

| Tool | Versi minimum |
|------|--------------|
| Node.js | 18+ |
| npm | 9+ |
| Akun Vercel | Free tier cukup |
| Akun Neon | Free tier cukup (1 project) |

Clone / copy folder project ini, lalu jalankan:

```bash
npm install
```

---

## 2. Ganti Nama & Branding

Semua identitas aplikasi dikelola di satu file:

**`src/config/app.ts`**

```ts
export const appConfig = {
  name: "POS Bakso Pak Budi",       // ← Nama tampil di login & nav
  shortName: "Bakso Budi",          // ← Nama di home screen PWA
  abbr: "BB",                       // ← Singkatan di ikon (maks 3 karakter)
  tagline: "BAKSO",                 // ← Baris kedua di ikon
  description: "Kasir bakso Pak Budi multi-cabang",
  themeColor: "#7f1d1d",            // ← Lihat bagian 3
  themeColorLight: "#991b1b",
  contact: {
    business: "Bakso Pak Budi",
    phone: "0812-xxxx-xxxx",
    email: "",
    address: "Jl. Merdeka No. 1",
  },
};
```

Setelah menyimpan file ini, seluruh halaman (login, nav admin, ikon, manifest PWA,
judul tab browser) otomatis ikut berubah — tanpa perlu mengubah file lain.

### Logo kustom (opsional)

Ikon default dibuat otomatis dari `abbr` + `tagline`. Untuk mengganti dengan
gambar logo nyata:

1. Siapkan file PNG: `72×72`, `192×192`, `512×512` px.
2. Simpan di `public/icons/` dengan nama `icon-72.png`, `icon-192.png`, `icon-512.png`.
3. Di `src/app/manifest.ts`, ganti entri `src: "/icons/72"` menjadi
   `src: "/icons/icon-72.png"` (hapus bagian `route.tsx` dinamis jika tidak dipakai).
4. Untuk favicon (tab browser), taruh `public/favicon.ico` — Next.js akan
   otomatis memprioritaskan file statis di atas `icon.tsx` dinamis.

---

## 3. Ganti Warna Tema

Cukup ubah dua nilai di `src/config/app.ts`:

```ts
themeColor: "#7f1d1d",       // Warna utama (gelap)
themeColorLight: "#991b1b",  // Satu shade lebih terang — untuk hover & gradien ikon
```

Nilai ini otomatis dipakai di:

- Tombol login, tombol "Bayar", tombol submit di kasir
- Tab aktif di navigasi admin
- Tombol simpan password
- Kartu ringkasan penjualan di dashboard
- Progress bar per-cabang di dashboard
- Ikon aplikasi (PWA icon, apple-icon, favicon)
- `theme_color` di manifest (warna status bar Android)
- Viewport `themeColor` di browser

**Format warna**: gunakan hex 6-digit (`#rrggbb`). Contoh palet populer:

| Warna | themeColor | themeColorLight |
|-------|-----------|-----------------|
| Hitam (default) | `#111827` | `#1f2937` |
| Merah tua | `#7f1d1d` | `#991b1b` |
| Biru navy | `#1e3a5f` | `#1e4d7b` |
| Hijau tua | `#14532d` | `#166534` |
| Ungu | `#4c1d95` | `#5b21b6` |
| Coklat | `#451a03` | `#78350f` |

> **Catatan shadcn/ui**: Komponen shadcn (badge, dialog, dll.) memakai CSS variable
> `--primary` di `src/app/globals.css`. Jika Anda menggunakan komponen shadcn
> selain yang sudah ada, update juga nilai `--primary` di sana agar sesuai.

---

## 4. Hubungkan ke Database Neon Baru

### Buat project Neon

1. Login ke [neon.tech](https://neon.tech) → **New Project**.
2. Pilih region terdekat (Singapore untuk Indonesia).
3. Setelah project dibuat, buka **Dashboard → Connection Details**.
4. Pilih tab **Pooled connection** → salin connection string.

### Buat file `.env`

Buat file `.env` di root project (jangan di-commit ke Git):

```env
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="isi-dengan-string-acak-minimal-32-karakter"
NEXTAUTH_URL="http://localhost:3000"
```

- `DATABASE_URL` → gunakan **pooled** connection string (ada `-pooler` di hostname).
- `DIRECT_URL` → gunakan connection string **tanpa** `-pooler` (untuk migrasi Prisma).
- `NEXTAUTH_SECRET` → buat dengan: `openssl rand -base64 32`

### Jalankan migrasi

```bash
npx prisma migrate deploy
```

Jika ingin reset database dari nol (hati-hati, data hilang):

```bash
npx prisma migrate reset
```

---

## 5. Isi Data Awal: Akun Owner, Cabang, Menu

### Seed otomatis

Jalankan seed untuk membuat akun owner + data contoh:

```bash
npx tsx prisma/seed.ts
```

> Pastikan file `prisma/seed.ts` sudah disesuaikan dengan nama bisnis klien
> sebelum dijalankan.

### Atau manual via aplikasi

1. Jalankan dev server: `npm run dev`
2. Buka `http://localhost:3000/login`
3. Login dengan akun owner yang dibuat seed.
4. Masuk ke **Admin → Cabang** → tambah semua cabang klien.
5. Masuk ke **Admin → Menu** → tambah semua menu beserta harga dan kategori.
6. Masuk ke **Admin → Karyawan** → tambah akun kasir per cabang.

---

## 6. Deploy ke Vercel

### Pertama kali

1. Push kode ke GitHub (repository baru untuk klien ini).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repository.
3. Di halaman konfigurasi, buka **Environment Variables** dan isi:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Pooled connection string Neon |
   | `DIRECT_URL` | Direct connection string Neon |
   | `NEXTAUTH_SECRET` | String acak 32+ karakter |
   | `NEXTAUTH_URL` | `https://nama-domain-klien.vercel.app` |

4. Klik **Deploy**. Vercel otomatis build dan deploy.

### Update setelah perubahan

```bash
git add .
git commit -m "update config klien"
git push
```

Vercel otomatis redeploy setiap kali ada push ke branch `main`.

### Custom domain (opsional)

Di Vercel → **Settings → Domains** → tambah domain klien → ikuti instruksi DNS.

---

## 7. Setelah Live: Isi Stok Harian & Akun Kasir

- Kasir login setiap pagi di halaman `/login`.
- Owner mengisi stok harian di **Admin → Stok → Atur Stok** sebelum kasir mulai berjualan.
- Stok otomatis berkurang saat transaksi disimpan.
- Dashboard owner menampilkan sisa stok real-time (auto-refresh 60 detik).

---

## 8. Reset Password Owner yang Terlupakan

Jika owner lupa password dan tidak bisa login:

```bash
npm run reset-owner-password <password-baru>
# Contoh:
npm run reset-owner-password rahasia123
```

Script ini berjalan langsung ke database — tidak perlu login ke aplikasi.
Pastikan file `.env` sudah terisi sebelum menjalankan perintah ini.

---

## Referensi Cepat

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan dev server |
| `npm run build` | Build production |
| `npx prisma studio` | GUI database browser |
| `npx prisma migrate deploy` | Terapkan migrasi ke database |
| `npx prisma migrate reset` | Reset database (hapus semua data) |
| `npm run reset-owner-password <pwd>` | Reset password owner |

---

## File yang TIDAK boleh diubah sembarangan

| File | Alasan |
|------|--------|
| `.env` | Berisi credential database — jangan commit ke Git |
| `prisma/schema.prisma` | Mengubah skema perlu migrasi baru |
| `src/lib/auth.ts` | Logika autentikasi — perubahan bisa break login |
| `middleware.ts` | Proteksi route — perubahan bisa buka celah keamanan |
