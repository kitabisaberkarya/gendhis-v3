// services/rpsService.ts
import type { RpsFormData } from '../types';
import { callGeminiProxyStream } from './core/geminiCore';

const buildRpsPrompt = (data: RpsFormData): string => {
    const logoHtml = data.logoUrl 
        ? `<img src="${data.logoUrl}" alt="Logo Universitas" style="width: 80px; height: auto;"/>` 
        : '<span></span>';

    return `
Anda adalah asisten ahli dalam pembuatan "Rencana Pembelajaran Semester" (RPS) untuk standar pendidikan tinggi di Indonesia. Tugas Anda adalah menghasilkan dokumen HTML lengkap, profesional, dan terstruktur berdasarkan data yang diberikan.

**Aturan Emas (SANGAT PENTING):**
1.  **GAYA INLINE WAJIB:** Semua pemformatan (warna, border, padding, font, dll.) HARUS menggunakan atribut \`style\` inline langsung di dalam setiap tag HTML. JANGAN gunakan tag \`<style>\` atau kelas CSS.
2.  **OUTPUT HTML TUNGGAL:** Seluruh output harus berupa satu blok kode HTML yang valid. Jangan gunakan Markdown.
3.  **TABEL KONTEN:** Semua tabel HARUS memiliki grid penuh (\`border: 1px solid #cccccc;\` pada setiap \`th\` dan \`td\`). Header tabel (\`th\`) harus memiliki latar belakang abu-abu (\`background-color: #f1f5f9;\`) dan teks di tengah.
4.  **FORMAT KERTAS A4:** Seluruh konten harus dibungkus dalam satu div utama dengan gaya: \`<div style="width: 21cm; min-height: 29.7cm; padding: 2cm; margin: 1cm auto; border: 1px #D3D3D3 solid; border-radius: 5px; background: white; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);">\`
5.  **FONT:** Gunakan 'Times New Roman' dengan ukuran font utama 12pt.

**Data Input:**
- Nama Universitas: ${data.universityName}
- Fakultas: ${data.faculty}
- Program Studi: ${data.studyProgram}
- Nama Mata Kuliah: ${data.courseName}
- Kode Mata Kuliah: ${data.courseCode}
- Rumpun MK: ${data.courseGroup}
- Bobot (sks): ${data.courseCredits}
- Semester: ${data.semester}
- Tanggal Penyusunan: ${data.dateOfPreparation}
- Pengembang RPS: ${data.rpsDeveloper}
- Koordinator RMK: ${data.rmkCoordinator}
- Ketua Program Studi: ${data.headOfProgram}
- Model Pembelajaran Utama: ${data.learningModel}
- URL Logo: ${data.logoUrl || 'Tidak ada'}

**Instruksi Pembuatan Dokumen (Ikuti Urutan Ini dengan Seksama):**
Mulai dengan div pembungkus A4.
1.  **HEADER DOKUMEN:** Tabel kop surat dengan 3 kolom (logo, teks universitas, kosong).
2.  **IDENTITAS & OTORISASI:** Tabel identitas MK dan tabel otorisasi untuk tanda tangan.
3.  **CPL (CAPAIAN PEMBELAJARAN LULUSAN):** Bagian "1. Capaian Pembelajaran (CP)" dengan sub-bagian A (CPL-PRODI), B (CPMK), dan C (Sub-CPMK).
4.  **DESKRIPSI MATA KULIAH:** Bagian "2. Deskripsi Singkat Mata Kuliah".
5.  **MATERI PEMBELAJARAN:** Bagian "3. Bahan Kajian / Materi Pembelajaran".
6.  **DAFTAR PUSTAKA:** Bagian "4. Pustaka".
7.  **MEDIA PEMBELAJARAN:** Bagian "5. Media Pembelajaran".
8.  **TEAM TEACHING:** Bagian "6. Dosen Pengampu".
9.  **ASESMEN:** Bagian "7. Asesmen Hasil Belajar".
10. **RENCANA PEMBELAJARAN MINGGUAN:** Bagian "8. Rencana Kegiatan Pembelajaran Mingguan". Ini adalah tabel paling detail untuk 16 pertemuan, termasuk UTS dan UAS. Pastikan kontennya logis dan terhubung dengan bagian CPL dan Materi.
`;
};

export const generateRps = async (
    data: RpsFormData,
    onChunk: (chunk: string) => void,
    apiKey?: string
): Promise<void> => {
    const prompt = buildRpsPrompt(data);
    // Logika disederhanakan: Selalu panggil backend proxy yang lebih stabil.
    // Kunci API pengguna (jika ada) akan diteruskan ke backend.
    await callGeminiProxyStream(prompt, 'rps', onChunk, apiKey);
};