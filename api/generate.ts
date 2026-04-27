import Anthropic from "@anthropic-ai/sdk";

// Konfigurasi Edge Runtime untuk Vercel
export const config = {
  runtime: 'edge',
};

// Model Claude terbaru & paling capable
const CLAUDE_MODEL = "claude-sonnet-4-6";

// Batas panjang prompt untuk mencegah abuse
const MAX_PROMPT_LENGTH = 50000;

/**
 * Sanitasi input dasar: hilangkan karakter kontrol berbahaya,
 * batasi panjang string.
 */
const sanitizeInput = (input: string, maxLength: number = MAX_PROMPT_LENGTH): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Hapus kontrol chars (kecuali tab, LF, CR)
    .trim()
    .slice(0, maxLength);
};

export default async function handler(req: Request) {
  // Handle CORS preflight
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Ambil dan validasi body
  let requestData: any;
  try {
    const bodyText = await req.text();
    if (!bodyText || bodyText.length > 200000) {
      return new Response(JSON.stringify({ error: "Request terlalu besar atau kosong." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    requestData = JSON.parse(bodyText);
  } catch {
    return new Response(JSON.stringify({ error: "Format JSON tidak valid." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { prompt: rawPrompt, featureType: rawFeatureType, userApiKey: rawUserApiKey } = requestData;

  // Validasi field wajib
  if (!rawPrompt || !rawFeatureType) {
    return new Response(JSON.stringify({ error: "Field 'prompt' dan 'featureType' wajib diisi." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Sanitasi semua input
  const prompt = sanitizeInput(rawPrompt);
  const featureType = sanitizeInput(rawFeatureType, 50);

  if (prompt.length < 10) {
    return new Response(JSON.stringify({ error: "Prompt terlalu pendek. Mohon lengkapi data formulir." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Validasi featureType agar hanya nilai yang diketahui diterima
  const validFeatureTypes = ['rpm', 'rps', 'rpd', 'atp', 'journal', 'ck', 'questionCard'];
  if (!validFeatureTypes.includes(featureType)) {
    return new Response(JSON.stringify({ error: "Tipe fitur tidak dikenal." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Tentukan API key yang digunakan:
  // Prioritas 1: userApiKey dari request (format sk-ant-)
  // Prioritas 2: ANTHROPIC_API_KEY dari environment server
  let apiKey = '';
  let isUserKey = false;

  if (rawUserApiKey && typeof rawUserApiKey === 'string' && rawUserApiKey.trim().startsWith('sk-ant-')) {
    apiKey = rawUserApiKey.trim();
    isUserKey = true;
  } else if (process.env.ANTHROPIC_API_KEY) {
    apiKey = process.env.ANTHROPIC_API_KEY.trim();
  }

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: "Server belum dikonfigurasi dengan API Key Claude.",
      suggestion: "Hubungi admin atau gunakan API Key Anda sendiri (format: sk-ant-...)."
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    // ── KASUS A: Question Card (buffered, bukan streaming) ──
    if (featureType === 'questionCard') {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const fullText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

      if (!fullText) {
        return new Response(JSON.stringify({ error: "AI mengembalikan respons kosong. Coba lagi." }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ html: fullText }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // ── KASUS B: Streaming (RPM, RPS, RPD, ATP, Journal, CK) ──
    const stream = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (streamError) {
          controller.error(streamError);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    const message: string = error?.message || String(error);

    // API Key tidak valid atau kuota habis
    if (
      error?.status === 401 ||
      message.includes('invalid x-api-key') ||
      message.includes('authentication')
    ) {
      const hint = isUserKey
        ? "API Key Claude Anda tidak valid. Periksa kembali kunci Anda."
        : "API Key server tidak valid. Hubungi admin.";
      return new Response(JSON.stringify({ error: hint }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Rate limit
    if (error?.status === 429 || message.includes('rate_limit')) {
      return new Response(JSON.stringify({
        error: "Batas permintaan tercapai (Rate Limit). Mohon tunggu beberapa saat lalu coba lagi.",
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Overload model
    if (error?.status === 529 || message.includes('overloaded')) {
      return new Response(JSON.stringify({
        error: "Server Claude sedang sangat sibuk. Mohon tunggu 1 menit lalu coba lagi.",
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Konten ditolak filter keamanan
    if (message.includes('policy') || message.includes('safety')) {
      return new Response(JSON.stringify({
        error: "Konten ditolak filter keamanan AI. Mohon perhalus input Anda.",
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generic error
    return new Response(JSON.stringify({
      error: "Terjadi kesalahan pada server AI. Silakan coba lagi.",
      details: message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
