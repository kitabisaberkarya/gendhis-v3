// functions/api/download.ts
import { createClient } from '@supabase/supabase-js';

// Tipe untuk Cloudflare Pages Functions.
interface EventContext<Env = unknown> {
  request: Request;
  env: Env;
}
type PagesFunction<Env = unknown> = (context: EventContext<Env>) => Response | Promise<Response>;

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const documentId = url.searchParams.get('id');

    if (!documentId) {
      return new Response('Error: ID Dokumen tidak ditemukan dalam permintaan.', { status: 400 });
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return new Response('Error: Konfigurasi server tidak lengkap.', { status: 500 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data, error } = await supabaseAdmin
      .from('generated_documents')
      .select('document_content_html, feature_type, payment_status')
      .eq('id', documentId)
      .single();

    if (error || !data) {
      console.error('Error fetching document or not found:', error);
      return new Response('Dokumen tidak ditemukan atau akses ditolak.', { status: 404 });
    }

    // Keamanan tambahan: Pastikan dokumen sudah dibayar sebelum mengizinkan unduhan.
    if (data.payment_status !== 'paid') {
      return new Response('Akses unduh ditolak. Pembayaran untuk dokumen ini belum selesai.', { status: 403 });
    }

    // Membuat nama file yang dinamis dan aman
    const featureName = data.feature_type ? data.feature_type.replace(/[^a-zA-Z0-9]/g, '_') : 'Dokumen';
    const filename = `${featureName}_Gendhis.doc`;

    // Mengembalikan konten HTML sebagai file Word
    return new Response(data.document_content_html, {
      headers: {
        'Content-Type': 'application/msword; charset=UTF-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err) {
    console.error('Fatal error in download function:', err);
    return new Response('Terjadi kesalahan internal pada server saat mencoba memproses unduhan Anda.', { status: 500 });
  }
};
