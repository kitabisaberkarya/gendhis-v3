// services/atpService.ts
import type { AtpFormData } from '../types';
import { callGeminiProxyStream } from './core/geminiCore';

const buildAtpPrompt = (data: AtpFormData): string => {
    return `
Anda adalah seorang ahli desainer kurikulum dan instruksional untuk sistem pendidikan Indonesia, khususnya dalam merancang Alur Tujuan Pembelajaran (ATP) untuk Kurikulum Merdeka.
Tugas Anda adalah untuk menghasilkan dokumen ATP yang lengkap, profesional, dan memiliki desain modern berdasarkan data yang diberikan.

**ATURAN KRITIS (WAJIB DIIKUTI):**
1.  **HANYA HTML:** Seluruh output HARUS berupa satu blok kode HTML yang valid. Jangan gunakan Markdown atau format lain.
2.  **CSS WAJIB INLINE:** Semua styling (warna, border, padding, font, dll.) HARUS menggunakan atribut \`style\` langsung di dalam setiap tag HTML. Gunakan font standar seperti 'Times New Roman' atau 'Arial'.
3.  **DESAIN MODERN:** Gunakan desain yang bersih dan profesional. Setiap judul bagian utama (A, B, C, D) harus memiliki header yang menonjol dengan latar belakang berwarna dan teks putih.
4.  **TABEL PROFESIONAL:** Semua tabel HARUS memiliki grid penuh (\`border: 1px solid #cccccc;\` pada setiap \`th\` dan \`td\`). Header tabel (\`th\`) harus memiliki latar belakang abu-abu gelap (\`background-color: #f3f4f6;\`) dan teks tebal.
5.  **FORMAT KERTAS A4:** Seluruh konten harus dibungkus dalam satu div utama dengan gaya berikut untuk mensimulasikan kertas A4: \`<div style="width: 21cm; min-height: 29.7cm; padding: 2cm; margin: 1cm auto; border: 1px #D3D3D3 solid; border-radius: 5px; background: white; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); font-family: 'Arial', sans-serif; color: #333;">\`

**DATA INPUT:**
- Penyusun: ${data.penyusun}
- Sekolah: ${data.sekolah}
- Mata Pelajaran: ${data.mataPelajaran}
- Fase: ${data.fase}
- Kelas: ${data.kelas}
- Kepala Sekolah: ${data.kepalaSekolah}
- Guru Pengampu: ${data.guruPengampu}
- Kota & Tanggal TTD: ${data.kotaTanggalTtd}

**STRUKTUR DOKUMEN (Ikuti urutan dan format ini dengan SANGAT TELITI):**

**JUDUL UTAMA:**
- Judul: "ALUR TUJUAN PEMBELAJARAN (ATP) FASE ${data.fase.toUpperCase()}"
- Sub-judul: "MATA PELAJARAN ${data.mataPelajaran.toUpperCase()}"
- Buat ini di tengah dengan ukuran font yang besar dan tebal.

**A. INFORMASI**
- Gunakan header modern: \`<h3 style="background-color: #4A90E2; color: white; padding: 8px 12px; border-radius: 6px; margin-top: 20px;">A. INFORMASI</h3>\`
- Buat tabel 2 kolom (Label, Isi) untuk data: Penyusun, Sekolah, Mata Pelajaran, Fase, Kelas.

**B. RASIONAL**
- Gunakan header modern: \`<h3 style="background-color: #50E3C2; color: white; padding: 8px 12px; border-radius: 6px; margin-top: 20px;">B. RASIONAL</h3>\`
- Tulis 1-2 paragraf rasional yang relevan dan profesional untuk mata pelajaran tersebut, jelaskan pentingnya dan keterampilan yang akan dikembangkan.

**C. DOMAIN CP**
- Gunakan header modern: \`<h3 style="background-color: #F5A623; color: white; padding: 8px 12px; border-radius: 6px; margin-top: 20px;">C. DOMAIN CP</h3>\`
- Tampilkan Fase dan Domain CP.
- Di bawahnya, buat sub-bagian untuk setiap "Elemen" yang relevan (misalnya: Elemen Keterampilan Konsep, Elemen Keterampilan Berpikir, Elemen Kesadaran, Elemen Penelitian).
- Setiap "Elemen" harus memiliki deskripsi singkat diikuti oleh daftar poin "Capaian Pembelajaran".

**D. ALUR DAN TUJUAN PEMBELAJARAN**
- Gunakan header modern: \`<h3 style="background-color: #BD10E0; color: white; padding: 8px 12px; border-radius: 6px; margin-top: 20px;">D. ALUR DAN TUJUAN PEMBELAJARAN</h3>\`
- Ini adalah bagian paling penting. Buat tabel yang komprehensif dengan kolom: **Materi Esensial**, **Elemen**, **Sub Elemen**, dan **Tujuan Pembelajaran**.
- Isi tabel dengan minimal 6-8 baris materi esensial yang logis dan berurutan untuk mata pelajaran yang diberikan. Pastikan setiap baris terisi lengkap dan saling berhubungan.

**HALAMAN PENGESAHAN**
- Buat layout tanda tangan yang profesional untuk "Kepala Sekolah" dan "Guru Pengampu" menggunakan tabel. Sertakan nama lengkap dan tempat untuk NIP/NPA.
- Pastikan ada "Mengetahui" dan kota & tanggal TTD.

Mulai proses generate sekarang. Pastikan outputnya adalah satu blok HTML yang utuh dan sesuai dengan semua instruksi.
`;
};

export const generateAtp = async (
    data: AtpFormData,
    onChunk: (chunk: string) => void,
    apiKey?: string
): Promise<void> => {
    const prompt = buildAtpPrompt(data);
    await callGeminiProxyStream(prompt, 'atp', onChunk, apiKey);
};
