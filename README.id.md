<div align="center">

# 🏪 Warungpedia

### Marketplace Multi-Penjual Production-Ready untuk Indonesia

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/Tests_327-22C55E?style=flat-square)

[English](./README.md) · [Bahasa Indonesia](./README.id.md)

</div>

---

## 📖 Tentang Warungpedia

**Warungpedia** adalah aplikasi **marketplace multi-penjual (multi-vendor)** full-stack yang siap produksi, terinspirasi oleh pola e-commerce Indonesia (seperti Tokopedia), namun dibangun dengan **desain orisinal**, basis kode sendiri, dan identitas brand yang unik.

> **Ini bukan sekadar mockup UI.** Setiap fitur terhubung secara menyeluruh ke seluruh lapisan stack — dari antarmuka pengguna (UI), validasi input, logika bisnis di server, otorisasi peran, operasi basis data, penanganan error, pencatatan audit, hingga pengujian otomatis. Semua perhitungan uang berjalan di server dalam **bilangan bulat Rupiah (integer IDR)**. Klien tidak pernah dipercaya secara langsung.

Nama **Warungpedia** menggabungkan kata *"Warung"* (toko kecil khas Indonesia) dengan akhiran *"-pedia"* (ensiklopedia) — melambangkan pasar digital terpadu untuk memberdayakan UMKM di seluruh Indonesia.

---

## 🎯 Latar Belakang & Tujuan

Proyek ini dibangun sebagai **proyek portofolio tingkat produksi** untuk mendemonstrasikan keahlian rekayasa perangkat lunak full-stack secara komprehensif:

| Bidang | Keahlian yang Ditampilkan |
|---|---|
| **Arsitektur** | Desain modular berorientasi fitur (*feature-oriented*), pemisahan tugas yang jelas (*separation of concerns*), 14 modul service server-side |
| **Keamanan** | Pertahanan berlapis (*defense-in-depth*): RBAC, RLS Supabase, validasi Zod server-side, integritas keuangan, audit logging |
| **Logika Bisnis** | Keranjang multi-vendor, pesanan bertingkat (*parent/child orders*), buku besar keuangan (*ledger-based*), kalkulasi komisi otomatis, promosi voucher & flash sale |
| **Pengujian** | 327 pengujian otomatis: unit test, integration test, security test, dan simulasi alur perjalanan pengguna E2E |
| **Kesiapan Produksi** | SEO lengkap (JSON-LD, Sitemap, OpenGraph), PWA (offline cache via Service Worker), i18n (ID/EN), dark mode, responsive design |

---

## 🌐 Akses Demo Live

> 🚀 **Segera hadir setelah deployment di Vercel!**
>
> Aplikasi akan dapat diakses secara langsung di: **`https://warungpedia.vercel.app`**
>
> **Akun Demo untuk Percobaan:**
> | Peran (Role) | Email Demo | Akses Halaman |
> |---|---|---|
> | **Super Admin** | `admin@warungpedia.id` | Dashboard Admin (`/admin`), moderasi produk, verifikasi penjual, analytics |
> | **Penjual (Seller)** | `seller@warungpedia.id` | Dashboard Penjual (`/seller`), kelola produk, stok, keuangan, penarikan dana |
> | **Pembeli (Buyer)** | `buyer@warungpedia.id` | Belanja, keranjang, checkout, riwayat pesanan, chat, wishlist, review |

---

## ✨ Fitur-Fitur Utama

### 🛒 Inti Marketplace
- **Keranjang Belanja Multi-Vendor** — Produk dari berbagai toko dikelompokkan per-penjual dengan subtotal terpisah
- **Arsitektur Pesanan Parent/Child** — Satu pesanan pembeli dipecah menjadi pesanan anak per-toko untuk pelacakan pengiriman independen
- **Checkout Sisi Server** — Seluruh perhitungan harga, stok, diskon voucher, dan pembayaran dilakukan secara otoritatif di server
- **Keuangan Integer IDR** — Semua nilai rupiah disimpan sebagai bilangan bulat (bukan float) untuk mencegah kesalahan pembulatan

