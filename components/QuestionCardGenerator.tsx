
import React, { useState, useCallback, useRef } from 'react';
import type { QuestionCardFormData } from '../types';
import { generateQuestionCard } from '../services/questionCardService';
import { handleGenerationError } from '../services/core/geminiCore';
import InputField from './InputField';
import Spinner from './Spinner';
import { ArrowLeftIcon, MagicWandIcon } from './IconComponents';
import QuestionCardPreview from './QuestionCardPreview';
import { logUsage, saveGeneratedDocument } from '../services/supabaseService';
import GenerationStatusModal from './GenerationStatusModal';

interface QuestionCardGeneratorProps {
    onBack: () => void;
    isClientApiKeyEnabled: boolean;
    isPaymentSystemEnabled: boolean;
    documentPrice: number;
    onTopUpRequest: () => void;
}

// --- TEMPLATE KONTEN ---
const TEMPLATE_PG = `Q: Siapakah proklamator kemerdekaan Indonesia?
A. Soeharto
B. B.J. Habibie
C. Ir. Soekarno
D. Megawati
E. Joko Widodo
Kunci: C
Kompetensi: Menganalisis sejarah kemerdekaan
Materi: Tokoh Proklamasi
Indikator: Peserta didik dapat menyebutkan nama tokoh proklamator
Level: C1
---
Q: Tanggal berapakah Indonesia merdeka?
A. 17 Agustus 1945
B. 18 Agustus 1945
C. 19 Agustus 1945
D. 20 Agustus 1945
E. 21 Agustus 1945
Kunci: A
Kompetensi: Menganalisis sejarah kemerdekaan
Materi: Peristiwa Proklamasi
Indikator: Peserta didik dapat menentukan tanggal kemerdekaan
Level: C1`;

const TEMPLATE_ESSAY = `Q: Jelaskan penyebab terjadinya hujan asam!
Jawaban: Hujan asam disebabkan oleh belerang (sulfur) yang merupakan pengotor dalam bahan bakar fosil serta nitrogen di udara yang bereaksi dengan oksigen membentuk sulfur dioksida dan nitrogen oksida.
Kompetensi: Menganalisis perubahan lingkungan
Materi: Pencemaran Lingkungan
Indikator: Peserta didik dapat menjelaskan proses hujan asam
Level: C2
---
Q: Sebutkan 3 dampak pemanasan global!
Jawaban: 1. Mencairnya es di kutub. 2. Naiknya permukaan air laut. 3. Perubahan iklim yang ekstrim.
Kompetensi: Menganalisis perubahan lingkungan
Materi: Pemanasan Global
Indikator: Peserta didik dapat menyebutkan dampak pemanasan global
Level: C1`;

/**
 * Membuat Data URI untuk gambar watermark dinamis menggunakan Canvas.
 */
const createWatermarkDataUri = (text: string): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 500;
    canvas.height = 400;

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.07)'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 4);

    for (let y = -200; y < 200; y += 80) {
        for (let x = -300; x < 300; x += 150) {
            ctx.fillText(text, x, y);
        }
    }
    
    return canvas.toDataURL();
};

/**
 * Merakit dokumen HTML lengkap dari data JSON.
 */
