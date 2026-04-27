
# Panduan Aktivasi Auto-Deploy (Vercel & Cloudflare)

Agar aplikasi otomatis ter-deploy ke **Vercel** DAN **Cloudflare** setiap kali Anda menekan tombol "Save to GitHub" di Google AI Studio, ikuti pengaturan wajib di bawah ini.

## 🚨 PERBAIKAN KRITIS CLOUDFLARE (Wajib Dibaca) 🚨

Log error Anda menunjukkan: `Executing user deploy command: npx wrangler deploy`.
Ini adalah penyebab utama kegagalan deployment dan potensi error pada backend (API). Cloudflare Pages yang terhubung ke GitHub **TIDAK BOLEH** memiliki perintah deploy manual ini di pengaturan build.

**LAKUKAN INI SEKARANG DI DASHBOARD CLOUDFLARE:**

1.  Buka Dashboard Cloudflare > **Workers & Pages**.
2.  Pilih Project **Gendhis**.
3.  Pergi ke **Settings** > **Builds & deployments**.
4.  Klik **Edit Settings** pada bagian "Build configurations".
5.  **HAPUS** apapun yang ada di kolom **"Build command"** dan ganti dengan hanya:
    `npm run build`
    *(Pastikan TIDAK ADA tulisan 'wrangler deploy' di sini!)*
6.  Pastikan **"Build output directory"** diisi dengan:
    `dist`
7.  Klik **Save**.

---

## 1. Pastikan Branch Benar
Google AI Studio biasanya menyimpan ke branch bernama `main`. 
Cloudflare seringkali secara default melihat ke branch `master`.

### Cek di GitHub Repository Anda:
1. Buka repo GitHub Gendhis Anda.
2. Lihat nama branch utamanya (biasanya `main`).

---

## 2. Konfigurasi Environment Variables (Cloudflare)

Pastikan variabel berikut ada di **Settings > Environment variables**:

*   `API_KEY_01` (dan seterusnya)
*   `SUPABASE_URL`
*   `SUPABASE_SERVICE_KEY`
*   `LYNKID_MERCHANT_KEY`
*   `NODE_VERSION` (Set ke `18` atau `20`)

---

## 3. Konfigurasi Vercel (Wajib)

1.  Masuk ke Dashboard Vercel.
2.  Pilih Project **Gendhis**.
3.  Pergi ke **Settings** > **Git**.
    *   Pastikan **Production Branch** adalah `main`.
4.  Pergi ke **Settings** > **Build & Development Settings**.
    *   **Framework Preset:** Pilih `Vite`.
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`

---

## 4. Cara Tes (Pembuktian)

1.  Saya telah memperbaiki file `wrangler.json`. Ini akan memicu deployment baru secara otomatis di Cloudflare.
2.  Jika Anda sudah memperbaiki **Build command** di dashboard Cloudflare (Langkah Paling Atas), deployment kali ini seharusnya **BERHASIL (Hijau)**.
3.  Buka tab **Deployments** di Cloudflare untuk memantau prosesnya.
