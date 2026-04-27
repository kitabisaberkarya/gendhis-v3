// api/health.ts — Endpoint diagnostik untuk cek koneksi Claude AI
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      status: 'error',
      message: 'ANTHROPIC_API_KEY belum diset di environment variables Vercel.',
      fix: 'Buka Vercel Dashboard → Settings → Environment Variables → tambah ANTHROPIC_API_KEY → Redeploy.',
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });

    return res.status(200).json({
      status: 'ok',
      message: 'Claude AI terhubung dengan baik!',
      model: response.model,
      key_prefix: apiKey.slice(0, 20) + '...',
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error?.message || String(error),
      error_type: error?.constructor?.name,
      status_code: error?.status,
    });
  }
}
