
// services/rpmService.ts
import type { RpmFormData } from '../types';
import { callGeminiProxyStream } from './core/geminiCore';

// Bagian statis yang tidak perlu dibuat oleh AI.
export const STATIC_RPM_PROFIL_LULUSAN_HTML = `
    <h4 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">Profil Lulusan 8 Dimensi</h4>
    <p style="text-align: justify; margin-bottom: 12px;">Profil Lulusan 8 Dimensi adalah konsep pendidikan yang bertujuan menciptakan lulusan holistik dan berkarakter dengan mengembangkan delapan aspek utama: keimanan dan ketakwaan, kewargaan, penalaran kritis, kreativitas, kolaborasi, kemandirian, kesehatan, dan komunikasi. Konsep ini merupakan pengembangan dari Proyek Penguatan Profil Pelajar Pancasila (P5) dan bertujuan mempersiapkan generasi unggul yang berkarakter Pancasila dan mampu menghadapi tantangan global.</p>
    <p style="margin-bottom: 12px;">Berikut adalah penjelasan masing-masing dimensi:</p>
    <ol style="list-style-type: decimal; padding-left: 20px; margin: 0; text-align: justify;">
        <li style="margin-bottom: 8px;"><strong>Keimanan dan Ketakwaan terhadap Tuhan YME:</strong> Memiliki keyakinan teguh pada Tuhan, menghayati nilai-nilai spiritual, serta mengamalkan nilai-nilai universal seperti kejujuran dan empati dalam kehidupan.</li>
        <li style="margin-bottom: 8px;"><strong>Kewargaan:</strong> Memiliki rasa cinta tanah air, nasionalisme, toleransi terhadap perbedaan, serta menunjukkan kepedulian dan tanggung jawab sosial dalam masyarakat.</li>
        <li style="margin-bottom: 8px;"><strong>Penalaran Kritis:</strong> Mampu berpikir logis, analitis, dan reflektif untuk memahami, mengevaluasi informasi, serta menarik kesimpulan yang mandiri dan akurat.</li>
        <li style="margin-bottom: 8px;"><strong>Kreativitas:</strong> Memiliki kemampuan untuk berpikir inovatif, fleksibel, dan orisininal dalam menghasilkan ide dan solusi yang bermanfaat.</li>
        <li style="margin-bottom: 8px;"><strong>Kolaborasi:</strong> Mampu bekerja sama secara efektif dan gotong royong dengan orang lain untuk mencapai tujuan bersama, serta bertanggung jawab dalam pembagian peran tim.</li>
        <li style="margin-bottom: 8px;"><strong>Kemandirian:</strong> Mampu mengatur dan bertanggung jawab atas proses dan hasil belajar sendiri, berinisiatif, dan mengatasi hambatan untuk menyelesaikan tugas secara tepat.</li>
        <li style="margin-bottom: 8px;"><strong>Kesehatan:</strong> Memiliki kondisi fisik dan mental yang prima dan bugar, serta mampu menjaga keseimbangan kesehatan secara menyeluruh.</li>
        <li style="margin-bottom: 8px;"><strong>Komunikasi:</strong> Mampu menyampaikan ide dan informasi secara jelas dan efektif, serta berinteraksi secara positif dengan pihak lain.</li>
    </ol>
`;

