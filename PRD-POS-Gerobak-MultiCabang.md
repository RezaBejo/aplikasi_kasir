# PRD — Aplikasi POS Gerobak Makanan (Multi-Cabang)

**Versi:** 2.0
**Tanggal:** Juni 2026
**Konteks:** Usaha makanan kaki lima (dimsum + menu lain) dengan beberapa gerobak/cabang. Owner bekerja sebagai perawat dan memantau usaha dari jarak jauh. Karyawan menjaga gerobak sebagai kasir.

---

## 1. Ringkasan Produk

Aplikasi web POS untuk usaha makanan dengan beberapa cabang (gerobak). Dua peran: **Kasir** (karyawan penjaga gerobak — melayani transaksi) dan **Owner** (memantau seluruh cabang dari jarak jauh, atur menu/harga/stok, lihat performa cabang & karyawan). Berbasis web, dipakai online, optimal untuk HP/tablet.

### Tujuan
- Transaksi penjualan super cepat untuk karyawan di gerobak (bayar langsung/tunai).
- Owner bisa memantau semua cabang dari jauh, kapan saja, lewat HP.
- Tahu sisa stok porsi tiap cabang secara real-time.
- Tahu cabang & karyawan mana yang performanya bagus.

### Non-Tujuan (di luar scope v2.0)
- Mode offline penuh (lokasi sudah ada internet stabil; PWA tetap butuh koneksi untuk transaksi).
- Pembayaran online / QRIS otomatis (pencatatan tunai saja dulu).
- Nomor meja, kitchen display, status dapur (tidak relevan untuk gerobak).
- Manajemen bahan baku / resep / HPP (tidak diperlukan).
- Integrasi printer thermal & barcode scanner fisik (bisa fase berikutnya).

---

## 2. Konsep Inti: Cabang (Branch)

Seluruh data terikat ke **cabang**:
- Setiap **transaksi** tercatat di satu cabang.
- Setiap **karyawan/kasir** di-assign ke satu cabang (bisa dipindah owner).
- **Stok porsi harian** diatur per cabang per menu.
- **Laporan** bisa difilter per cabang atau gabungan semua cabang.

---

## 3. Peran & Hak Akses (RBAC)

| Fitur | Kasir (Karyawan) | Owner |
|---|---|---|
| Login | ✅ | ✅ |
| Transaksi penjualan (di cabangnya) | ✅ | ✅ |
| Lihat sisa stok porsi cabangnya | ✅ | ✅ (semua cabang) |
| Lihat riwayat transaksi sendiri/hari ini | ✅ | ✅ (semua) |
| Rekap tutup hari (cabangnya) | ✅ | ✅ |
| Kelola cabang (tambah/edit) | ❌ | ✅ |
| Kelola menu & harga | ❌ | ✅ |
| Atur stok porsi harian | ❌ (lihat saja) | ✅ |
| Kelola akun karyawan & assign cabang | ❌ | ✅ |
| Dashboard pantau semua cabang | ❌ | ✅ |
| Laporan penjualan (per cabang/karyawan) | ❌ | ✅ |

---

## 4. User Stories

### Kasir (Karyawan di gerobak)
- Login, lalu langsung masuk ke layar jualan cabangnya.
- Tap menu untuk masuk keranjang, lihat total otomatis.
- Input uang bayar tunai, lihat kembalian, selesaikan transaksi dengan cepat (3-4 tap).
- Lihat sisa porsi tiap menu hari ini.
- Lihat rekap penjualan hari ini di cabangnya saat tutup.

### Owner (memantau dari jarak jauh)
- Login ke dashboard dari HP di sela kerja.
- Lihat total penjualan hari ini per cabang & gabungan.
- Lihat sisa stok porsi tiap cabang secara real-time.
- Tambah/ubah menu & harga (berlaku ke semua cabang atau per cabang).
- Atur stok porsi harian tiap cabang tiap pagi.
- Buat akun karyawan & tentukan cabangnya; nonaktifkan bila keluar.
- Lihat performa: cabang terlaris, karyawan dengan penjualan tertinggi, menu terlaris.
- Filter laporan berdasarkan tanggal, cabang, dan karyawan.

---

## 5. Spesifikasi Fitur Detail

### 5.1 Autentikasi
- Login username/email + password, role disimpan di token.
- Kasir setelah login langsung diarahkan ke layar POS cabangnya.
- Owner diarahkan ke dashboard.
- Password di-hash; akun nonaktif tidak bisa login.

### 5.2 Modul Kasir (POS Cepat)
- **Grid menu:** tampilan tombol besar berisi menu + harga, mudah di-tap di HP/tablet.
- **Keranjang:** tap menu menambah qty; bisa kurangi/hapus; total otomatis.
- **Diskon manual (opsional):** nominal sederhana per transaksi.
- **Pembayaran tunai:** input jumlah bayar → hitung kembalian.
- **Simpan transaksi:** atomik — kurangi stok porsi cabang & catat (kasir, cabang, waktu).
- **Validasi stok:** menu yang porsinya habis ditandai/disable.
- **Struk ringkas:** opsional, bisa di-print dari browser.
- **Riwayat hari ini:** daftar transaksi kasir di cabangnya.

