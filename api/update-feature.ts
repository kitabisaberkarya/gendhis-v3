// api/update-feature.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1. Dapatkan Token dari Header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Otentikasi dibutuhkan. Token tidak ditemukan.' });
    }

    const { featureName, isEnabled } = req.body;
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

    if (typeof featureName !== 'string' || typeof isEnabled !== 'boolean') {
        return res.status(400).json({ error: 'Permintaan tidak valid. Data yang dibutuhkan tidak lengkap.' });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return res.status(500).json({ error: "Konfigurasi database backend belum lengkap." });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 2. Verifikasi Pengguna dan Perannya
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
        return res.status(401).json({ error: 'Token tidak valid atau kedaluwarsa.' });
    }

    if (user.user_metadata?.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak. Peran admin dibutuhkan.' });
    }

    // 3. Lakukan Operasi Update (Hanya jika pengguna adalah admin)
    const { error: updateError } = await supabaseAdmin
        .from('feature_flags')
        .update({ is_enabled: isEnabled })
        .eq('feature_name', featureName)
        .select()
        .single();

    if (updateError) {
        console.error('Supabase update error:', updateError);
        if (updateError.code === 'PGRST116') {
             return res.status(404).json({ error: `Gagal memperbarui: Tidak ada fitur dengan nama '${featureName}' ditemukan di database.` });
        }
        return res.status(500).json({ error: `Gagal memperbarui database: ${updateError.message}` });
    }

    return res.status(200).json({ success: true, message: `Fitur '${featureName}' berhasil diatur ke '${isEnabled}'.` });

  } catch (err) {
    console.error("Error di fungsi update-feature:", err);
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.";
    return res.status(500).json({ error: "Internal Server Error", details: errorMessage });
  }
};