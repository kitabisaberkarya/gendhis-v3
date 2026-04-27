// services/questionCardService.ts
import type { QuestionCardFormData } from '../types';
import { callGeminiProxyBuffered } from './core/geminiCore';
import { Type } from '@google/genai';

/**
 * Membangun prompt tugas yang sederhana. Alih-alih memerintahkan format JSON,
 * prompt ini hanya menjelaskan tugas yang harus dilakukan oleh AI.
 * Pengaturan format JSON akan ditangani oleh `responseSchema`.
 */
const buildQuestionCardTaskPrompt = (data: QuestionCardFormData): string => {
    return `
Task: Create a set of educational materials based on the provided topic for an exam.
This includes two main parts:
1. A structured grid ("kisi-kisi") that outlines the curriculum objectives, cognitive levels, and indicators for each question.
2. A series of questions that precisely correspond to each item in the grid, complete with correct answers.

Ensure the generated content is high-quality, educationally sound, and directly relevant to the input data provided below.

Input Data:
- Main Topic: ${data.mainMaterial}
- Subject: ${data.subject}
- Number of Questions to Generate: ${data.numQuestions}
- Question Format: ${data.questionType}
- Class/Phase: ${data.gradeAndFase}
- Semester: ${data.semester}
`;
};


/**
 * Fungsi utama yang telah dirombak untuk men-generate data Kartu Soal.
 * Menggunakan satu panggilan API tunggal dengan skema JSON terstruktur untuk
 * keandalan dan akurasi maksimal.
 */
export const generateQuestionCard = async (
    data: QuestionCardFormData,
    onProgress: (message: string) => void,
    apiKey?: string
): Promise<{ kisiKisi: any[], soal: any[] }> => {

    const numQuestions = parseInt(data.numQuestions, 10);

    // Mendefinisikan skema atau "cetak biru" untuk output JSON yang kita inginkan.
    // Ini adalah cara canggih untuk memastikan AI memberikan data yang kita harapkan.
    const generationConfig = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                kisiKisi: {
                    type: Type.ARRAY,
                    description: `An array of exactly ${numQuestions} grid items ('kisi-kisi').`,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            no: { type: Type.NUMBER, description: "Sequential number of the grid item, starting from 1." },
                            kompetensi: { type: Type.STRING, description: "The relevant learning competency or objective." },
                            materi: { type: Type.STRING, description: "The specific material covered, should match the main topic." },
                            kelasSmt: { type: Type.STRING, description: "Class and Semester, e.g., 'X / Ganjil'." },
                            levelKognitif: { type: Type.STRING, description: "Cognitive level based on Bloom's Taxonomy (e.g., C1, C2, C3)." },
                            indikator: { type: Type.STRING, description: "A specific and measurable indicator for the question." },
                            noSoal: { type: Type.NUMBER, description: "The corresponding question number." },
                            bentukSoal: { type: Type.STRING, description: "The question format, e.g., 'Pilihan Ganda' or 'Uraian'." },
                        },
                        required: ['no', 'kompetensi', 'materi', 'kelasSmt', 'levelKognitif', 'indikator', 'noSoal', 'bentukSoal']
                    }
                },
                soal: {
                    type: Type.ARRAY,
                    description: `An array of exactly ${numQuestions} questions corresponding to the grid items.`,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            rumusanButirSoal: { type: Type.STRING, description: "The full text of the question, including the question number. For multiple choice, include 5 options (A, B, C, D, E) within this string." },
                            kunciJawaban: { type: Type.STRING, description: "The correct answer. For multiple choice, this MUST be the letter of the option (e.g., 'C'). For essays, it's the ideal answer." },
                            skor: { type: Type.NUMBER, description: "The score for the question, e.g., 20." },
                        },
                        required: ['rumusanButirSoal', 'kunciJawaban', 'skor']
                    }
                }
            },
            required: ['kisiKisi', 'soal']
        }
    };

    // Helper untuk memanggil API baik via proxy (buffered) maupun client-side.
    const callApi = async (prompt: string): Promise<string> => {
        let result = '';
        const onChunk = (chunk: string) => { result += chunk; };
        
        // Logika disederhanakan: Selalu panggil backend proxy yang lebih stabil.
        // Kunci API pengguna (jika ada) akan diteruskan ke backend.
        await callGeminiProxyBuffered(prompt, 'questionCard', onChunk, generationConfig, apiKey);
        
        return result;
    };
    
    // Helper untuk mem-parsing dan memvalidasi struktur JSON dari AI.
    const parseAndValidateJson = (jsonString: string, expectedCount: number): { kisiKisi: any[], soal: any[] } => {
        let parsedData;
        try {
            // Karena AI diinstruksikan mengembalikan JSON, kita bisa langsung parse.
            parsedData = JSON.parse(jsonString);
        } catch (error) {
            console.error("Gagal mem-parsing JSON:", jsonString);
            throw new Error(`AI memberikan respons yang bukan format JSON yang valid. Ini adalah bug yang jarang terjadi. Coba lagi.`);
        }

        // --- Validasi Struktur dan Jumlah ---
        if (!parsedData || !Array.isArray(parsedData.kisiKisi) || !Array.isArray(parsedData.soal)) {
            throw new Error('Struktur JSON dari AI tidak sesuai. Properti "kisiKisi" dan "soal" tidak ditemukan atau bukan array.');
        }
        if (parsedData.kisiKisi.length !== parsedData.soal.length) {
            throw new Error(`Jumlah data tidak cocok. AI menghasilkan ${parsedData.kisiKisi.length} kisi-kisi dan ${parsedData.soal.length} soal. Silakan coba lagi.`);
        }
        if (parsedData.kisiKisi.length !== expectedCount) {
            throw new Error(`Jumlah data yang dihasilkan AI (${parsedData.kisiKisi.length}) tidak sesuai dengan yang diminta (${expectedCount}). Silakan sesuaikan jumlah soal dan coba lagi.`);
        }
        
        return parsedData;
    };
    
    // --- Alur Eksekusi ---
    onProgress('Mengirim permintaan cerdas ke AI...');
    const prompt = buildQuestionCardTaskPrompt(data);
    const fullJsonResponse = await callApi(prompt);

    if (!fullJsonResponse) {
        throw new Error("AI tidak memberikan respons. Ini bisa terjadi karena beban server yang tinggi atau permintaan diblokir. Silakan coba lagi.");
    }

    onProgress('Menerima data... Memvalidasi struktur...');
    const validatedData = parseAndValidateJson(fullJsonResponse, numQuestions);
    
    onProgress('Semua data berhasil dibuat & divalidasi!');
    return validatedData;
};