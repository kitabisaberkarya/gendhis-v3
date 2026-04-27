# Panduan Implementasi Fitur Premium Gendhis (via Lynk.id)

Dokumen ini adalah panduan strategis dan teknis untuk mengubah Gendhis menjadi sebuah layanan berkelanjutan (sustainable) dengan mengimplementasikan model monetisasi **"Generate Dulu, Bayar untuk Download"** menggunakan Lynk.id sebagai payment gateway.

## 1. Konsep & Alur Pengguna

Tujuan utamanya adalah memberikan pengalaman pengguna terbaik sambil memastikan keberlanjutan proyek.

**Alur yang Disepakati:**
1.  **Generate Gratis:** Pengguna dapat mengisi formulir dan men-generate dokumen seperti biasa, tanpa biaya.
2.  **Pratinjau Terkunci:** Hasil dokumen akan ditampilkan dalam mode pratinjau. Konten ini akan dilindungi agar tidak mudah disalin (`copy-paste`), dan tombol unduh (Word/Excel) akan dinonaktifkan.
3.  **Tombol Pembayaran:** Sebagai ganti tombol unduh, akan ada tombol "Buka Akses & Download (Rp 10.000)".
4.  **Proses Pembayaran:** Menekan tombol ini akan **mengarahkan pengguna ke halaman pembayaran aman Lynk.id**.
5.  **Akses Terbuka:** Setelah pembayaran berhasil, pengguna kembali ke aplikasi Gendhis. Sistem akan otomatis mendeteksi status pembayaran yang baru, membuka kunci pratinjau, dan mengaktifkan tombol unduh.
6.  **Sesi Tersimpan:** Jika pengguna menutup halaman sebelum membayar, sesi dokumennya akan disimpan. Saat kembali, mereka bisa melanjutkan pembayaran tanpa harus men-generate ulang.

---

## 2. Arsitektur Teknis

Untuk mewujudkan alur ini, kita membutuhkan empat komponen utama yang bekerja sama:

1.  **Payment Gateway (Lynk.id):** Pihak ketiga yang menangani semua proses transaksi pembayaran dengan aman.
2.  **Backend (Cloudflare Functions):** Fungsi *serverless* yang aman untuk berkomunikasi dengan Lynk.id dan database. Ini penting untuk melindungi kunci rahasia.
3.  **Database (Supabase):** Untuk menyimpan data dokumen yang di-generate dan melacak status pembayarannya.
4.  **Frontend (React):** Aplikasi Gendhis yang ada saat ini, yang akan kita modifikasi untuk menangani tampilan pratinjau terkunci dan alur pembayaran.

---

## 3. Langkah-langkah Implementasi

### Langkah 1: Konfigurasi Payment Gateway (Lynk.id)

Lynk.id akan menjadi gerbang pembayaran utama.

**Tugas Anda:**
1.  **Daftar Akun:** Kunjungi dasbor Lynk.id dan buat akun merchant.
2.  **Aktivasi:** Ikuti proses aktivasi akun sesuai panduan dari Lynk.id.
3.  **Dapatkan API Keys:** Setelah akun aktif, navigasikan ke pengaturan integrasi atau API. Anda akan membutuhkan kunci penting:
    *   **Merchant Key:** **SANGAT RAHASIA.** Digunakan di sisi backend (Cloudflare Function) untuk otentikasi API dan verifikasi webhook.
4.  **Atur Webhook:** Di pengaturan Lynk.id, Anda perlu memasukkan URL webhook. URL ini akan menjadi: `https://[nama-proyek-anda].pages.dev/api/payment-webhook`. Ini adalah alamat di mana Lynk.id akan mengirim notifikasi pembayaran.
5.  **Simpan Kunci:** Simpan "Merchant Key" Anda di tempat yang aman.

### Langkah 2: Pembaruan Skema Database (Supabase)

Kita perlu tabel untuk menyimpan setiap dokumen yang dihasilkan dan status pembayarannya. Skema ini telah disesuaikan untuk Lynk.id.

**Aksi:** Buka **SQL Editor** di dasbor Supabase Anda dan jalankan skrip berikut (skrip ini sama dengan di `konfigurasi_supabase.md` dan aman dijalankan kembali):

```sql
-- Membuat tabel untuk menyimpan dokumen yang dihasilkan
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_name TEXT,
  feature_type TEXT NOT NULL,
  document_content_html TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- Status: pending, paid, failed, expired
  payment_order_id TEXT UNIQUE, -- ID unik dari sistem kita untuk transaksi
  payment_url TEXT, -- URL pembayaran dari Lynk.id
  payment_gateway_response JSONB -- Menyimpan respons lengkap dari webhook Lynk.id
);

-- Memberi komentar untuk kejelasan
COMMENT ON TABLE public.generated_documents IS 'Menyimpan setiap dokumen yang dibuat pengguna dan status pembayarannya.';
COMMENT ON COLUMN public.generated_documents.payment_status IS 'Status pembayaran: pending, paid, failed, expired.';

-- Mengatur Row Level Security (RLS)
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- ... (kebijakan-kebijakan RLS lainnya seperti di file konfigurasi utama)
```

### Langkah 3: Membuat Backend (Cloudflare Functions)

Backend akan menjadi perantara yang aman antara aplikasi kita, Supabase, dan Lynk.id.