// Helper untuk membangun bagian statis dari dokumen
const buildStaticHeader = (data: RpmFormData, watermarkDataUri: string): string => `
<div style="font-family: 'Times New Roman', Times, serif; color: #000000; background-color: #ffffff; background-image: url('${watermarkDataUri}');">
    <div style="width: 21cm; min-height: 29.7cm; padding: 2.5cm; margin: 1cm auto; border: 1px #D3D3D3 solid; border-radius: 5px; background: white; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 20px;">
            <h2 style="font-size: 16pt; font-weight: bold; margin: 0;">RENCANA PEMBELAJARAN MENDALAM (RPM)</h2>
            <h3 style="font-size: 14pt; font-weight: bold; margin: 5px 0;">TAHUN PELAJARAN ${data.academicYear}</h3>
            <h3 style="font-size: 14pt; font-weight: bold; margin: 5px 0;">MATA PELAJARAN: ${data.subject.toUpperCase()}</h3>
        </div>
        <h3 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">A. IDENTITAS</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12pt;">
            <tbody>
                <tr><td style="padding: 4px; width: 30%;">Satuan Pendidikan</td><td style="width: 70%;">: ${data.schoolName}</td></tr>
                <tr><td style="padding: 4px;">Kelas/Fase</td><td>: ${data.grade} / Fase ${data.fase}</td></tr>
                <tr><td style="padding: 4px;">Mata Pelajaran</td><td>: ${data.subject}</td></tr>
                <tr><td style="padding: 4px;">Alokasi Waktu</td><td>: ${data.timeAllocation}</td></tr>
                <tr><td style="padding: 4px;">Tahun Ajaran</td><td>: ${data.academicYear}</td></tr>
                <tr><td style="padding: 4px;">Penyusun</td><td>: ${data.teacherName}</td></tr>
            </tbody>
        </table>
        <h3 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">B. KOMPETENSI AWAL</h3>
        <p style="text-align: justify;">Peserta didik diharapkan telah memiliki pemahaman dasar mengenai konsep-konsep awal yang berkaitan dengan ${data.mainMaterial}.</p>
        <h3 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">C. PROFIL PELAJAR PANCASILA</h3>
        <p style="text-align: justify;">Modul ini mendorong pengembangan dimensi <strong>Bernalar Kritis</strong> dalam menganalisis informasi dan <strong>Kreatif</strong> dalam menghasilkan solusi atau karya.</p>
        <h3 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">D. SARANA DAN PRASARANA</h3>
        <p style="text-align: justify;">Laptop/Komputer, Proyektor LCD, Koneksi Internet, Perangkat Ajar, dan Buku Teks yang relevan.</p>
        <h3 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">E. TARGET PESERTA DIDIK</h3>
        <p style="text-align: justify;">Peserta didik reguler/tipikal tanpa kesulitan belajar dan mampu memahami materi ajar dengan baik.</p>
        <h3 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">F. MODEL PEMBELAJARAN</h3>
        <p style="text-align: justify;">Model pembelajaran yang digunakan adalah <strong>Project Based Learning (PjBL)</strong> yang berpusat pada siswa untuk melakukan investigasi mendalam terhadap suatu topik.</p>
        <h3 style="font-size: 14pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px; border-top: 1px solid #ccc; padding-top: 20px;">KOMPONEN INTI</h3>
`;

const buildStaticFooter = (data: RpmFormData, watermarkText: string): string => `
        <table style="width: 100%; margin-top: 50px; border-collapse: collapse; text-align: center; font-size: 12pt;">
            <tbody>
                <tr>
                    <td style="width: 50%; padding: 10px;">Mengetahui,</td>
                    <td style="width: 50%; padding: 10px;">${data.signaturePlaceDate}</td>
                </tr>
                <tr>
                    <td style="padding: 10px;">Kepala Sekolah</td>
                    <td style="padding: 10px;">Guru Mata Pelajaran</td>
                </tr>
                <tr>
                    <td style="height: 80px;">&nbsp;</td>
                    <td style="height: 80px;">&nbsp;</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; text-decoration: underline;">${data.principalName}</td>
                    <td style="font-weight: bold; text-decoration: underline;">${data.teacherName}</td>
                </tr>
                <tr>
                    <td>NIP/NPA. ${data.principalId}</td>
                    <td>NIP/NPA. ${data.teacherId}</td>
                </tr>
            </tbody>
        </table>
        <div style="font-size: 9pt; font-style: italic; color: #555555; text-align: center; margin-top: 48px; padding-top: 16px; border-top: 1px dashed #cccccc;">${watermarkText}</div>
    </div>
</div>
`;

// --- PROMPT BARU YANG LEBIH FOKUS ---