const formatDocumentFromJSON = (
    generatedData: { kisiKisi: any[], soal: any[] },
    formData: QuestionCardFormData,
    watermarkText: string,
    watermarkDataUri: string
): string => {
    const { kisiKisi, soal } = generatedData;

    const escapeHtml = (text: string | number | undefined) => {
        if (text === undefined || text === null) return '';
        const str = String(text);
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\n/g, '<br>');
    };

    const kisiKisiPageHtml = `
    <div class="kisi-kisi-page" style="width: 21cm; min-height: 29.7cm; padding: 1.5cm; margin: 0 auto 1cm auto; page-break-after: always; box-sizing: border-box; display: flex; flex-direction: column; background: white; border: 1px solid #ddd; font-family: 'Times New Roman', Times, serif;">
        <table style="width: 100%; border-bottom: 3px solid black; border-collapse: collapse; margin-bottom: 20px;">
            <tbody>
                <tr>
                    <td style="width: 15%; text-align: left; padding: 5px;">
                        <img src="https://res.cloudinary.com/dt1nrarpq/image/upload/v1758170253/Logo_Kemendikbud2_w8johf.png" style="height: 80px;" alt="Logo Kemendikbud">
                    </td>
                    <td style="width: 85%; text-align: center; padding: 5px;">
                        <h3 style="font-size: 16pt; font-weight: bold; margin: 0;">KISI-KISI PENYUSUNAN SOAL</h3>
                        <p style="font-size: 12pt; margin: 5px 0;">Tahun Pelajaran: ${escapeHtml(formData.academicYear)}</p>
                    </td>
                </tr>
            </tbody>
        </table>

        <table style="width: 100%; font-size: 11pt; margin-bottom: 20px; border-collapse: collapse;">
            <tbody>
                <tr>
                    <td style="padding: 2px 0; width: 15%;">Jenis Sekolah</td><td style="width: 35%;">: ${escapeHtml(formData.schoolName)}</td>
                    <td style="padding: 2px 0; width: 15%;">Mata Pelajaran</td><td style="width: 35%;">: ${escapeHtml(formData.subject)}</td>
                </tr>
                 <tr>
                    <td style="padding: 2px 0;">Kelas / Fase</td><td>: ${escapeHtml(formData.gradeAndFase)}</td>
                    <td style="padding: 2px 0;">Kurikulum</td><td>: ${escapeHtml(formData.curriculum)}</td>
                </tr>
                 <tr>
                    <td style="padding: 2px 0;">Jumlah Soal</td><td>: ${soal.length}</td>
                    <td style="padding: 2px 0;">Bentuk Soal</td><td>: ${escapeHtml(formData.questionType)}</td>
                </tr>
            </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; border: 1px solid #333;">
            <thead>
                <tr style="background-color: #e2e8f0; font-weight: bold; text-align: center;">
                    <th style="border: 1px solid #333; padding: 8px;">No</th>
                    <th style="border: 1px solid #333; padding: 8px;">Kompetensi</th>
                    <th style="border: 1px solid #333; padding: 8px;">Materi</th>
                    <th style="border: 1px solid #333; padding: 8px;">Kelas/Smt</th>
                    <th style="border: 1px solid #333; padding: 8px;">Level Kognitif</th>
                    <th style="border: 1px solid #333; padding: 8px;">Indikator Soal</th>
                    <th style="border: 1px solid #333; padding: 8px;">No Soal</th>
                </tr>
            </thead>
            <tbody>
                ${kisiKisi.map((item, index) => `
                    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${escapeHtml(item.no)}</td>
                        <td style="border: 1px solid #ccc; padding: 6px;">${escapeHtml(item.kompetensi)}</td>
                        <td style="border: 1px solid #ccc; padding: 6px;">${escapeHtml(item.materi)}</td>
                        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${escapeHtml(item.kelasSmt)}</td>
                        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${escapeHtml(item.levelKognitif)}</td>
                        <td style="border: 1px solid #ccc; padding: 6px;">${escapeHtml(item.indikator)}</td>
                        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${escapeHtml(item.noSoal)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `;

    const allCardsHtml = soal.map((s, index) => {
        const kisiItem = kisiKisi[index] || {};
        return `
        <div class="kartu-soal-page" style="width: 21cm; min-height: 29.7cm; padding: 1.5cm; margin: 0 auto 1cm auto; page-break-after: always; box-sizing: border-box; display: flex; flex-direction: column; background: white; border: 1px solid #ddd; font-family: 'Times New Roman', Times, serif;">
            
            <div style="border-top: 5px solid #10b981; padding-top: 10px; margin-bottom: 20px;">
                <h3 style="font-size: 20pt; font-weight: bold; margin: 0; text-align: right; color: #333;">KARTU SOAL</h3>
                <p style="font-size: 11pt; margin: 0; text-align: right; color: #555;">Tahun Pelajaran ${escapeHtml(formData.academicYear)}</p>
            </div>
            
            <table style="width: 100%; font-size: 11pt; margin-bottom: 20px; border-collapse: collapse;">
                <tbody>
                    <tr>
                        <td style="padding: 2px 5px; width: 15%;">Jenis Sekolah</td><td style="width: 35%;">: ${escapeHtml(formData.schoolName)}</td>
                        <td style="padding: 2px 5px; width: 15%;">Kurikulum</td><td style="width: 35%;">: ${escapeHtml(formData.curriculum)}</td>
                    </tr>
                     <tr>
                        <td style="padding: 2px 5px;">Kelas / Fase</td><td>: ${escapeHtml(formData.gradeAndFase)}</td>
                        <td style="padding: 2px 5px;">Bentuk Soal</td><td>: ${escapeHtml(formData.questionType)}</td>
                    </tr>
                     <tr>
                        <td style="padding: 2px 5px;">Mata Pelajaran</td><td>: ${escapeHtml(formData.subject)}</td>
                        <td style="padding: 2px 5px;">Nama Penyusun</td><td>: ${escapeHtml(formData.teacherName)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="flex-grow: 1; border: 1px solid #ccc; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
                <div style="border-bottom: 1px solid #ccc;">
                    <div style="background-color: #f0fdf4; padding: 8px 12px; font-weight: bold; color: #15803d;">KOMPETENSI</div>
                    <div style="padding: 12px; font-size: 11pt;">${escapeHtml(kisiItem.kompetensi)}</div>
                </div>
                 <div style="border-bottom: 1px solid #ccc;">
                    <div style="background-color: #f0fdf4; padding: 8px 12px; font-weight: bold; color: #15803d;">MATERI</div>
                    <div style="padding: 12px; font-size: 11pt;">${escapeHtml(kisiItem.materi)}</div>
                </div>
                 <div style="border-bottom: 1px solid #ccc;">
                    <div style="background-color: #f0fdf4; padding: 8px 12px; font-weight: bold; color: #15803d;">INDIKATOR SOAL</div>
                    <div style="padding: 12px; font-size: 11pt;">${escapeHtml(kisiItem.indikator)}</div>
                </div>
                
                <div style="flex-grow: 1; display: flex; flex-direction: column;">
                     <div style="background-color: #dcfce7; padding: 8px 12px; font-weight: bold; color: #166534; text-align: center;">RUMUSAN BUTIR SOAL</div>
                    <div style="display: flex; flex-grow: 1;">
                        <div class="question-number" style="width: 10%; display: flex; align-items: center; justify-content: center; font-size: 24pt; font-weight: bold; border-right: 1px solid #ccc; background-color: #f8fafc;">
                            ${escapeHtml(kisiItem.noSoal)}
                        </div>
                        <div class="question-body" style="width: 90%; padding: 15px; font-size: 12pt; line-height: 1.6;">
                            ${escapeHtml(s.rumusanButirSoal)}
                        </div>
                    </div>
                </div>

                 <div style="border-top: 1px solid #ccc;">
                    <div style="background-color: #fefce8; padding: 8px 12px; font-weight: bold; color: #a16207;">KUNCI JAWABAN</div>
                    <div class="answer-key" style="padding: 12px; font-size: 12pt; font-weight: bold;">${escapeHtml(s.kunciJawaban)}</div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000000; background-color: #f8fafc; background-image: url('${watermarkDataUri}');">
            ${kisiKisiPageHtml}
            ${allCardsHtml}
            <div style="font-size: 9pt; font-style: italic; color: #555555; text-align: center; padding-top: 16px; border-top: 1px dashed #cccccc; background: white;">
                ${escapeHtml(watermarkText)}
            </div>
        </div>
    `;
};


const QuestionCardGenerator: React.FC<QuestionCardGeneratorProps> = ({ onBack, isClientApiKeyEnabled, isPaymentSystemEnabled, documentPrice, onTopUpRequest }) => {
    // --- STATE UNTUK MODE ---
    const [mode, setMode] = useState<'ai' | 'import'>('ai');
    
    const [fileContent, setFileContent] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<QuestionCardFormData>({
        schoolName: '',
        questionCardType: '',
        semester: '',
        academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
        subject: '',
        gradeAndFase: '',
        curriculum: 'Merdeka',
        teacherName: '',
        numQuestions: '5',
        questionType: 'Pilihan Ganda',
        mainMaterial: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [freeResultHtml, setFreeResultHtml] = useState<string>('');
    const [error, setError] = useState('');
    const [modalState, setModalState] = useState<'hidden' | 'loading' | 'success'>('hidden');
    const [userApiKey, setUserApiKey] = useState('');
    const [progressMessage, setProgressMessage] = useState('');


    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleQuestionTypeChange = useCallback((value: 'Pilihan Ganda' | 'Uraian') => {
        setFormData(prev => ({ ...prev, questionType: value }));
    }, []);

    const downloadTemplate = (type: 'pg' | 'essay') => {
        const content = type === 'pg' ? TEMPLATE_PG : TEMPLATE_ESSAY;
        const filename = type === 'pg' ? 'template_pilihan_ganda.txt' : 'template_uraian.txt';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/plain') {
            setError('Mohon unggah file format .txt');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setFileContent(content);
            setError(''); // Reset error
        };
        reader.readAsText(file);
    };

    const parseImportFile = (text: string) => {
        const questions = text.split('---').map(q => q.trim()).filter(q => q.length > 0);
        const parsedKisiKisi: any[] = [];
        const parsedSoal: any[] = [];

        questions.forEach((qBlock, index) => {
            const lines = qBlock.split('\n');
            let qText = '';
            let options = '';
            let answer = '';
            let comp = '-';
            let mat = formData.mainMaterial || '-'; // Fallback to form data if needed, usually overridden by file
            let ind = '-';
            let level = '-';

            let isReadingQ = false;

            lines.forEach(line => {
                const l = line.trim();
                if (l.startsWith('Q:') || l.startsWith('Soal:')) {
                    qText = l.substring(l.indexOf(':') + 1).trim();
                    isReadingQ = true;
                } else if (l.match(/^[A-E]\./)) {
                    options += l + '<br>';
                    isReadingQ = false;
                } else if (l.startsWith('Kunci:') || l.startsWith('Jawaban:')) {
                    answer = l.substring(l.indexOf(':') + 1).trim();
                    isReadingQ = false;
                } else if (l.startsWith('Kompetensi:')) {
                    comp = l.substring(l.indexOf(':') + 1).trim();
                    isReadingQ = false;
                } else if (l.startsWith('Materi:')) {
                    mat = l.substring(l.indexOf(':') + 1).trim();
                    isReadingQ = false;
                } else if (l.startsWith('Indikator:')) {
                    ind = l.substring(l.indexOf(':') + 1).trim();
                    isReadingQ = false;
                } else if (l.startsWith('Level:')) {
                    level = l.substring(l.indexOf(':') + 1).trim();
                    isReadingQ = false;
                } else if (isReadingQ) {
                    qText += ' ' + l; // Multiline question support
                }
            });

            // Construct Kisi-Kisi Item
            parsedKisiKisi.push({
                no: index + 1,
                kompetensi: comp,
                materi: mat,
                kelasSmt: `${formData.gradeAndFase} / ${formData.semester}`,
                levelKognitif: level,
                indikator: ind,
                noSoal: index + 1,
                bentukSoal: formData.questionType
            });

            // Construct Soal Item
            const fullSoal = options ? `${qText}<br><br>${options}` : qText;
            parsedSoal.push({
                rumusanButirSoal: fullSoal,
                kunciJawaban: answer,
                skor: 0
            });
        });

        return { kisiKisi: parsedKisiKisi, soal: parsedSoal };
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setModalState('loading');
        setDocumentId(null);
        setFreeResultHtml('');
        setError('');

        try {
            let generatedData;

            if (mode === 'import') {
                setProgressMessage('Membaca file import...');
                if (!fileContent) {
                    throw new Error("Mohon unggah file template .txt terlebih dahulu.");
                }
                generatedData = parseImportFile(fileContent);
                if (generatedData.soal.length === 0) {
                    throw new Error("Gagal membaca soal. Pastikan format file sesuai template (Gunakan pemisah '---').");
                }
                setProgressMessage('Berhasil membaca ' + generatedData.soal.length + ' soal.');
            } else {
                // AI Mode
                setProgressMessage('Memulai proses AI...');
                generatedData = await generateQuestionCard(formData, setProgressMessage, userApiKey.trim());
            }
            
            setProgressMessage('Merakit dokumen final...');
            const watermarkText = `Dokumen ini dibuat secara gratis oleh Gendhis khusus untuk ${formData.teacherName || 'Pengguna'}. Dilarang untuk diperjualbelikan.`;
            const watermarkDataUri = createWatermarkDataUri(`Gendhis | ${formData.teacherName}`);
            
            const finalHtml = formatDocumentFromJSON(generatedData, formData, watermarkText, watermarkDataUri);
            
            if (isPaymentSystemEnabled) {
                const savedDocument = await saveGeneratedDocument({
                    userName: formData.teacherName,
                    featureType: 'Question Card',
                    htmlContent: finalHtml,
                });
                setDocumentId(savedDocument.id);
                setModalState('success');
            } else {
                setFreeResultHtml(finalHtml);
                setModalState('hidden');
            }

            logUsage({
                type: 'Question Card',
                school_name: formData.schoolName,
                teacher_name: formData.teacherName,
                subject: formData.subject
            }).catch(err => {
                console.error('Gagal mengirim log Kartu Soal ke Supabase:', err);
            });
            
        } catch (err) {
            const friendlyErrorMessage = handleGenerationError(err);
            setError(friendlyErrorMessage);
            setModalState('hidden');
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <GenerationStatusModal
                isOpen={modalState !== 'hidden'}
                isLoading={modalState === 'loading'}
                isSuccess={modalState === 'success'}
                featureName="Kartu Soal & Kisi-Kisi"
                onClose={() => setModalState('hidden')}
                progressMessage={progressMessage}
            />
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-sm text-emerald-600 hover:underline dark:text-emerald-400 mb-8"
            >
                <ArrowLeftIcon />
                <span>Kembali ke Menu Utama</span>
            </button>
            <div className="flex flex-col gap-12">
                <div>
                    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                        
                        {/* --- UI PEMILIHAN MODE (AI vs IMPORT) --- */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-center text-slate-700 dark:text-slate-300 mb-4">Pilih Metode Pembuatan</h3>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                <button
                                    type="button"
                                    onClick={() => setMode('ai')}
                                    className={`py-3 px-4 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                                        mode === 'ai'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transform scale-[1.02]'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'
                                    }`}
                                >
                                    <MagicWandIcon />
                                    <span>Generate dengan AI (Otomatis)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('import')}
                                    className={`py-3 px-4 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                                        mode === 'import'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transform scale-[1.02]'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'
                                    }`}
                                >
                                    <i className="fa-solid fa-file-import text-lg"></i>
                                    <span>Import File (.txt) (Manual)</span>
                                </button>
                            </div>
                        </div>
                        {/* --- AKHIR UI PEMILIHAN MODE --- */}

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">1. Informasi Dokumen</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                             <InputField label="Nama Sekolah" name="schoolName" value={formData.schoolName} onChange={handleInputChange} placeholder="Masukkan Nama Sekolah Anda" required />
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Jenis Kartu Soal" name="questionCardType" value={formData.questionCardType} onChange={handleInputChange} placeholder="Contoh: SAS, STS" required />
                                <InputField label="Semester" name="semester" value={formData.semester} onChange={handleInputChange} placeholder="Contoh: Genap" required />
                                <InputField label="Tahun Ajaran" name="academicYear" value={formData.academicYear} onChange={handleInputChange} placeholder="Contoh: 2025 / 2026" required />
                                <InputField label="Mata Pelajaran" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Contoh: Videografi" required />
                                <InputField label="Kelas / Fase" name="gradeAndFase" value={formData.gradeAndFase} onChange={handleInputChange} placeholder="Contoh: X / E" required />
                                <InputField label="Kurikulum" name="curriculum" value={formData.curriculum} onChange={handleInputChange} placeholder="Contoh: Merdeka" required />
                            </div>
                            <InputField label="Nama Guru" name="teacherName" value={formData.teacherName} onChange={handleInputChange} placeholder="Nama lengkap Anda" required />
                            
                            {/* --- AREA SPESIFIK BERDASARKAN MODE --- */}
                            
                            {mode === 'ai' ? (
                                <>
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">2. Detail Soal (AI)</h3>
                                        <InputField label="Materi Pokok" name="mainMaterial" value={formData.mainMaterial} onChange={handleInputChange} placeholder="Materi yang akan diujikan" required />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InputField label="Jumlah Soal" name="numQuestions" value={formData.numQuestions} onChange={handleInputChange} type="number" required />
                                        
                                        {/* Custom Segmented Control for Question Type */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                                Jenis Soal
                                            </label>
                                            <div role="radiogroup" className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                                <button
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={formData.questionType === 'Pilihan Ganda'}
                                                    onClick={() => handleQuestionTypeChange('Pilihan Ganda')}
                                                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-700 focus:ring-emerald-500 ${
                                                    formData.questionType === 'Pilihan Ganda'
                                                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                                        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600'
                                                    }`}
                                                >
                                                    <i className="fa-solid fa-list-check"></i>
                                                    Pilihan Ganda
                                                </button>
                                                <button
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={formData.questionType === 'Uraian'}
                                                    onClick={() => handleQuestionTypeChange('Uraian')}
                                                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-700 focus:ring-emerald-500 ${
                                                    formData.questionType === 'Uraian'
                                                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                                        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600'
                                                    }`}
                                                >
                                                    <i className="fa-solid fa-align-left"></i>
                                                    Uraian
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {isClientApiKeyEnabled && (
                                        <div className="pt-2">
                                            <label htmlFor="userApiKey" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                                                <i className="fa-solid fa-bolt-lightning mr-2 text-amber-500"></i>API Key AI Anda Sendiri (Opsional)
                                            </label>
                                            <input
                                                type="password"
                                                id="userApiKey"
                                                name="userApiKey"
                                                value={userApiKey}
                                                onChange={(e) => setUserApiKey(e.target.value)}
                                                placeholder="Masukkan API Key Anda untuk proses lebih cepat"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:placeholder-slate-400 dark:text-white transition"
                                            />
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Kosongkan untuk menggunakan mode gratis. Kunci Anda hanya digunakan di browser Anda dan tidak disimpan.
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                // MODE IMPORT
                                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700 mt-4 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-lg">
                                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                        <i className="fa-solid fa-cloud-arrow-up"></i> Area Import Soal
                                    </h3>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">1. Pilih Template</label>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => downloadTemplate('pg')} className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-sm border border-slate-300 dark:border-slate-500 transition shadow-sm">
                                                    <i className="fa-solid fa-download mr-1 text-emerald-500"></i> Pilihan Ganda
                                                </button>
                                                <button type="button" onClick={() => downloadTemplate('essay')} className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-sm border border-slate-300 dark:border-slate-500 transition shadow-sm">
                                                    <i className="fa-solid fa-download mr-1 text-emerald-500"></i> Uraian
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">2. Jenis Soal yg Diupload</label>
                                            <div role="radiogroup" className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                                <button
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={formData.questionType === 'Pilihan Ganda'}
                                                    onClick={() => handleQuestionTypeChange('Pilihan Ganda')}
                                                    className={`flex items-center justify-center gap-2 px-2 py-2 text-xs font-semibold rounded-md transition-all duration-300 ${formData.questionType === 'Pilihan Ganda' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    Pilgan
                                                </button>
                                                <button
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={formData.questionType === 'Uraian'}
                                                    onClick={() => handleQuestionTypeChange('Uraian')}
                                                    className={`flex items-center justify-center gap-2 px-2 py-2 text-xs font-semibold rounded-md transition-all duration-300 ${formData.questionType === 'Uraian' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    Uraian
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">3. Upload File Soal (.txt)</label>
                                        <div className="flex items-center justify-center w-full">
                                            <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors ${fileContent ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-slate-300 dark:border-slate-600'}`}>
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                                    {fileContent ? (
                                                        <>
                                                            <i className="fa-solid fa-check-circle text-3xl text-emerald-500 mb-2"></i>
                                                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">File berhasil dibaca!</p>
                                                            <p className="text-xs text-slate-500">Klik untuk mengganti file</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-400 mb-2"></i>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Klik untuk upload</span> atau drag & drop</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">Hanya format .txt (Notepad)</p>
                                                        </>
                                                    )}
                                                </div>
                                                <input id="dropzone-file" type="file" accept=".txt" className="hidden" onChange={handleFileUpload} ref={fileInputRef} />
                                            </label>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 italic flex items-start gap-1">
                                            <i className="fa-solid fa-circle-info mt-0.5 text-blue-400"></i>
                                            <span>Pastikan menggunakan pemisah "---" antar soal agar sistem dapat mendeteksinya dengan benar.</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                                    <i className="fa-solid fa-shield-halved mr-2 text-emerald-500"></i>Tanda Air Keamanan
                                </label>
                                <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-500 dark:text-slate-400 text-sm italic">
                                    {`Dokumen akan ditandai: "Dibuat oleh Gendhis untuk ${formData.teacherName || '...'}. Dilarang diperjualbelikan."`}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || (mode === 'import' && !fileContent)}
                                className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
                            >
                                {isLoading ? <Spinner /> : (mode === 'import' ? <i className="fa-solid fa-print"></i> : <MagicWandIcon />)}
                                <span>{isLoading ? (progressMessage || 'Sedang Memproses...') : (mode === 'import' ? 'Cetak Kartu Soal & Kisi-Kisi' : 'Generate Soal & Kunci Jawaban')}</span>
                            </button>
                        </form>
                    </div>
                </div>

                <QuestionCardPreview
                  documentId={documentId}
                  freeResultHtml={freeResultHtml}
                  isPaymentSystemEnabled={isPaymentSystemEnabled}
                  error={error}
                  userName={formData.teacherName}
                  documentPrice={documentPrice}
                  onTopUpRequest={onTopUpRequest}
                />
            </div>
        </div>
    );
};

export default QuestionCardGenerator;
