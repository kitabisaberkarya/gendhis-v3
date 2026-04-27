
// services/ckService.ts
import type { CkFormData } from '../types';
import { callGeminiProxyStream } from './core/geminiCore';

const buildCkPrompt = (data: CkFormData): string => {
    return `
Anda adalah seorang ahli pendidikan dengan spesialisasi "Deep Learning" dan standar penilaian Kurikulum Merdeka di Indonesia. 
Tugas Anda adalah menghasilkan laporan "Capaian Kompetensi (CK)" yang mendalam, naratif, dan inspiratif untuk seorang siswa.

**KONSEP UTAMA (DEEP LEARNING):**
Laporan harus mencakup narasi yang menunjukkan proses belajar siswa, bukan sekadar nilai akhir. Gunakan bahasa yang santun, memotivasi, dan profesional.

**DATA INPUT:**
- Nama Siswa: ${data.studentName} (ID: ${data.studentId})
- Sekolah: ${data.schoolName}
- Mata Pelajaran: ${data.subject}
- Kelas: ${data.grade}
- Semester: ${data.semester}
- Elemen Kompetensi Utama: ${data.competencyElement}
- Predikat Capaian: ${data.achievementLevel}

**ATURAN KRITIS OUTPUT:**
1. **HTML ONLY.** Jangan gunakan Markdown. Gunakan styling inline.
2. **FORMAT A4.** Bungkus dalam div: <div style="width: 21cm; padding: 2cm; margin: auto; background: white; font-family: Arial;">
3. **TABEL PROFESIONAL.** Semua tabel harus memiliki border 1px solid #333 dan header berwarna #f59e0b (Amber).
4. **ISI DOKUMEN (Ikuti Urutan):**
   - Judul Besar: "LAPORAN CAPAIAN KOMPETENSI SISWA (DEEP LEARNING)"
   - Tabel Identitas Siswa & Akademik.
   - Narasi Capaian (SANGAT PENTING): Tulis minimal 2-3 paragraf narasi yang mendalam tentang pencapaian siswa pada elemen '${data.competencyElement}'. Hubungkan dengan predikat '${data.achievementLevel}'. Jelaskan kekuatan siswa dan apa yang masih perlu ditingkatkan dalam konteks Deep Learning (berpikir kritis, kreatif, kolaborasi).
   - Tabel Rekomendasi/Saran untuk Orang Tua: Berikan 2-3 saran nyata untuk mendukung perkembangan siswa di rumah.
   - Area Tanda Tanggan: Guru Mata Pelajaran dan Mengetahui Orang Tua/Wali.

Pastikan hasil akhirnya terlihat seperti dokumen resmi yang sangat berkualitas tinggi.
`;
};

export const generateCk = async (
    data: CkFormData,
    onChunk: (chunk: string) => void,
    apiKey?: string
): Promise<void> => {
    const prompt = buildCkPrompt(data);
    await callGeminiProxyStream(prompt, 'ck' as any, onChunk, apiKey);
};
