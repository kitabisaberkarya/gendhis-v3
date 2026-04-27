// Impor createClient dari Supabase SDK.
import { createClient } from '@supabase/supabase-js';

// Tipe untuk Cloudflare Pages Functions.
interface EventContext<Env = unknown> {
  request: Request;
  env: Env;
}
type PagesFunction<Env = unknown> = (context: EventContext<Env>) => Response | Promise<Response>;

// Tentukan struktur environment variables yang diharapkan dari Cloudflare.
// Kunci ini bersifat rahasia dan hanya ada di sisi server.
interface Env {
  ADMIN_PASSWORD?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string; // Ini adalah kunci 'service_role' yang aman.
}

// Tentukan struktur body permintaan yang diharapkan dari frontend.
interface RequestBody {
    featureName?: string;
    isEnabled?: boolean;
    password?: string;
}

/**
 * Handler untuk permintaan POST ke /api/update-feature.
 * Fungsi ini secara aman memperbarui status fitur di tabel 'feature_flags' Supabase.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { featureName, isEnabled, password }: RequestBody = await context.request.json();
    const { ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;

    // 1. Validasi Input Dasar
    if (typeof featureName !== 'string' || typeof isEnabled !== 'boolean' || typeof password !== 'string') {
        return new Response(JSON.stringify({ error: 'Permintaan tidak valid. Data yang dibutuhkan tidak lengkap.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Verifikasi Kata Sandi Admin
    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Akses ditolak. Kata sandi admin salah.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Verifikasi Konfigurasi Backend dengan Pesan Error yang Spesifik
    if (!SUPABASE_URL) {
        return new Response(JSON.stringify({ error: "Variabel 'SUPABASE_URL' tidak ditemukan di environment backend. Pastikan sudah diatur dengan benar di Pengaturan Cloudflare dan proyek telah di-deploy ulang." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    if (!SUPABASE_SERVICE_KEY) {
        return new Response(JSON.stringify({ error: "Variabel 'SUPABASE_SERVICE_KEY' tidak ditemukan di environment backend. Ini adalah kunci rahasia 'service_role' dari Supabase." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Inisialisasi Klien Supabase dengan Kunci Service Role
    // Kunci ini memiliki hak akses penuh dan dapat melewati RLS, sehingga cocok untuk operasi admin.
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 5. Lakukan Operasi Update ke Database dengan Verifikasi
    // Menambahkan .select().single() adalah perubahan krusial.
    // Ini akan memaksa query untuk mengembalikan error jika tidak ada baris yang cocok (misalnya karena typo),
    // sehingga mencegah "kegagalan senyap".
    const { error } = await supabaseAdmin
        .from('feature_flags')
        .update({ is_enabled: isEnabled })
        .eq('feature_name', featureName)
        .select()
        .single();

    if (error) {
        console.error('Supabase update error:', error);
        // Memberikan pesan error yang lebih spesifik jika tidak ada baris yang ditemukan
        if (error.code === 'PGRST116') {
             return new Response(JSON.stringify({ error: `Gagal memperbarui: Tidak ada fitur dengan nama '${featureName}' ditemukan di database. Periksa kembali apakah ada salah ketik di tabel 'feature_flags' Anda.` }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: `Gagal memperbarui database: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 6. Kembalikan Respons Sukses
    return new Response(JSON.stringify({ success: true, message: `Fitur '${featureName}' berhasil diatur ke '${isEnabled}'.` }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error("Error di fungsi update-feature:", err);
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.";
    return new Response(JSON.stringify({ error: "Internal Server Error", details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
