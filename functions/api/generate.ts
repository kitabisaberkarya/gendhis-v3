
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Konfigurasi Edge Runtime untuk Vercel
export const config = {
  runtime: 'edge',
};

// STRATEGI MODEL BERLAPIS (FALLBACK STRATEGY)
// 1. Primary: Model terbaru dan tercerdas.
// 2. Fallback: Model yang lebih stabil dan memiliki kuota rate-limit lebih longgar.
// Update: Menambahkan gemini-1.5-flash sebagai jaring pengaman terakhir yang paling stabil.
const MODELS = ["gemini-3-flash-preview", "gemini-3.1-pro-preview"];

// Helper untuk jeda waktu (Smart Retry)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req: Request) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const requestData = await req.json().catch(() => null);

    if (!requestData) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    const { prompt, featureType, config, userApiKey } = requestData;

    if (!prompt || !featureType) {
      return new Response(JSON.stringify({ error: "Bad Request" }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 1. STRATEGI PEMILIHAN API KEY
    let apiKeysToTry: string[] = [];
    
    // Prioritas 1: API Key dari User
    if (userApiKey && userApiKey.trim() !== '') {
        apiKeysToTry.push(userApiKey.trim());
    } else {
        // Prioritas 2: Server Keys (Vercel Environment Variables)
        const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
        
        const allKeys = [
            env.API_KEY_01,
            env.API_KEY_02,
            env.API_KEY_03,
            env.API_KEY_04,
            env.API_KEY_05
        ].filter((key): key is string => !!key && key.trim() !== '');

        if (allKeys.length === 0) {
             return new Response(JSON.stringify({ error: "Server Error: API Keys tidak terkonfigurasi. Silakan gunakan API Key Anda sendiri." }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
        // Acak kunci untuk load balancing
        apiKeysToTry = allKeys.sort(() => Math.random() - 0.5);
    }

    let lastErrorMessage = "";
    // Coba maksimal 3 kunci berbeda jika gagal
    const maxKeyRetries = Math.min(apiKeysToTry.length, 3); 

    // LOOPING KUNCI API
    for (let i = 0; i < maxKeyRetries; i++) {
        const apiKey = apiKeysToTry[i];
        
        // LOOPING MODEL (Primary -> Fallback)
        for (const modelName of MODELS) {
            try {
                const ai = new GoogleGenAI({ apiKey });
                
                // Bersihkan config untuk model lama
                const cleanConfig = { ...(config || {}) };
                if (cleanConfig.thinkingConfig) {
                    cleanConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
                }
                
                const geminiRequest: any = {
                    model: modelName,
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: cleanConfig
                };

                // KASUS A: Question Card (JSON Mode / Buffered)
                if (featureType === 'questionCard') {
                    const response = await ai.models.generateContent(geminiRequest);
                    const fullText = response.text;
                    
                    if (!fullText) throw new Error("Empty response from AI");

                    return new Response(JSON.stringify({ html: fullText }), {
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                    });
                } 
                // KASUS B: Streaming (RPM, RPS, dll)
                else {
                    const streamResult = await ai.models.generateContentStream(geminiRequest);
                    
                    const stream = new ReadableStream({
                        async start(controller) {
                            const encoder = new TextEncoder();
                            try {
                                for await (const chunk of streamResult) {
                                    const text = chunk.text;
                                    if (text) controller.enqueue(encoder.encode(text));
                                }
                                controller.close();
                            } catch (e) {
                                console.error("Stream Error:", e);
                                controller.error(e);
                            }
                        }
                    });

                    return new Response(stream, {
                        headers: { 
                            'Content-Type': 'text/plain; charset=utf-8', 
                            'Access-Control-Allow-Origin': '*',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive'
                        }
                    });
                }

            } catch (error: any) {
                lastErrorMessage = error.message || String(error);

                if (lastErrorMessage.includes("Safety") || lastErrorMessage.includes("Harmful") || lastErrorMessage.includes("INVALID_ARGUMENT")) {
                     return new Response(JSON.stringify({ error: "Konten ditolak filter keamanan AI. Mohon perhalus input Anda (misal: hindari topik sensitif)." }), { 
                        status: 400,
                        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                    });
                }
                
                await sleep(1500);
            }
        } // End Model Loop
    } // End Key Loop

    // Jika semua kunci dan semua model gagal
    return new Response(JSON.stringify({ 
        error: "Server Sedang Sibuk (High Load)", 
        details: `Gagal menghubungkan ke Server AI Google setelah beberapa percobaan. Pesan terakhir: ${lastErrorMessage}`,
        suggestion: "Sistem AI Google sedang sangat padat. Mohon tunggu 1-2 menit lalu coba lagi, atau gunakan API Key Anda sendiri agar prioritas lebih tinggi."
    }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
