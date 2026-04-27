// api/create-payment.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { btoa } from 'buffer';

// URL produk statis dari Lynk.id yang telah Anda buat.
const LYNK_PRODUCT_URL = 'https://lynk.id/guruinovasi/5z88d1gzp4pl';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        // --- Otentikasi & Otorisasi Pengguna ---
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Otentikasi dibutuhkan untuk membuat transaksi.' });
        }

        const { creditAmount, priceIdr, packageName } = req.body;

        if (typeof creditAmount !== 'number' || typeof priceIdr !== 'number' || typeof packageName !== 'string') {
            return res.status(400).json({ error: "Permintaan tidak valid. Detail paket kredit dibutuhkan." });
        }
        
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
            return res.status(500).json({ error: "Konfigurasi server belum lengkap." });
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user || !user.email) {
            return res.status(401).json({ error: 'Token otentikasi tidak valid atau email tidak ditemukan.' });
        }

        // --- Logika Inti Pembelian Kredit ---

        // 1. Buat entri transaksi baru di database untuk pelacakan
        const { data: transaction, error: transactionError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: user.id,
                credit_amount: creditAmount,
                price_idr: priceIdr,
                status: 'pending'
            })
            .select()
            .single();

        if (transactionError || !transaction) {
            console.error("Gagal membuat entri transaksi di Supabase:", transactionError);
            return res.status(500).json({ error: "Gagal menyimpan detail transaksi ke database." });
        }

        // 2. [PERBAIKAN KRUSIAL FINAL] Bungkus semua data di dalam objek `message_data`.
        const payload = {
            message_data: {
                refId: transaction.id,
                customer: {
                    email: user.email,
                },
                items: [
                    {
                        title: packageName,
                        price: priceIdr,
                        qty: 1
                    }
                ]
            }
        };
        const jsonString = JSON.stringify(payload);

        // 3. Enkripsi string JSON menggunakan Base64
        const base64Token = btoa(jsonString);
        
        // 4. Buat URL pembayaran final dengan parameter 'token'
        const finalPaymentUrl = `${LYNK_PRODUCT_URL}/checkout?token=${base64Token}`;
        
        // 5. Kembalikan URL pembayaran ke frontend
        return res.status(200).json({ payment_url: finalPaymentUrl });

    } catch (error) {
        console.error("Error fatal dalam fungsi create-payment:", error);
        const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
        return res.status(500).json({ error: "Terjadi kesalahan internal pada server.", details: errorMessage });
    }
};