### 🏬 Sistem Penjual (Seller)
- **Pendaftaran Toko** — Pengguna pembeli dapat mendaftar menjadi penjual dengan unggah dokumen verifikasi (KTP, NPWP, selfie KTP)
- **Dashboard Penjual** — Manajemen produk, pesanan masuk, saldo dompet, riwayat transaksi, penarikan dana, pengaturan toko
- **Katalog & Stok Produk** — CRUD produk dengan varian, SKU, batas stok rendah (*low stock alert*), multi-gambar (hingga 10 foto), dan video produk
- **Buku Besar Inventori** — Riwayat perubahan stok tercatat rapi; mencegah *overselling* dan *race condition*

### 💰 Sistem Keuangan & Dompet
- **Abstraksi Pembayaran** — Lapisan pembayaran agnostik (mock untuk dev, siap integrasi payment gateway nyata seperti Midtrans/Xendit)
- **Perhitungan Komisi** — Persentase komisi marketplace yang dapat dikonfigurasi secara global oleh Admin
- **Dompet Penjual** — Alur saldo: Saldo Tertunda (*Pending*) → Saldo Tersedia (*Available*) → Pencairan (*Settlement*) → Penarikan (*Withdrawal*)
- **Dompet Pembeli** — Menerima saldo pengembalian dana (*refund*) yang bisa digunakan untuk transaksi berikutnya
- **Buku Besar Append-Only** — Setiap pergerakan uang dicatat secara permanen dengan saldo akhir (*balance after*) untuk rekonsiliasi audit

### 🎟️ Promosi & Diskon
- **Voucher Diskon** — Kode promo (persen atau nominal tetap) dengan batas minimum belanja, kuota per pengguna, dan masa berlaku
- **Flash Sale** — Diskon produk berbatas waktu yang dijadwalkan oleh Admin atau Penjual
- **Aturan Kombinasi Multi-Voucher** — Validasi penumpukan voucher yang ketat di sisi server

### 📦 Pengiriman & Retur
- **Manajemen Pengiriman** — Input kurir ekspedisi, nomor resi, dan pembaruan status pengiriman per pesanan
- **Pengajuan Retur** — Pembeli dapat mengajukan retur dalam batas waktu garansi (default: 30 hari setelah pesanan selesai)
- **Penyelesaian Sengketa (Dispute)** — Alur: Pembeli komplain → Penjual merespons → Eskalasi ke Admin → Keputusan Admin
- **Unggah Bukti Video** — Video *unboxing* dan bukti sengketa disimpan secara aman dan privat di Supabase Storage

### 💬 Komunikasi & Notifikasi
- **Chat Real-Time** — Pesan langsung antara pembeli dan penjual berbasis Supabase Realtime dengan indikator mengetik (*typing indicator*)
- **Notifikasi Dalam Aplikasi** — Pembaruan status pesanan, retur, sengketa, dan promo
- **Notifikasi Email** — Email transaksional terintegrasi via Edge Functions (Resend)

### ⭐ Fitur Sosial & Interaksi
- **Ulasan & Rating Produk** — Hanya pembeli terverifikasi yang dapat memberikan ulasan (skala bintang 1–5)
- **Ikuti Toko (Follow)** — Pembeli dapat mengikuti toko favorit untuk mendapatkan notifikasi produk baru
- **Wishlist Koleksi** — Pengguna dapat membuat banyak folder wishlist dengan catatan produk
- **Terakhir Dilihat (Recently Viewed)** — Riwayat penjelajahan untuk rekomendasi produk yang dipersonalisasi

### 🔍 Pencarian & Navigasi
- **Pencarian Cepat PostgreSQL** — Menggunakan full-text search dan trigram similarity untuk toleransi kesalahan ketik (*typo tolerance*)
- **Hierarki Kategori** — Struktur kategori bertingkat (induk dan sub-kategori) yang dinamis dari database
- **Filter Komprehensif** — Berdasarkan harga, kategori, rating, lokasi toko, kondisi barang (baru/bekas), dan diskon

### 🛡️ Dashboard Admin & CMS
- **Panel Admin Lengkap** — Ringkasan metrik GMV, total pesanan, jumlah pengguna, persetujuan toko, dan moderasi produk
- **Moderasi Berbasis AI** — Penyaringan produk otomatis dengan kemampuan peninjauan manual oleh Admin
- **Manajemen Konten (CMS)** — Banner beranda, artikel bantuan, FAQ, dan syarat ketentuan yang dapat diedit tanpa ubah kode
- **Analytics & Laporan** — Grafik tren penjualan, performa produk terlaris, dan analitik pendapatan platform

