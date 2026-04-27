// Impor createClient dari Supabase SDK.
import { createClient } from '@supabase/supabase-js';

// Tipe untuk Cloudflare Pages Functions.
interface EventContext<Env = unknown> {
  request: Request;
  env: Env;
}
type PagesFunction<Env = unknown> = (context: EventContext<Env>) => Response | Promise<Response>;

// Tentukan struktur environment variables yang diharapkan dari Cloudflare.
interface Env {
  ADMIN_PASSWORD?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
}

// Tentukan struktur body permintaan yang diharapkan dari frontend.
interface RequestBody {
    settingKey?: string;
    settingValue?: string;
    password?: string;
}

/**
 * Handler untuk permintaan POST ke /api/update-setting.
 * Fungsi ini secara aman memperbarui nilai di tabel 'settings' Supabase.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { settingKey, settingValue, password }: RequestBody = await context.request.json();
    const { ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;

    // 1. Validasi Input Dasar
    if (typeof settingKey !== 'string' || typeof settingValue !== 'string' || typeof password !== 'string') {
        return new Response(JSON.stringify({ error: 'Permintaan tidak valid. Data yang dibutuhkan tidak lengkap.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Verifikasi Kata Sandi Admin
    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Akses ditolak. Kata sandi admin salah.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Verifikasi Konfigurasi Backend
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return new Response(JSON.stringify({ error: "Konfigurasi database backend belum lengkap." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 4. Inisialisasi Klien Supabase dengan Kunci Service Role
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 5. Lakukan Operasi Update ke Database
    const { error } = await supabaseAdmin
        .from('settings')
        .update({ value: settingValue })
        .eq('key', settingKey);

    if (error) {
        console.error('Supabase update setting error:', error);
        return new Response(JSON.stringify({ error: `Gagal memperbarui database: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 6. Kembalikan Respons Sukses
    return new Response(JSON.stringify({ success: true, message: `Pengaturan '${settingKey}' berhasil diperbarui.` }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error("Error di fungsi update-setting:", err);
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.";
    return new Response(JSON.stringify({ error: "Internal Server Error", details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