// Langkah 1: Membuat fondasi pedagogis (Tujuan, Pemahaman, Pertanyaan).
const buildStep1Prompt = (data: RpmFormData): string => `
TASK: Generate the core pedagogical components for a "Modul Ajar" (RPM) in HTML format.
**CRITICAL RULES:**
1.  **HTML ONLY & INLINE CSS.** Do not use Markdown.
2.  Follow the structure precisely. Use standard fonts like 'Times New Roman' or 'Arial'.
3.  Be professional, concise, and pedagogically sound.

**INPUT DATA:**
- Main Topic: ${data.mainMaterial}
- Subject: ${data.subject}

**DOCUMENT STRUCTURE (Generate ONLY these sections):**
1.  **A. Tujuan Pembelajaran:** Create 2-3 specific, measurable, achievable, relevant, and time-bound (SMART) learning objectives for the main topic.
2.  **B. Pemahaman Bermakna:** Explain the long-term, real-world benefits of learning this material.
3.  **C. Pertanyaan Pemantik:** Write 2-3 insightful, thought-provoking questions to spark student curiosity.

**PROCEED. Generate the HTML for these three sections now.**
`;

// Langkah 2: Membuat KKTP, Skenario Rinci, Rubrik, dan Refleksi.
const buildStep2Prompt = (data: RpmFormData, step1Result: string): string => `
TASK: Generate the **KKTP**, **Detailed Meeting Breakdown**, **Assessment Rubrics**, and **Reflection** sections for a "Modul Ajar" in HTML format.

**CONTEXT (FROM PREVIOUS STEP):**
${step1Result}

**CRITICAL RULES:**
1.  **HTML ONLY & INLINE CSS.**
2.  **TABLES MUST HAVE BORDERS.** Apply \`border: 1px solid #cccccc;\` to every \`th\` and \`td\`. Headers (\`th\`) must have a light grey background.
3.  **MEETING BREAKDOWN (CRUCIAL):**
    - READ the Time Allocation: "${data.timeAllocation}".
    - IF it says multiple JPs (e.g. 6 JP, 12 JP), you **MUST** split the activities into multiple meetings (Pertemuan 1, Pertemuan 2, dst).
    - Do NOT squeeze everything into one meeting if the time allows for more.
    - Example: 6 JP = 2 or 3 Meetings.
4.  **RUBRIC (CRUCIAL):**
    - You MUST create a detailed HTML TABLE for the Assessment Rubric.
    - Columns: Aspek Penilaian, Skor 4 (Sangat Baik), Skor 3 (Baik), Skor 2 (Cukup), Skor 1 (Kurang).
    - Do not just list the assessment types.

**INPUT DATA:**
- Main Topic: ${data.mainMaterial}
- Time Allocation: ${data.timeAllocation}

**DOCUMENT STRUCTURE (Generate ONLY these sections in order):**

1.  **D. KKTP (Kriteria Ketercapaian Tujuan Pembelajaran):**
    - Create a professional table defining the success criteria intervals (e.g., 0-60: Perlu Bimbingan, 61-75: Cukup, 76-85: Baik, 86-100: Sangat Baik).
    - Provide a description of student behavior for each interval.

2.  **E. Kegiatan Pembelajaran (Rincian Pertemuan):**
    - **PERTEMUAN KE-1:**
        Create a detailed table. Columns: "Tahapan" (Pendahuluan, Inti, Penutup), "Deskripsi Kegiatan (Guru & Siswa)", "Alokasi Waktu".
    - **PERTEMUAN KE-2 (dan seterusnya):**
        Create separate sections and tables for subsequent meetings based on the Time Allocation. Ensure a logical flow from one meeting to the next.

3.  **F. Asesmen dan Rubrik Penilaian:**
    - **Jenis Asesmen:** List Diagnostik, Formatif, Sumatif.
    - **Instrumen Rubrik Penilaian:** Create the Detailed Table as requested above.

4.  **G. Refleksi:**
    - **Refleksi Guru:** List 3-4 introspection questions.
    - **Refleksi Peserta Didik:** List 3-4 reflection questions for students.

**PROCEED. Generate the HTML for these sections now.**
`;

