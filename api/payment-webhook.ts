// api/payment-webhook.ts
// Webhook handler untuk notifikasi pembayaran dari Lynk.id
// Dilindungi dengan verifikasi signature HMAC-SHA256

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifikasi signature webhook dari Lynk.id menggunakan HMAC-SHA256.
 * Mencegah webhook palsu yang dikirim pihak tidak bertanggung jawab.
 */
const verifyWebhookSignature = (
  rawBody: string,
  receivedSignature: string,
  secret: string
): boolean => {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    const expected = Buffer.from(expectedSignature, 'hex');
    const received = Buffer.from(receivedSignature.replace(/^sha256=/, ''), 'hex');

    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const WEBHOOK_SECRET = process.env.LYNK_WEBHOOK_SECRET;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).send('Konfigurasi server tidak lengkap.');
  }

  // Verifikasi signature jika secret tersedia
  if (WEBHOOK_SECRET) {
    const signature = (req.headers['x-lynk-signature'] || req.headers['x-signature'] || '') as string;

    if (!signature) {
      return res.status(401).send('Signature webhook tidak ditemukan.');
    }

    // Untuk verifikasi, butuh raw body sebagai string
    const rawBody = JSON.stringify(req.body);

    if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
      return res.status(401).send('Signature webhook tidak valid.');
    }
  }

  try {
    const notification = req.body;

    if (!notification || !notification.data) {
      return res.status(400).send('Body tidak valid.');
    }

    const eventType = notification.event;
    const messageAction = notification.data?.message_action;
    const userEmail = notification.data?.message_data?.customer?.email;

    // Abaikan event selain pembayaran sukses
    if (eventType !== 'payment.received' || messageAction !== 'SUCCESS') {
      return res.status(200).send('Notifikasi diabaikan (bukan pembayaran sukses).');
    }

    if (!userEmail || typeof userEmail !== 'string') {
      return res.status(200).send('Notifikasi diterima, tetapi email tidak ditemukan.');
    }

    // Validasi format email dasar
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return res.status(400).send('Format email tidak valid dalam payload.');
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Cari dokumen pending terbaru milik user ini
    const { data: documentToUpdate, error: findError } = await supabaseAdmin
      .from('generated_documents')
      .select('id')
      .eq('user_email', userEmail)
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !documentToUpdate) {
      return res.status(200).send('Tidak ada dokumen pending yang cocok ditemukan.');
    }

    const { error: updateError } = await supabaseAdmin
      .from('generated_documents')
      .update({
        payment_status: 'paid',
        payment_gateway_response: notification,
      })
      .eq('id', documentToUpdate.id);

    if (updateError) {
      return res.status(500).send('Gagal memperbarui database.');
    }

    return res.status(200).send('OK');

  } catch (error) {
    return res.status(500).send('Terjadi kesalahan internal pada server.');
  }
}
