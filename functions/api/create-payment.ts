// Impor createClient dari Supabase SDK.
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
    // LYNKID_MERCHANT_KEY masih relevan untuk verifikasi webhook, jadi tetap di sini.
    LYNKID_MERCHANT_KEY: string; 
}

interface RequestBody {
    documentId: string;
    userName?: string;
    userEmail?: string;
}

// ====================================================================================
// SOLUSI FINAL: Gunakan URL Produk Statis dari Lynk.id
// Ganti URL di bawah ini jika Anda membuat produk baru di masa depan.
const LYNK_PRODUCT_URL = 'https://lynk.id/guruinovasi/5z88d1gzp4pl';
// ====================================================================================


export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const requestBody: RequestBody | null = await context.request.json().catch(() => null);

        if (!requestBody || !requestBody.documentId || !requestBody.userEmail) {
             return new Response(JSON.stringify({ error: "Permintaan tidak valid. ID Dokumen dan Email pengguna dibutuhkan." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const { documentId, userEmail } = requestBody;
        const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            return new Response(JSON.stringify({ error: "Konfigurasi database di sisi server belum lengkap." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // 1. Ambil harga dokumen dari database
        const { data: priceData, error: priceError } = await supabaseAdmin
            .from('settings')
            .select('value')
            .eq('key', 'document_price')
            .single();

        if (priceError || !priceData) {
            console.error("Kesalahan saat mengambil harga:", priceError);
            return new Response(JSON.stringify({ error: "Gagal mengambil konfigurasi harga dari database." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        const documentPrice = parseInt(priceData.value || '10000', 10);
        
        // 2. Buat ID referensi unik (kunci untuk menghubungkan webhook)
        const uniqueReference = `GENDHIS-${documentId.substring(0, 8)}-${Date.now()}`;

        // 3. Simpan ID referensi DAN email pengguna ke database
        const { error: dbError } = await supabaseAdmin
            .from('generated_documents')
            .update({ 
                payment_order_id: uniqueReference,
                user_email: userEmail
            })
            .eq('id', documentId);

        if (dbError) {
            console.error("Supabase Update Error saat menyimpan refId dan email:", dbError);
            return new Response(JSON.stringify({ error: "Gagal menyimpan detail transaksi ke database." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        // 4. Buat URL pembayaran final dengan parameter
        // 'bid_price' untuk 'Pay what they want', 'refId' untuk pelacakan, dan 'email' untuk pre-fill
        const finalPaymentUrl = `${LYNK_PRODUCT_URL}/checkout?bid_price=${documentPrice}&refId=${uniqueReference}&email=${encodeURIComponent(userEmail)}`;
        
        // 5. Kembalikan URL final ke frontend
        return new Response(JSON.stringify({ payment_url: finalPaymentUrl }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error dalam fungsi create-payment:", error);
        // Menambahkan detail error ke respons untuk debugging yang lebih baik
        const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
        return new Response(JSON.stringify({ error: "Terjadi kesalahan internal pada server.", details: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};