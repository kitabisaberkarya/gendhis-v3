# Panduan Konfigurasi Ulang & Troubleshooting Cloudflare Pages untuk Gendhis

Dokumen ini menjelaskan mengapa perubahan yang Anda buat di AI Studio dan simpan ke GitHub tidak muncul di situs Gendhis Anda yang telah di-deploy di Cloudflare, beserta solusi lengkap untuk memperbaikinya.

---

## Bagian 1: Masalah Umum - Ketidakcocokan Branch

Ini adalah masalah awal yang mungkin Anda hadapi.

### Permasalahan: Mengapa Situs Saya Tidak Ter-update?

Masalah ini sangat umum terjadi dan biasanya disebabkan oleh satu hal sederhana: **Ketidakcocokan antara *branch* (cabang) di GitHub yang diperbarui oleh AI Studio dan *branch* yang dipantau oleh Cloudflare Pages untuk deployment.**

Secara sederhana:
1.  **AI Studio** menyimpan (melakukan *push*) kode terbaru Anda ke sebuah *branch* di GitHub, kemungkinan besar bernama `main`.
2.  **Cloudflare Pages** dikonfigurasi untuk secara otomatis membuat (melakukan *build*) dan men-deploy situs Anda HANYA JIKA ada perubahan pada *branch* tertentu, yang disebut "Production Branch".
3.  Jika "Production Branch" di Cloudflare diatur ke `master` (nama default lama) sementara AI Studio mengirim pembaruan ke `main`, maka Cloudflare akan **mengabaikan** semua pembaruan tersebut.

### Solusi: Menyelaraskan Branch GitHub dengan Cloudflare

Pastikan "Production branch" di Cloudflare Pages (di bawah **Settings > Builds & deployments**) diatur ke `main`, sesuai dengan branch utama di repositori GitHub Anda.

---

## Bagian 2: Masalah Lanjutan - Caching Browser & CDN

Jika branch Anda sudah benar, tetapi situs masih menampilkan versi lama, masalahnya hampir pasti adalah **Caching (Penyimpanan Sementara)**.

### Permasalahan: Apa itu Caching?

1.  **Cache Browser:** Browser Anda menyimpan file lama untuk mempercepat pemuatan.
2.  **Cache Edge Cloudflare:** Jaringan global Cloudflare juga menyimpan salinan situs Anda.

### Solusi Caching

1.  **Paksa Refresh Browser (Paling Umum):**
    *   **Windows/Linux:** Tekan `Ctrl + Shift + R`.
    *   **Mac:** Tekan `Cmd + Shift + R`.

2.  **Hapus Cache di Dasbor Cloudflare (Jika Langkah 1 Tidak Cukup):**
    *   Di dasbor Cloudflare, buka **Workers & Pages > Gendhis**.
    *   Klik tab **Deployments**.
    *   Di sebelah deployment aktif teratas, klik **View details**.
    *   Di halaman detail, cari tombol **"Clear cache"** atau **"Purge cache"** dan klik. Ini akan membersihkan cache khusus untuk deployment ini.

---

## Bagian 3: Solusi Pasti - Memicu Deployment dengan Commit "Kosong"

Ini adalah solusi untuk masalah yang paling umum, yaitu ketika Cloudflare tampaknya tidak "melihat" pembaruan terbaru dari GitHub dan terus membangun ulang versi kode yang lama.

### Permasalahan: Cloudflare Tidak Melihat Kode Baru Saya

Perhatikan tab **Deployments** di Cloudflare. Di kolom "Source", ada ID unik seperti `3e9f005`. Ini adalah **commit hash**, yaitu sidik jari unik untuk setiap versi kode. Jika Anda melihat **commit hash yang sama** pada beberapa deployment terakhir meskipun Anda sudah menyimpan perubahan baru ke GitHub, itu artinya **Cloudflare tidak menerima notifikasi pembaruan dari GitHub**.

### Solusi: Paksa Cloudflare untuk Mengambil Kode Terbaru dengan Commit "Kosong"

Cara paling andal untuk memperbaiki ini adalah dengan membuat perubahan yang sangat kecil dan tidak berarti pada kode Anda, lalu menyimpannya kembali ke GitHub. Ini akan menghasilkan **commit hash baru** yang akan memaksa Cloudflare untuk memulai deployment baru.

1.  **Buka AI Studio:** Buka proyek Gendhis Anda.
2.  **Edit File Apapun:** Buka salah satu file, misalnya `App.tsx`.
3.  **Tambahkan Komentar:** Tambahkan satu baris komentar di mana saja di dalam file. Komentar tidak akan mengubah fungsionalitas aplikasi Anda sama sekali.
    ```javascript
    // Memicu ulang deploy untuk mendapatkan commit hash baru.
    ```
4.  **Simpan ke GitHub:** Gunakan fitur "Save to GitHub" di AI Studio seperti biasa. Beri pesan commit yang jelas, contohnya: "Memicu deploy ulang".
5.  **Periksa Cloudflare:** Kembali ke dasbor Cloudflare di tab **Deployments**. Dalam satu atau dua menit, Anda akan melihat deployment baru muncul di bagian atas dengan status "Building...".
6.  **Verifikasi Commit Hash:** Yang paling penting, pastikan **commit hash** untuk deployment baru ini **BERBEDA** dari yang sebelumnya. Ini adalah bukti bahwa Cloudflare telah berhasil mengambil kode terbaru Anda.
7.  **Selesaikan Deployment & Refresh:** Setelah deployment berhasil, buka situs Anda dan lakukan **Paksa Refresh Browser** (Langkah 1 dari Bagian 2) untuk melihat perubahan terbaru.

Metode ini hampir selalu berhasil karena secara langsung mengatasi masalah inti, yaitu kurangnya commit baru untuk dideteksi oleh Cloudflare.

---

## Bagian 4: Catatan Penting - Alamat Web Anda Akan Tetap Sama

### Kekhawatiran Umum
"Apakah alamat `https://gendhis.pages.dev/` akan berubah jika saya men-deploy ulang untuk memperbaiki masalah ini?"

### Jawaban Singkat
**Tidak.** Alamat web produksi Anda bersifat permanen dan terikat pada *proyek* Gendhis di Cloudflare, bukan pada *deployment* tunggal.

### Analogi Sederhana
- **Proyek Anda ('gendhis')** adalah alamat rumah Anda. Alamat ini tidak berubah.
- **Setiap Deployment** adalah renovasi interior rumah Anda.

Setiap kali Anda men-deploy pembaruan, Anda hanya mengubah konten "di dalam" alamat tersebut. Alamatnya sendiri tetap sama.

### Kesimpulan
Anda bisa dengan aman men-deploy pembaruan sebanyak yang Anda perlukan. Alamat utama Anda akan selalu menampilkan versi terbaru yang berhasil di-deploy dari branch `main`.