### 🎨 Desain & Aksesibilitas
- **Sistem Desain Khusus** — Palet warna brand orisinal (`crisp`, `blossom`, `lilac`, `royal`) dan komponen UI modular
- **Mode Gelap (Dark Mode)** — Mendukung tema terang, gelap, dan otomatis mengikuti sistem operasi
- **Responsif Sepenuhnya** — Tampilan optimal di smartphone, tablet, laptop, hingga monitor desktop besar
- **Dukungan Multi-Bahasa** — Tersedia dalam Bahasa Indonesia (default) dan Bahasa Inggris
- **PWA Ready** — Dapat diinstal seperti aplikasi native di Android/iOS/Desktop dengan kemampuan akses offline
- **Optimasi SEO** — Meta tag dinamis, JSON-LD Schema.org, OpenGraph, sitemap.xml otomatis, dan robots.txt

---

## 🛠️ Tech Stack & Spesifikasi

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Framework Utama** | Next.js 16 (App Router) | Menggunakan arsitektur Server Components, Server Actions, dan Turbopack |
| **Library UI** | React 19 + TypeScript | Komponen antarmuka modern dengan keamanan tipe data yang ketat |
| **Styling** | Tailwind CSS 4 | Utility-first CSS dengan custom design tokens `@theme` |
| **Database & Auth** | Supabase (PostgreSQL) | Basis data relasional dengan RLS, otentikasi JWT, dan penyimpanan file |
| **Realtime Engine** | Supabase Realtime | Komunikasi instan untuk fitur chat dan status kehadiran pengguna |
| **Validasi Skema** | Zod | Validasi data input di sisi klien dan server secara konsisten |
| **Visualisasi Data** | Recharts | Grafik interaktif untuk dashboard analitik penjual dan admin |
| **Testing Framework** | Vitest + Testing Library | 327 pengujian otomatis (unit, integrasi, dan keamanan) |

---

## ⚙️ Kebutuhan Sistem (System Requirements)

### Untuk Menjalankan Secara Lokal (Development):

