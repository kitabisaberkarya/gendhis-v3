// services/questionCardService.ts
import type { QuestionCardFormData } from '../types';
import { callGeminiProxyBuffered } from './core/geminiCore';

/**
 * Membangun prompt lengkap yang menginstruksikan Claude untuk
 * mengembalikan output dalam format JSON terstruktur.
 * Karena Claude tidak punya responseSchema seperti Gemini,
 * kita gunakan prompt engineering yang jelas dan tegas.
 */
const buildQuestionCardPrompt = (data: QuestionCardFormData): string => {
    const numQuestions = parseInt(data.numQuestions, 10);

    return `
Anda adalah ahli pendidikan Indonesia yang bertugas membuat soal ujian berkualitas tinggi.
Buat ${numQuestions} butir soal beserta kisi-kisi berdasarkan data berikut:

- Mata Pelajaran: ${data.subject}
- Materi Pokok: ${data.mainMaterial}
- Kelas/Fase: ${data.gradeAndFase}
- Semester: ${data.semester}
- Bentuk Soal: ${data.questionType}
- Jumlah Soal: ${numQuestions}

INSTRUKSI PENTING:
1. Kembalikan HANYA objek JSON yang valid, tanpa teks tambahan sebelum atau sesudah JSON.
2. Jangan gunakan markdown code block (\`\`\`json). Langsung mulai dengan karakter { .
3. Struktur JSON harus persis seperti ini:

{
  "kisiKisi": [
    {
      "no": 1,
      "kompetensi": "...",
      "materi": "...",
      "kelasSmt": "...",
      "levelKognitif": "C1/C2/C3/...",
      "indikator": "...",
      "noSoal": 1,
      "bentukSoal": "${data.questionType}"
    }
  ],
  "soal": [
    {
      "rumusanButirSoal": "1. [Teks soal lengkap. Untuk pilihan ganda, sertakan opsi A, B, C, D, E di dalam string ini]",
      "kunciJawaban": "[Untuk PG: huruf jawabannya saja, mis. 'C'. Untuk uraian: jawaban ideal]",
      "skor": 10
    }
  ]
}

Pastikan:
- Array "kisiKisi" berisi tepat ${numQuestions} item.
- Array "soal" berisi tepat ${numQuestions} item.
- Setiap item "soal" berkorespondensi dengan item "kisiKisi" pada nomor yang sama.
- Level kognitif menggunakan taksonomi Bloom (C1-C6).
- Seluruh konten dalam Bahasa Indonesia.
`;
};

/**
 * Mem-parsing JSON dari respons Claude.
 * Menangani kemungkinan Claude membungkus output dengan markdown code block.
 */
const parseJsonResponse = (raw: string, expectedCount: number): { kisiKisi: any[]; soal: any[] } => {
    // Bersihkan markdown code block jika ada
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    let parsed: any;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        // Coba ekstrak JSON dari dalam teks jika ada
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch {
                throw new Error('AI memberikan respons yang bukan format JSON valid. Coba lagi.');
            }
        } else {
            throw new Error('AI memberikan respons yang bukan format JSON valid. Coba lagi.');
        }
    }

    if (!parsed || !Array.isArray(parsed.kisiKisi) || !Array.isArray(parsed.soal)) {
        throw new Error('Struktur JSON dari AI tidak sesuai. Properti "kisiKisi" dan "soal" tidak ditemukan.');
    }
    if (parsed.kisiKisi.length !== parsed.soal.length) {
        throw new Error(`Jumlah data tidak cocok: ${parsed.kisiKisi.length} kisi-kisi vs ${parsed.soal.length} soal.`);
    }
    if (parsed.kisiKisi.length !== expectedCount) {
        throw new Error(`AI menghasilkan ${parsed.kisiKisi.length} soal, tapi diminta ${expectedCount}. Coba lagi.`);
    }

    return parsed;
};

/**
 * Fungsi utama: generate Kartu Soal & Kisi-Kisi menggunakan Claude.
 */
export const generateQuestionCard = async (
    data: QuestionCardFormData,
    onProgress: (message: string) => void,
    apiKey?: string
): Promise<{ kisiKisi: any[]; soal: any[] }> => {
    const numQuestions = parseInt(data.numQuestions, 10);

    onProgress('Mengirim permintaan ke Claude AI...');

    const prompt = buildQuestionCardPrompt(data);
    let rawResponse = '';

    await callGeminiProxyBuffered(
        prompt,
        'questionCard',
        (chunk: string) => { rawResponse += chunk; },
        undefined,
        apiKey
    );

    if (!rawResponse) {
        throw new Error('AI tidak memberikan respons. Server mungkin sibuk. Silakan coba lagi.');
    }

    onProgress('Menerima data... Memvalidasi struktur JSON...');
    const result = parseJsonResponse(rawResponse, numQuestions);

    onProgress('Semua data berhasil dibuat & divalidasi!');
    return result;
};
