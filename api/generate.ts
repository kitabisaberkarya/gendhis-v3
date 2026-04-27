// api/generate.ts — Vercel Node.js Serverless Function
// Menggunakan Node.js runtime (bukan Edge) agar kompatibel penuh dengan Anthropic SDK.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MAX_PROMPT_LENGTH = 50000;

const sanitizeInput = (input: string, maxLen = MAX_PROMPT_LENGTH): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLen);
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const validFeatureTypes = new Set([
  'rpm', 'rps', 'rpd', 'atp', 'journal', 'ck', 'questionCard',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers untuk semua response
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ambil body
  const body = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Request body kosong.' });
  }

  const { prompt: rawPrompt, featureType: rawFeatureType, userApiKey: rawUserApiKey } = body;

  // Validasi field wajib
  if (!rawPrompt || !rawFeatureType) {
    return res.status(400).json({ error: "Field 'prompt' dan 'featureType' wajib diisi." });
  }

  const prompt = sanitizeInput(rawPrompt);
  const featureType = sanitizeInput(rawFeatureType, 50);

  if (prompt.length < 10) {
    return res.status(400).json({ error: 'Prompt terlalu pendek. Lengkapi data formulir.' });
  }

  if (!validFeatureTypes.has(featureType)) {
    return res.status(400).json({ error: 'Tipe fitur tidak dikenal.' });
  }

  // Tentukan API key
  let apiKey = '';
  let isUserKey = false;

  if (rawUserApiKey && typeof rawUserApiKey === 'string' && rawUserApiKey.trim().startsWith('sk-ant-')) {
    apiKey = rawUserApiKey.trim();
    isUserKey = true;
  } else if (process.env.ANTHROPIC_API_KEY) {
    apiKey = process.env.ANTHROPIC_API_KEY.trim();
  }

  if (!apiKey) {
    return res.status(503).json({
      error: 'API Key Claude belum dikonfigurasi di server.',
      suggestion: 'Hubungi admin atau masukkan API Key Anda sendiri (format: sk-ant-...).',
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    // ── KASUS A: Question Card (buffered/JSON) ──
    if (featureType === 'questionCard') {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      });

      const fullText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');

      if (!fullText) {
        return res.status(500).json({ error: 'AI mengembalikan respons kosong. Coba lagi.' });
      }

      return res.status(200).json({ html: fullText });
    }

    // ── KASUS B: Streaming (RPM, RPS, RPD, ATP, Journal, CK) ──
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.status(200);

    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta' &&
        chunk.delta.text
      ) {
        res.write(chunk.delta.text);
      }
    }

    return res.end();

  } catch (error: any) {
    const msg: string = error?.message || String(error);
    const status: number = error?.status || 500;

    if (status === 401 || msg.includes('invalid x-api-key') || msg.includes('authentication')) {
      return res.status(401).json({
        error: isUserKey
          ? 'API Key Claude Anda tidak valid. Periksa kembali kunci Anda.'
          : 'API Key server tidak valid. Hubungi admin.',
      });
    }

    if (status === 429 || msg.includes('rate_limit')) {
      return res.status(429).json({
        error: 'Batas permintaan tercapai (Rate Limit). Tunggu beberapa saat lalu coba lagi.',
      });
    }

    if (status === 529 || msg.includes('overloaded')) {
      return res.status(503).json({
        error: 'Server Claude sedang sangat sibuk. Tunggu 1-2 menit lalu coba lagi.',
      });
    }

    if (msg.includes('policy') || msg.includes('safety')) {
      return res.status(400).json({
        error: 'Konten ditolak filter keamanan AI. Perhalus input Anda.',
      });
    }

    return res.status(500).json({
      error: 'Terjadi kesalahan pada server AI. Silakan coba lagi.',
      details: msg,
    });
  }
}
