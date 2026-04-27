// api/download.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id: documentId } = req.query;

    if (!documentId || typeof documentId !== 'string') {
      return res.status(400).send('Error: ID Dokumen tidak ditemukan dalam permintaan.');
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return res.status(500).send('Error: Konfigurasi server tidak lengkap.');
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data, error } = await supabaseAdmin
      .from('generated_documents')
      .select('document_content_html, feature_type, payment_status')
      .eq('id', documentId)
      .single();

    if (error || !data) {
      console.error('Error fetching document or not found:', error);
      return res.status(404).send('Dokumen tidak ditemukan atau akses ditolak.');
    }

    // Keamanan tambahan: Pastikan dokumen sudah dibayar sebelum mengizinkan unduhan.
    if (data.payment_status !== 'paid') {
      return res.status(403).send('Akses unduh ditolak. Pembayaran untuk dokumen ini belum selesai.');
    }

    // Membuat nama file yang dinamis dan aman
    const featureName = data.feature_type ? data.feature_type.replace(/[^a-zA-Z0-9]/g, '_') : 'Dokumen';
    const filename = `${featureName}_Gendhis.doc`;

    // Mengembalikan konten HTML sebagai file Word
    res.setHeader('Content-Type', 'application/msword; charset=UTF-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(data.document_content_html);

  } catch (err) {
    console.error('Fatal error in download function:', err);
    return res.status(500).send('Terjadi kesalahan internal pada server saat mencoba memproses unduhan Anda.');
  }
};