### 5.3 Modul Owner — Manajemen Cabang
- CRUD cabang: nama, lokasi/keterangan, status aktif.

### 5.4 Modul Owner — Manajemen Menu
- CRUD menu: nama, kategori, harga, gambar (opsional), status aktif.
- Harga berlaku global (semua cabang) di v2.0.

### 5.5 Modul Owner — Stok Porsi Harian
- Set jumlah porsi per menu per cabang (mis. reset tiap pagi).
- Tampilan sisa porsi real-time (terkurang otomatis tiap transaksi).

### 5.6 Modul Owner — Manajemen Karyawan
- CRUD akun karyawan/kasir; assign ke cabang; reset password; aktif/nonaktif.

### 5.7 Modul Owner — Dashboard & Laporan (untuk dipantau dari HP)
- **Kartu ringkasan hari ini:** total penjualan gabungan, per cabang, jumlah transaksi.
- **Sisa stok per cabang:** daftar menu + sisa porsi.
- **Performa cabang:** grafik/tabel penjualan per cabang.
- **Performa karyawan:** total penjualan & jumlah transaksi per karyawan.
- **Menu terlaris:** ranking menu berdasarkan porsi terjual.
- **Laporan:** filter rentang tanggal + cabang + karyawan; grafik tren penjualan.

---

### 5.8 PWA (Installable App di Android/Tablet)
- Aplikasi dapat di-install ke home screen HP/tablet ("Add to Home Screen") sehingga muncul sebagai ikon app.
- Berjalan full-screen (standalone) tanpa address bar browser.
- Manifest berisi nama app, ikon (berbagai ukuran), warna tema, dan orientasi.
- Service worker untuk caching aset (loading lebih cepat); transaksi tetap memerlukan koneksi.
- Splash screen sederhana saat dibuka.

## 6. Model Data (Ringkas)

```
User
  id, name, username, password_hash, role (OWNER|CASHIER),
  branch_id (FK Branch, nullable untuk owner), is_active, created_at

Branch
  id, name, location, is_active, created_at

MenuItem
  id, name, category, price, image_url (nullable),
  is_active, created_at, updated_at

DailyStock
  id, branch_id (FK), menu_item_id (FK), date,
  initial_qty, remaining_qty
  (unik per branch + menu + date)

Transaction
  id, code, branch_id (FK), cashier_id (FK User),
  subtotal, discount, total, paid_amount, change_amount,
  status, created_at

TransactionItem
  id, transaction_id (FK), menu_item_id (FK),
  menu_name (snapshot), price (snapshot), qty, line_total
```

> Catatan: simpan `menu_name` & `price` sebagai snapshot di `TransactionItem` agar riwayat akurat meski menu/harga berubah. Stok dikurangi dari `DailyStock` berdasarkan `branch_id` + tanggal saat transaksi.

---

## 7. Halaman / Routing

| Route | Akses | Keterangan |
|---|---|---|
| `/login` | Publik | Login |
| `/pos` | Kasir, Owner | Layar jualan (otomatis cabang kasir) |
| `/pos/history` | Kasir, Owner | Riwayat transaksi hari ini |
| `/admin` | Owner | Dashboard pantau semua cabang |
| `/admin/branches` | Owner | Manajemen cabang |
| `/admin/menu` | Owner | Manajemen menu & harga |
| `/admin/stock` | Owner | Atur stok porsi harian per cabang |
| `/admin/staff` | Owner | Manajemen karyawan |
| `/admin/reports` | Owner | Laporan penjualan |

---

## 8. Kebutuhan Non-Fungsional
- **Keamanan:** password hashing, proteksi route per role, validasi server-side.
- **Performa:** layar POS responsif; transaksi tersimpan cepat (< 1 dtk).
- **Usability:** layar POS dioptimalkan untuk sentuh (tombol besar, alur 3-4 tap); dashboard owner enak dibuka di HP.
- **Reliabilitas:** transaksi atomik (stok & transaksi tersimpan bersamaan); kasir tidak bisa menjual melebihi sisa porsi.
- **Audit & isolasi data:** kasir hanya melihat data cabangnya; setiap transaksi tercatat cabang + kasir + waktu.

---

## 9. Kriteria Penerimaan (Acceptance Criteria)
- Kasir hanya bisa transaksi & melihat data di cabang yang di-assign; tidak bisa akses `/admin/*`.
- Sisa porsi (`DailyStock.remaining_qty`) berkurang tepat sesuai qty saat transaksi tersimpan.
- Menu dengan sisa porsi 0 tidak bisa dijual.
- Total, diskon, dan kembalian dihitung benar.
- Owner dapat melihat penjualan per cabang & per karyawan dalam rentang tanggal.
- Owner dapat melihat sisa stok semua cabang secara real-time dari dashboard.
- Akun karyawan nonaktif tidak bisa login.
