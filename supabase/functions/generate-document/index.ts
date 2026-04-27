
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, ThinkingLevel } from "npm:@google/genai";

// Definisi tipe untuk Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// KONFIGURASI MODEL UNTUK KEANDALAN TINGGI (ISO 25010 - Reliability)
// Model Utama: Paling cerdas (Gemini 3 Flash Preview)
// Model Cadangan: Paling stabil & kuota besar (Gemini Flash Latest / 2.0 Flash)
const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-3.1-pro-preview"; 

// Helper untuk jeda waktu (Smart Retry)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json().catch(() => null);

    if (!requestData) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const { prompt, featureType, config, userApiKey } = requestData;

    if (!prompt || !featureType) {
      return new Response(JSON.stringify({ error: "Bad Request: 'prompt' dan 'featureType' dibutuhkan." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. STRATEGI PEMILIHAN API KEY
    let apiKeysToTry: string[] = [];
    let isUserKey = false;

    // Jika user memasukkan key sendiri, ITU PRIORITAS MUTLAK.
    if (userApiKey && userApiKey.trim() !== '') {
        apiKeysToTry.push(userApiKey.trim());
        isUserKey = true;
    } else {
        // Gunakan rotasi kunci server
        const serverKeys = [
            Deno.env.get('API_KEY_01'),
            Deno.env.get('API_KEY_02'),
            Deno.env.get('API_KEY_03'),
            Deno.env.get('API_KEY_04'),
            Deno.env.get('API_KEY_05')
        ];
        const activeKeys = serverKeys.filter((key): key is string => !!key && key.trim() !== '');
        // Acak urutan untuk load balancing
        apiKeysToTry = activeKeys.sort(() => Math.random() - 0.5);
    }

    if (apiKeysToTry.length === 0) {
      return new Response(JSON.stringify({ 
          error: "Server Error: Tidak ada API Key yang tersedia. Mohon gunakan API Key Anda sendiri." 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let lastErrorMessage = "";
    
    // 3. EKSEKUSI DENGAN RETRY & FALLBACK
    // Loop melalui setiap Key yang tersedia
    for (const [index, apiKey] of apiKeysToTry.entries()) {
        
        // Untuk setiap Key, coba Model Utama -> Jika gagal, coba Model Stabil
        const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];

        for (const model of modelsToTry) {
            try {
                console.log(`[Edge Function] Percobaan: Key-${isUserKey ? 'USER' : index} | Model: ${model} | Fitur: ${featureType}`);
                
                const ai = new GoogleGenAI({ apiKey });
                
                // Konfigurasi request dasar
                const geminiRequest: any = {
                    model: model,
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: {
                        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, // Matikan thinking untuk respons cepat & hemat token
                        ...(config || {})
                    }
                };

                // A. Mode Buffer (JSON Response - untuk Kartu Soal)
                if (featureType === 'questionCard') {
                    const response = await ai.models.generateContent(geminiRequest);
                    const fullText = response.text;

                    if (fullText) {
                        return new Response(JSON.stringify({ html: fullText }), {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                    } else {
                        throw new Error("AI mengembalikan konten kosong.");
                    }
                } 
                // B. Mode Streaming (Text Response - untuk RPM, RPS, dll)
                else {
                    const streamResponse = await ai.models.generateContentStream(geminiRequest);
                    
                    const stream = new ReadableStream({
                        async start(controller) {
                            const encoder = new TextEncoder();
                            try {
                                for await (const chunk of streamResponse) {
                                    if (chunk.text) {
                                        controller.enqueue(encoder.encode(chunk.text));
                                    }
                                }
                                controller.close();
                            } catch (e) {
                                console.error("Stream transmission error:", e);
                                controller.error(e);
                            }
                        }
                    });

                    return new Response(stream, {
                        headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`Gagal [Key-${index}, ${model}]:`, errorMessage);
                lastErrorMessage = errorMessage;

                // --- ANALISIS ERROR & KEPUTUSAN RETRY ---

                // 1. Critical Errors: Safety / Invalid Input. JANGAN RETRY.
                if (errorMessage.includes("INVALID_ARGUMENT") || errorMessage.includes("Harmful") || errorMessage.includes("Safety")) {
                    console.error("Stopping: Prompt Safety/Validity error.");
                    return new Response(JSON.stringify({ 
                        error: "Permintaan ditolak oleh filter keamanan AI. Mohon sederhanakan input 'Materi Pokok' Anda agar tidak terdeteksi sensitif." 
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // 2. Transient Errors: Quota / Overloaded / Timeout. LAKUKAN RETRY.
                // Jika error 429/503, kita tunggu sebentar lalu coba model berikutnya atau key berikutnya.
                if (errorMessage.includes("429") || errorMessage.includes("503") || errorMessage.includes("Overloaded") || errorMessage.includes("quota")) {
                    console.log("Server sibuk/limit. Menunggu 2 detik sebelum mencoba opsi berikutnya...");
                    await sleep(2000); // Jeda 2 detik (Backoff)
                    
                    // Jika ini adalah model terakhir untuk key ini, loop akan lanjut ke key berikutnya.
                    // Jika ini key user (cuma 1), loop model akan mencoba fallback model.
                }
            }
        }
    }

    // Jika sampai sini, berarti semua percobaan gagal
    console.error("FATAL: Semua API Key dan Model gagal.");
    
    // Pesan error spesifik jika User Key gagal
    if (isUserKey) {
         return new Response(JSON.stringify({ 
            error: "Gagal membuat dokumen dengan API Key Anda.",
            details: "API Key Anda valid, namun server Google sedang sangat sibuk (Overloaded) atau kuota limit tercapai untuk model ini. Mohon tunggu 1 menit lalu coba lagi."
        }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ 
        error: "Server Gendhis Sedang Penuh.",
        details: "Mohon antre 1-2 menit, atau gunakan 'API Key Anda Sendiri' agar diprioritaskan oleh Google."
    }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Unhandled Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