- **Node.js**: Versi 18.18.0 atau lebih baru (Disarankan: Node.js 20 LTS)
- **Package Manager**: npm versi 9+ (atau pnpm / yarn)
- **Sistem Operasi**: Windows 10/11, macOS, atau Linux (Ubuntu/Debian)
- **Akun Supabase**: Proyek Supabase aktif (gratis di [supabase.com](https://supabase.com))
- **Browser Modern**: Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari versi terbaru

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Clone Repository

```bash
git clone https://github.com/username-anda/warungpedia.git
cd warungpedia
```

### 2. Install Dependensi

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Salin file `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Buka file `.env.local` dan isi dengan konfigurasi Supabase Anda:

```env
# URL Aplikasi
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Kunci Publik Supabase (Aman untuk Browser)
NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=kunci-anon-anda

# Kunci Rahasia Supabase (Hanya untuk Server — JANGAN sebarkan)
SUPABASE_SERVICE_ROLE_KEY=kunci-service-role-anda
SUPABASE_JWT_SECRET=jwt-secret-anda
```

### 4. Setup Basis Data di Supabase

1. Buka dashboard proyek Supabase Anda → pilih menu **SQL Editor**
2. Salin dan jalankan seluruh isi file `supabase/complete_migration.sql` (membuat seluruh 13 tabel, fungsi trigger, dan aturan RLS)
3. *(Opsional)* Salin dan jalankan file `supabase/complete_seed.sql` untuk mengisi data awal kategori dan pengaturan toko

### 5. Jalankan Server Development

```bash
npm run dev
```

Buka browser Anda dan akses: **`http://localhost:3000`** 🎉

---

## 🧪 Skrip Perintah yang Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server lokal pengembangan (Turbopack) |
| `npm run build` | Melakukan kompilasi build produksi |
| `npm run start` | Menjalankan server aplikasi hasil build produksi |
| `npm run test` | Menjalankan seluruh pengujian otomatis (327 tests) |
| `npm run test:watch` | Menjalankan pengujian dalam mode pantau perubahan kode |
| `npm run test:coverage`| Menghasilkan laporan cakupan kode pengujian (*code coverage*) |
| `npm run lint` | Menjalankan ESLint untuk mengecek kualitas dan gaya penulisan kode |
| `npm run typecheck` | Menjalankan kompilator TypeScript untuk mengecek tipe data tanpa output |

---

## 📁 Struktur Direktori Proyek

```text
src/
├── app/               # Rute halaman Next.js App Router (halaman, layout, actions)
│   ├── actions/       # Server Actions untuk mutasi data (auth, toko, produk, cart)
│   ├── account/       # Halaman profil dan daftar alamat pembeli
│   ├── admin/         # Dashboard super admin, moderasi, sengketa, dan CMS
│   ├── auth/          # Alur masuk, daftar, verifikasi email, lupa password
│   ├── cart/          # Halaman keranjang belanja multi-penjual
│   ├── checkout/      # Halaman konfirmasi dan pembuatan pesanan
│   ├── orders/        # Halaman riwayat dan detail pesanan
│   ├── search/        # Halaman pencarian dan filter produk
│   ├── seller/        # Dashboard penjual, kelola barang, keuangan, dan toko
│   └── store/         # Halaman etalase publik toko dan detail produk
├── components/
│   ├── features/      # Komponen spesifik fitur (admin, seller, shop, chat, dll.)
│   ├── layout/        # Komponen layout global (Header, Footer, Navigasi)
│   └── ui/            # Komponen design system reusable (Button, Input, Card, Modal, dll.)
├── config/            # Konfigurasi role RBAC, izin akses, bahasa (i18n), dan situs
├── lib/
│   ├── auth/          # Data Access Layer (DAL) dan pelindung hak akses pengguna
│   ├── i18n/          # Kamus terjemahan Bahasa Indonesia & Bahasa Inggris
│   ├── supabase/      # Factory klien Supabase (Browser, Server, Service-Role)
│   └── validation/    # Skema validasi data menggunakan Zod
├── services/          # Logika bisnis sisi server (14 modul service)
├── styles/            # Desain token Tailwind CSS dan styling global
├── types/             # Deklarasi tipe TypeScript untuk seluruh entitas
└── utils/             # Fungsi pembantu (format mata uang IDR, kalkulasi komisi, dll.)

supabase/
├── migrations/        # 13 berkas migrasi SQL berurutan
├── seed/              # Berkas data awal (*seed data*) pengembangan
└── complete_migration.sql # Berkas SQL gabungan untuk instalasi cepat
```

---

## 🔒 Keamanan & Perlindungan Data

- **Dual-Layer Authorization**: Hak akses dijaga di level aplikasi (RBAC) dan di level database (PostgreSQL Row-Level Security).
- **Integritas Moneter**: Seluruh angka keuangan menggunakan integer Rupiah murni untuk menjamin konsistensi matematis dalam pembagian komisi dan pencairan saldo.
- **Isolasi Kredensial**: `SUPABASE_SERVICE_ROLE_KEY` hanya tersimpan di server dan tidak pernah terkirim ke browser.
- **Pencegahan Serangan**: Dilindungi dari injeksi SQL/UUID, serangan XSS, manipulasi harga sisi klien (*price tampering*), dan eksploitasi parameter keranjang (*IDOR*).

---

## 📄 Dokumentasi Teknis Tambahan

Dokumentasi arsitektur lebih mendalam dapat dibaca pada berkas berikut:

- [Arsitektur Sistem (ARCHITECTURE.md)](./docs/ARCHITECTURE.md)
- [Desain Basis Data & Migrasi (DATABASE.md)](./docs/DATABASE.md)
- [Postur Keamanan (SECURITY.md)](./docs/SECURITY.md)
- [Panduan Deployment (DEPLOYMENT.md)](./docs/DEPLOYMENT.md)
- [Variabel Lingkungan (ENVIRONMENT.md)](./docs/ENVIRONMENT.md)
- [Strategi Pengujian (TESTING.md)](./docs/TESTING.md)

---

## 👨‍💻 Pengembang

Dibuat dengan ❤️ sebagai proyek portofolio full-stack engineering tingkat lanjut yang siap digunakan di dunia nyata.

---

## 📝 Lisensi

Proyek ini bersifat open-source dan berada di bawah naungan lisensi [MIT License](./LICENSE).

---

<div align="center">

**⭐ Berikan Star pada repository ini jika Anda menyukai proyek ini!**

*Warungpedia — Digitalisasi Warung Indonesia* 🏪

</div>
