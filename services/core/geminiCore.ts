// services/core/claudeCore.ts
// Proxy layer antara komponen React dan Vercel Edge Function /api/generate
// yang menggunakan Claude AI (Anthropic) sebagai satu-satunya provider AI.

const EDGE_FUNCTION_URL = '/api/generate';

// Timeout 5 menit — dokumen panjang butuh waktu generate
const REQUEST_TIMEOUT_MS = 300_000;

/**
 * Fetch dengan retry otomatis untuk server error (5xx).
 * Untuk error klien (4xx), langsung dikembalikan tanpa retry.
 */
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 2,
  backoff = 3000
): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    // Sukses atau error klien (4xx) → kembalikan langsung
    if (response.ok || (response.status >= 400 && response.status < 500)) {
      return response;
    }

    // Server error (5xx) → lempar agar masuk catch dan di-retry
    throw new Error(`Server Error: ${response.status}`);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, Math.round(backoff * 1.5));
    }
    throw error;
  }
};

/**
 * Memanggil backend dalam mode buffered (non-streaming).
 * Digunakan untuk: Kartu Soal & Kisi-Kisi.
 */
export const callGeminiProxyBuffered = async (
  prompt: string,
  featureType: 'questionCard',
  onChunk: (chunk: string) => void,
  config?: any,
  userApiKey?: string
): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchWithRetry(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, featureType, userApiKey }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(
        errorPayload.error || errorPayload.details || `Kesalahan server: ${response.status}`
      );
    }

    const result: any = await response.json();
    if (result.error || !result.html) {
      throw new Error(result.error || "Respons dari server tidak valid.");
    }

    onChunk(result.html);
  } catch (error) {
    clearTimeout(timeoutId);
    throw handleFetchError(error);
  }
};

/**
 * Memanggil backend dalam mode streaming.
 * Digunakan untuk: RPM, RPS, RPD, ATP, Jurnal, CK.
 */
export const callGeminiProxyStream = async (
  prompt: string,
  featureType: 'rpm' | 'rps' | 'rpd' | 'atp' | 'journal' | 'ck',
  onChunk: (chunk: string) => void,
  userApiKey?: string
): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchWithRetry(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, featureType, userApiKey }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(
        errorPayload.error || errorPayload.details || `Kesalahan server: ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error("Respons dari server tidak berisi stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value));
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw handleFetchError(error);
  }
};

/**
 * Mengubah error teknis menjadi pesan ramah pengguna.
 */
const handleFetchError = (error: unknown): Error => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error(
      'Waktu habis (Timeout). Koneksi ke server terlalu lambat. Silakan coba lagi.'
    );
  }
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return new Error(
      'Gagal terhubung ke server. Periksa koneksi internet Anda atau muat ulang halaman.'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

/**
 * Menerjemahkan error ke pesan UI yang informatif.
 */
export const handleGenerationError = (error: unknown): string => {
  let message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi nanti.';

  if (message.includes('429') || message.includes('rate_limit') || message.includes('Rate Limit')) {
    return '⚠️ Batas permintaan tercapai. Mohon tunggu beberapa saat lalu coba lagi.';
  }

  if (message.includes('529') || message.includes('sibuk') || message.includes('overloaded')) {
    return '⚠️ Server Claude sedang sangat sibuk. Silakan coba lagi dalam 1-2 menit.';
  }

  if (message.includes('401') || message.includes('invalid') || message.includes('authentication')) {
    return '⚠️ API Key tidak valid atau tidak memiliki akses. Periksa kembali kunci API Anda.';
  }

  if (message.includes('Failed to fetch') || message.includes('Gagal terhubung')) {
    return 'Gagal terhubung ke server Gendhis. Pastikan internet Anda stabil.';
  }

  if (message.includes('Timeout') || message.includes('AbortError')) {
    return '⏱️ Waktu generate habis. Coba lagi atau sederhanakan input Anda.';
  }

  if (message.includes('policy') || message.includes('safety') || message.includes('filter')) {
    return '⚠️ Konten Ditolak. Materi Anda terdeteksi oleh filter keamanan AI. Coba gunakan kata-kata yang lebih umum.';
  }

  return message;
};
