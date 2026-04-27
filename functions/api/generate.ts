// functions/api/generate.ts
// Cloudflare Pages Function — Claude AI only
import Anthropic from "@anthropic-ai/sdk";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const MAX_PROMPT_LENGTH = 50000;

const sanitizeInput = (input: string, maxLen = MAX_PROMPT_LENGTH): string => {
  if (typeof input !== 'string') return '';
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLen);
};

export async function onRequestPost(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  let requestData: any;
  try {
    const bodyText = await context.request.text();
    requestData = JSON.parse(bodyText);
  } catch {
    return new Response(JSON.stringify({ error: "Format JSON tidak valid." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { prompt: rawPrompt, featureType: rawFeatureType, userApiKey: rawUserApiKey } = requestData;

  if (!rawPrompt || !rawFeatureType) {
    return new Response(JSON.stringify({ error: "Field 'prompt' dan 'featureType' wajib diisi." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const prompt = sanitizeInput(rawPrompt);
  const featureType = sanitizeInput(rawFeatureType, 50);

  const validFeatureTypes = ['rpm', 'rps', 'rpd', 'atp', 'journal', 'ck', 'questionCard'];
  if (!validFeatureTypes.includes(featureType) || prompt.length < 10) {
    return new Response(JSON.stringify({ error: "Input tidak valid." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let apiKey = '';
  let isUserKey = false;

  if (rawUserApiKey && typeof rawUserApiKey === 'string' && rawUserApiKey.trim().startsWith('sk-ant-')) {
    apiKey = rawUserApiKey.trim();
    isUserKey = true;
  } else {
    const env = context.env || {};
    apiKey = (env.ANTHROPIC_API_KEY || '').trim();
  }

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: "Server belum dikonfigurasi dengan API Key Claude.",
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    if (featureType === 'questionCard') {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const fullText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');

      return new Response(JSON.stringify({ html: fullText }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

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
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
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
    const msg: string = error?.message || String(error);

    if (error?.status === 401 || msg.includes('invalid x-api-key')) {
      return new Response(JSON.stringify({
        error: isUserKey ? "API Key Claude Anda tidak valid." : "API Key server tidak valid.",
      }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    if (error?.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit tercapai. Tunggu sebentar lalu coba lagi." }), {
        status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Terjadi kesalahan pada server AI.", details: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
