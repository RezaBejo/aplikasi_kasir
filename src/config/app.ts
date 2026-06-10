/**
 * Konfigurasi per-klien — ganti nilai di sini untuk setup klien baru.
 * File ini adalah satu-satunya tempat yang perlu diubah untuk branding dasar.
 */
export const appConfig = {
  /** Nama lengkap aplikasi — muncul di judul halaman, login, dan nav admin */
  name: "POS Gerobak",

  /** Nama pendek untuk PWA home screen (maks ±12 karakter) */
  shortName: "POS Gerobak",

  /** Singkatan untuk ikon aplikasi — maks 3–4 karakter */
  abbr: "POS",

  /** Baris kedua di ikon — biasanya jenis usaha atau nama bisnis */
  tagline: "GEROBAK",

  /** Deskripsi untuk metadata SEO dan PWA manifest */
  description: "Aplikasi kasir gerobak multi-cabang",

  /**
   * Warna tema utama (hex).
   * Dipakai di: ikon, manifest, navbar, tombol utama, dan progress bar.
   * Ubah nilai ini + themeColorLight untuk ganti palet warna seluruh aplikasi.
   */
  themeColor: "#111827",

  /**
   * Varian lebih terang dari themeColor — dipakai untuk gradien ikon dan
   * hover state tombol. Idealnya 1 shade lebih terang dari themeColor.
   */
  themeColorLight: "#1f2937",

  /** Informasi kontak klien — opsional, untuk kebutuhan cetak/struk */
  contact: {
    business: "POS Gerobak",
    phone: "",
    email: "",
    address: "",
  },
} as const;