// Langkah 3: Membuat lampiran.
const buildStep3Prompt = (data: RpmFormData): string => `
TASK: Generate the appendices (Lampiran & DPL) for a "Modul Ajar" in HTML format.
**CRITICAL RULES:**
1.  **HTML ONLY & INLINE CSS.**
2.  Be professional and relevant to the main topic.

**INPUT DATA:**
- Main Topic: ${data.mainMaterial}

**DOCUMENT STRUCTURE (Generate ONLY these sections):**
1.  **LAMPIRAN & DPL (Daftar Pustaka & Lampiran):**
    -   **A. Lembar Kerja Peserta Didik (LKPD):** Create a worksheet with 2-3 questions/tasks.
    -   **B. Bahan Bacaan Guru dan Peserta Didik:** List 2-3 reference materials.
    -   **C. Glosarium:** Define 3-4 key terms.
    -   **D. Daftar Pustaka (DPL):** Create 2-3 bibliographic entries in APA/MLA format.

**PROCEED. Generate the HTML for the appendices now.**
`;

/**
 * Orkestrator utama untuk generate RPM dengan arsitektur multi-langkah.
 */
export const generateRpm = async (
    data: RpmFormData,
    watermarkText: string,
    watermarkDataUri: string,
    onChunk: (chunk: string) => void,
    onProgress: (message: string) => void,
    apiKey?: string
): Promise<string> => {
    
    // --- Timeout Guard ---
    const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Proses generate memakan waktu terlalu lama (batas waktu 3 menit). Silakan coba lagi.')), 180000)
    );

    const generationLogic = async (): Promise<string> => {
        // Helper untuk memanggil satu langkah, mengakumulasi hasil, dan memvalidasinya.
        const callGeneratorStep = async (prompt: string): Promise<string> => {
            let accumulatedResult = '';
            await callGeminiProxyStream(prompt, 'rpm', (chunk) => {
                accumulatedResult += chunk;
            }, apiKey);
            
            // Validasi sederhana untuk setiap langkah
            if (!accumulatedResult || accumulatedResult.trim().length < 50) {
                 throw new Error("AI gagal menghasilkan salah satu bagian penting dari dokumen. Ini bisa terjadi karena topik yang terlalu kompleks atau beban server tinggi. Coba sederhanakan 'Materi Pokok' Anda dan coba lagi.");
            }
            return accumulatedResult;
        };

        onChunk('CLEAR'); // Memberi sinyal pada UI untuk membersihkan hasil sebelumnya.
        let fullHtml = '';
        
        // Rakit dan stream bagian statis header
        const headerHtml = buildStaticHeader(data, watermarkDataUri);
        onChunk(headerHtml);
        fullHtml += headerHtml;

        // --- Langkah 1: Fondasi Pedagogis ---
        onProgress('Langkah 1 dari 3: Merancang fondasi pedagogis (Tujuan, Pemahaman, Pertanyaan)...');
        const step1Prompt = buildStep1Prompt(data);
        const step1Html = await callGeneratorStep(step1Prompt);
        onChunk(step1Html);
        fullHtml += step1Html;

        // --- Langkah 2: Skenario, KKTP, Rubrik, Refleksi ---
        onProgress('Langkah 2 dari 3: Menyusun Rincian Pertemuan, KKTP, Rubrik, dan Refleksi...');
        const step2Prompt = buildStep2Prompt(data, step1Html); // Gunakan hasil Langkah 1 sebagai konteks
        const step2Html = await callGeneratorStep(step2Prompt);
        onChunk(step2Html);
        fullHtml += step2Html;
        
        // Sisipkan placeholder untuk diganti di frontend
        const profilPlaceholder = `<!-- PROFIL_LULUSAN_PLACEHOLDER -->`;
        onChunk(profilPlaceholder);
        fullHtml += profilPlaceholder;

        // --- Langkah 3: Lampiran ---
        onProgress('Langkah 3 dari 3: Menyiapkan DPL (Daftar Pustaka & Lampiran)...');
        const step3Prompt = buildStep3Prompt(data);
        const step3Html = await callGeneratorStep(step3Prompt);
        onChunk(step3Html);
        fullHtml += step3Html;
        
        // Rakit dan stream bagian statis footer
        const footerHtml = buildStaticFooter(data, watermarkText);
        onChunk(footerHtml);
        fullHtml += footerHtml;

        onProgress('Dokumen berhasil dirakit!');
        return fullHtml;
    };

    // Jalankan logika generate bersamaan dengan timeout guard
    return Promise.race([generationLogic(), timeoutPromise]);
};
