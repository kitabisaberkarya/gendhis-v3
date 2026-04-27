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
    // LYNKID_MERCHANT_KEY tidak lagi dibutuhkan untuk verifikasi.
    LYNKID_MERCHANT_KEY: string;
}

/**
 * Handler untuk permintaan POST ke /api/payment-webhook.
 * Logika dirombak total untuk menggunakan EMAIL sebagai kunci verifikasi utama,
 * yang jauh lebih andal daripada refId yang tidak konsisten.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = context.env;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error("Konfigurasi server (Supabase keys) tidak lengkap.");
        return new Response('Konfigurasi server tidak lengkap.', { status: 500 });
    }

    try {
        const notification = await context.request.json().catch(() => null);
        
        if (!notification || !notification.data) {
             console.error("Webhook body tidak valid atau kosong.");
             return new Response('Body tidak valid.', { status: 400 });
        }
        
        // 1. Ekstrak data krusial: event, status, dan EMAIL.
        const eventType = notification.event;
        const messageAction = notification.data?.message_action;
        const userEmail = notification.data?.message_data?.customer?.email;

        // 2. Validasi awal pada notifikasi.
        if (eventType !== 'payment.received' || messageAction !== 'SUCCESS') {
            console.log(`Mengabaikan notifikasi: event=${eventType}, action=${messageAction}`);
            return new Response('Notifikasi diabaikan (bukan pembayaran sukses).', { status: 200 });
        }

        // 3. Validasi keberadaan email (Jembatan Baja).
        if (!userEmail) {
            console.error("Email pengguna tidak ditemukan dalam payload webhook. Tidak dapat mencocokkan transaksi.");
            // Kembalikan 200 OK untuk mencegah Lynk.id mencoba mengirim ulang payload yang rusak.
            return new Response('Notifikasi diterima, tetapi email tidak ditemukan.', { status: 200 });
        }
        
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // 4. Cari dokumen TERBARU yang 'pending' dengan email yang cocok.
        // Ini adalah langkah paling penting untuk mencegah pembaruan dokumen lama yang tidak relevan.
        const { data: documentToUpdate, error: findError } = await supabaseAdmin
            .from('generated_documents')
            .select('id')
            .eq('user_email', userEmail)
            .eq('payment_status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (findError || !documentToUpdate) {
            console.error(`Tidak ada dokumen 'pending' yang cocok ditemukan untuk email: ${userEmail}. Error:`, findError);
            return new Response('Tidak ada dokumen pending yang cocok ditemukan.', { status: 200 });
        }

        // 5. Perbarui dokumen yang ditemukan.
        const { error: updateError } = await supabaseAdmin
            .from('generated_documents')
            .update({
                payment_status: 'paid',
                payment_gateway_response: notification // Simpan seluruh notifikasi untuk audit
            })
            .eq('id', documentToUpdate.id);

        if (updateError) {
            console.error("Webhook Supabase Update Error:", updateError);
            // Kembalikan error 500 agar Lynk.id mencoba mengirim ulang notifikasi ini.
            return new Response('Gagal memperbarui database.', { status: 500 });
        }

        console.log(`Webhook berhasil diproses untuk email: ${userEmail}, dokumen ID: ${documentToUpdate.id} diubah menjadi 'paid'`);
        return new Response('OK', { status: 200 });

    } catch (error) {
        console.error("Error fatal saat memproses webhook:", error);
        return new Response('Terjadi kesalahan internal pada server.', { status: 500 });
    }
};