#### A. Fungsi 1: `create-payment` (untuk memulai pembayaran)

Fungsi ini akan menerima ID dokumen, membuat link pembayaran di Lynk.id, dan mengembalikan URL tersebut.

**Lokasi File:** `functions/api/create-payment.ts`

```typescript
// Contoh kerangka kode untuk /api/create-payment
import { createClient } from '@supabase/supabase-js';

// ... (Definisi tipe EventContext & Env)
interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    LYNKID_MERCHANT_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { documentId, userName } = await context.request.json();
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY, LYNKID_MERCHANT_KEY } = context.env;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // 1. Buat Order ID unik
    const orderId = `GENDHIS-${documentId.substring(0, 8)}-${Date.now()}`;

    // 2. Siapkan data transaksi untuk Lynk.id (struktur hipotetis)
    const transactionDetails = {
        order_id: orderId,
        amount: 10000, // Harga: Rp 10.000
        description: "Akses Download Dokumen Gendhis",
        customer_name: userName || "Pengguna Gendhis",
    };

    // 3. Panggil API Lynk.id untuk membuat link pembayaran
    const lynkResponse = await fetch('https://api.lynk.id/v1/payment-links', { // URL hipotetis
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LYNKID_MERCHANT_KEY}` // Menggunakan Merchant Key sebagai otorisasi
        },
        body: JSON.stringify(transactionDetails),
    });

    if (!lynkResponse.ok) {
        // ... penanganan error
    }

    const { payment_url } = await lynkResponse.json();

    // 4. Simpan order_id dan payment_url ke database
    await supabaseAdmin
        .from('generated_documents')
        .update({ payment_order_id: orderId, payment_url: payment_url })
        .eq('id', documentId);

    // 5. Kembalikan URL pembayaran ke frontend
    return new Response(JSON.stringify({ payment_url }));
};
```

#### B. Fungsi 2: `payment-webhook` (untuk menerima notifikasi pembayaran)

Lynk.id akan mengirim notifikasi ke endpoint ini. Fungsi ini akan memverifikasi keaslian notifikasi menggunakan **Merchant Key**.

**Lokasi File:** `functions/api/payment-webhook.ts`

```typescript
// Contoh kerangka kode untuk /api/payment-webhook
import { createClient } from '@supabase/supabase-js';

// ... (Definisi tipe EventContext & Env)
interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    LYNKID_MERCHANT_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY, LYNKID_MERCHANT_KEY } = context.env;
    
    // 1. Verifikasi Signature (Langkah Keamanan Kritis)
    const signature = context.request.headers.get('X-Lynk-Signature');
    const bodyText = await context.request.text();
    // ... (logika untuk memvalidasi signature menggunakan LYNKID_MERCHANT_KEY)
    // Jika tidak valid, kembalikan status error.

    // 2. Proses notifikasi jika valid
    const notification = JSON.parse(bodyText);
    const { order_id, status } = notification;

    if (status === 'SUCCESS') {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        await supabaseAdmin
            .from('generated_documents')
            .update({
                payment_status: 'paid',
                payment_gateway_response: notification
            })
            .eq('payment_order_id', order_id);
    }

    return new Response('OK', { status: 200 });
};
```

**Tugas Anda:** Anda perlu menambahkan `LYNKID_MERCHANT_KEY`, `SUPABASE_URL`, dan `SUPABASE_SERVICE_KEY` sebagai *Environment Variables* di pengaturan proyek Cloudflare Pages Anda.

### Langkah 4: Modifikasi Frontend (Aplikasi React)

1.  **Hapus Skrip Tidak Perlu:**
    *   Buka `index.html`.
    *   Hapus skrip yang sebelumnya digunakan untuk Midtrans.

2.  **Simpan Dokumen ke Database:**
    *   Di setiap komponen generator (misal `RpmGenerator.tsx`), modifikasi fungsi `handleSubmit`.
    *   Setelah proses generate dari Gemini selesai, panggil fungsi di `supabaseService.ts` untuk `INSERT` konten HTML ke tabel `generated_documents`.
    *   Simpan `id` dokumen yang dikembalikan dari Supabase ke dalam state.

3.  **Ubah Komponen Pratinjau:**
    *   Modifikasi `RpmPreview.tsx`, `QuestionCardPreview.tsx`, dll.
    *   Gunakan `useEffect` untuk mengambil data dokumen (termasuk `payment_status`) dari Supabase berdasarkan `documentId`.
    *   Terapkan logika tampilan terkunci jika `payment_status !== 'paid'`.

4.  **Implementasikan Alur Pembayaran (Redirect):**
    *   Saat tombol "Buka Akses" diklik:
        *   Tampilkan status loading.
        *   Panggil `fetch` ke endpoint backend kita (`/api/create-payment`), kirim `documentId`.
        *   Terima `payment_url` dari respons backend.
        *   Arahkan pengguna ke halaman pembayaran: `window.location.href = payment_url;`.

---

## 5. Kesimpulan

Dengan arsitektur ini, kita telah berhasil mengganti Midtrans dengan Lynk.id, mengimplementasikan model "Bayar untuk Download" yang aman dan andal. Alur redirect adalah standar industri yang mudah dipahami pengguna, dan verifikasi webhook dengan "Merchant Key" memastikan keamanan transaksi Anda.