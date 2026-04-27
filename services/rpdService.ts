// services/rpdService.ts
import type { RpdFormData } from '../types';
import { callGeminiProxyStream } from './core/geminiCore';

const buildRpdPrompt = (data: RpdFormData): string => {
    return `
Anda adalah asisten ahli dalam pembuatan "Rencana Pembelajaran Digital" (RPD) untuk sesi microteaching. Tugas Anda adalah menghasilkan dokumen HTML yang lengkap dan profesional.

**Aturan Emas (SANGAT PENTING):**
1.  **GAYA INLINE WAJIB:** Semua pemformatan HARUS menggunakan atribut \`style\` inline.
2.  **OUTPUT HTML TUNGGAL:** Seluruh output harus berupa satu blok kode HTML yang valid.
3.  **TABEL KONTEN:** Semua tabel HARUS memiliki grid penuh (\`border: 1px solid #cccccc;\` pada \`th\` dan \`td\`). Header tabel harus berlatar belakang abu-abu.
4.  **FONT:** Gunakan 'Times New Roman' ukuran 12pt.

**Data Input:**
- Nama Sekolah: ${data.schoolName}
- Nama Guru Praktikan: ${data.teacherName}
- Mata Pelajaran: ${data.subject}
- Kelas / Semester: ${data.gradeAndSemester}
- Alokasi Waktu: ${data.timeAllocation}
- Topik Utama: ${data.mainTopic}
- Nama Kepala Sekolah: ${data.principalName}
- Nama Waka Kurikulum: ${data.curriculumVicePrincipalName}
- Tempat & Tanggal TTD: ${data.signaturePlaceDate}

**Instruksi Pembuatan Dokumen (Ikuti Urutan Ini):**
Mulai dengan div pembungkus utama.
1.  **JUDUL DOKUMEN:** "RENCANA PEMBELAJARAN DIGITAL (RPD)" dan "MICROTEACHING".
2.  **IDENTITAS:** Tabel identitas (Nama Sekolah, Mapel, Kelas/Semester, Topik, Alokasi Waktu).
3.  **KOMPONEN INTI:** Bagian A (Tujuan Pembelajaran), B (IKTP), C (Profil Pelajar Pancasila), D (Model, Pendekatan, Metode), E (Media), F (Sumber Belajar).
4.  **LANGKAH-LANGKAH PEMBELAJARAN:** Tabel detail dengan fase Pendahuluan, Inti (jabarkan sintaks model), dan Penutup. Pastikan total alokasi waktu sesuai.
5.  **PENILAIAN PEMBELAJARAN (ASESMEN):** Tabel penilaian untuk ranah Pengetahuan, Keterampilan, dan Sikap.
6.  **LEMBAR PENGESAHAN:** Tabel tanda tangan untuk Kepala Sekolah, Waka Kurikulum, dan Guru Praktikan.
`;
};

export const generateRpd = async (
    data: RpdFormData,
    onChunk: (chunk: string) => void,
    apiKey?: string
): Promise<void> => {
    const prompt = buildRpdPrompt(data);
    // Logika disederhanakan: Selalu panggil backend proxy yang lebih stabil.
    // Kunci API pengguna (jika ada) akan diteruskan ke backend.
    await callGeminiProxyStream(prompt, 'rpd', onChunk, apiKey);
};