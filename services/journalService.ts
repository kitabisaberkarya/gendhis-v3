
import type { JournalFormData } from '../types';
import { callGeminiProxyStream } from './core/geminiCore';

const buildJournalPrompt = (data: JournalFormData): string => {
    return `
Anda adalah asisten administrasi guru profesional di Indonesia. Tugas Anda adalah merangkum input dari guru menjadi sebuah "Jurnal Digital Guru" atau "Jurnal Mengajar" yang sangat rapi, sistematis, dan bermakna dalam format HTML.

**ATURAN UTAMA:**
1. **OUTPUT HANYA HTML.** Jangan gunakan Markdown.
2. **STYLING INLINE.** Gunakan atribut style pada tag HTML. Border tabel: 1px solid #333.
3. **TABEL.** Gunakan tabel untuk menyajikan data identitas dan konten utama jurnal.
4. **FONT.** Gunakan 'Arial' atau 'Times New Roman' ukuran 11pt-12pt.

**DATA INPUT:**
- Sekolah: ${data.schoolName}
- Guru: ${data.teacherName}
- Mata Pelajaran: ${data.subject}
- Kelas: ${data.grade}
- Tanggal: ${data.date}
- Materi: ${data.material}
- Situasi Kelas: ${data.classSituation}
- Kemajuan Siswa: ${data.studentProgress}
- Refleksi Mandiri: ${data.reflection}

**INSTRUKSI STRUKTUR DOKUMEN:**
1. **JUDUL:** "JURNAL HARIAN MENGAJAR GURU".
2. **TABEL IDENTITAS:** Sajikan Nama Sekolah, Nama Guru, Mapel, Kelas, dan Tanggal.
3. **TABEL KONTEN:** 
   - Kolom Materi: Rangkum materi pokok secara profesional.
   - Kolom Catatan Kejadian: Olah narasi "Situasi Kelas" menjadi poin-poin observasi pedagogis yang cerdas.
   - Kolom Kemajuan/Hambatan: Olah "Kemajuan Siswa" menjadi laporan deskriptif.
   - Kolom Refleksi/Tindak Lanjut: Berikan saran aksi nyata untuk pertemuan berikutnya berdasarkan input "Refleksi Mandiri".
4. **TANDA TANGAN:** Tambahkan area Mengetahui Kepala Sekolah dan Guru Pengampu di bagian bawah.

Pastikan bahasanya baku (formal), santun, dan menunjukkan kualitas profesionalisme guru yang mendalam.
`;
};

export const generateJournal = async (
    data: JournalFormData,
    onChunk: (chunk: string) => void,
    apiKey?: string
): Promise<void> => {
    const prompt = buildJournalPrompt(data);
    await callGeminiProxyStream(prompt, 'journal' as any, onChunk, apiKey);
};
