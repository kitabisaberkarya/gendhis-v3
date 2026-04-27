
import React, { useState, useCallback } from 'react';
import type { RpmFormData } from '../types';
import { generateRpm, STATIC_RPM_PROFIL_LULUSAN_HTML } from '../services/rpmService';
import { handleGenerationError } from '../services/core/geminiCore';
import InputField from './InputField';
import Spinner from './Spinner';
import { ArrowLeftIcon, MagicWandIcon } from './IconComponents';
import RpmPreview from './RpmPreview';
import { logUsage, saveGeneratedDocument } from '../services/supabaseService';
import GenerationStatusModal from './GenerationStatusModal';

interface RpmGeneratorProps {
    onBack: () => void;
    isClientApiKeyEnabled: boolean;
    isPaymentSystemEnabled: boolean;
    documentPrice: number;
    // FIX: Add onTopUpRequest to handle opening the top-up modal from the preview.
    onTopUpRequest: () => void;
}

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


const RpmGenerator: React.FC<RpmGeneratorProps> = ({ onBack, isClientApiKeyEnabled, isPaymentSystemEnabled, documentPrice, onTopUpRequest }) => {
    const [formData, setFormData] = useState<RpmFormData>({
        schoolName: '',
        principalName: '',
        principalId: '',
        teacherName: '',
        teacherId: '',
        subject: '',
        mainMaterial: '',
        grade: '',
        fase: '',
        academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
        timeAllocation: '',
        signaturePlaceDate: '',
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setModalState('loading');
        setProgressMessage('Memulai proses...');
        setDocumentId(null);
        setFreeResultHtml(''); // Bersihkan hasil sebelumnya
        setError('');

        try {
            const watermarkText = `Dokumen ini dibuat secara gratis oleh Gendhis khusus untuk ${formData.teacherName || 'Pengguna'}. Dilarang untuk diperjualbelikan.`;
            const watermarkDataUri = createWatermarkDataUri(`Gendhis | ${formData.teacherName}`);
            
            const handleStreamChunk = (chunk: string) => {
                if (chunk === 'CLEAR') {
                    setFreeResultHtml('');
                } else {
                    setFreeResultHtml(prev => prev + chunk);
                }
            };

            const finalHtml = await generateRpm(
                formData,
                watermarkText,
                watermarkDataUri,
                handleStreamChunk,
                setProgressMessage, // Melewatkan handler progres
                userApiKey.trim()
            );

            const finalProcessedHtml = finalHtml.replace('<!-- PROFIL_LULUSAN_PLACEHOLDER -->', STATIC_RPM_PROFIL_LULUSAN_HTML);
            
            // Membersihkan artefak Markdown dari output AI setelah streaming selesai.
            const cleanedHtml = finalProcessedHtml
                .replace(/^```html\s*/, '')
                .replace(/```$/, '');
            
            // Timpa hasil stream dengan yang sudah diproses dan dibersihkan.
            setFreeResultHtml(cleanedHtml);
            
            if (isPaymentSystemEnabled) {
                const savedDocument = await saveGeneratedDocument({
                    userName: formData.teacherName,
                    featureType: 'RPM',
                    htmlContent: cleanedHtml // Menyimpan HTML yang sudah bersih
                });
                setDocumentId(savedDocument.id);
                setModalState('success');
            } else {
                setModalState('hidden');
            }

            logUsage({
                type: 'RPM',
                school_name: formData.schoolName,
                teacher_name: formData.teacherName,
                subject: formData.subject
            }).catch(err => {
                console.error('Gagal mengirim log RPM ke Supabase:', err);
            });

        } catch (err) {
            const friendlyErrorMessage = handleGenerationError(err);
            setFreeResultHtml(''); // Bersihkan hasil parsial/gagal
            setError(friendlyErrorMessage); // Set pesan error mentah
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
                featureName="RPM"
                onClose={() => setModalState('hidden')}
                progressMessage={progressMessage}
            />
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-sm text-sky-600 hover:underline dark:text-sky-400 mb-8"
            >
                <ArrowLeftIcon />
                <span>Kembali ke Menu Utama</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="lg:pr-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">Generator RPM</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Isi data di bawah ini untuk membuat Rancangan Pembelajaran Mendalam.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Nama Sekolah" name="schoolName" value={formData.schoolName} onChange={handleInputChange} required />
                            <InputField label="Nama Kepala Sekolah" name="principalName" value={formData.principalName} onChange={handleInputChange} required />
                            <InputField label="NIP/NPA Kepala Sekolah" name="principalId" value={formData.principalId} onChange={handleInputChange} required />
                            <InputField label="Nama Guru" name="teacherName" value={formData.teacherName} onChange={handleInputChange} required />
                            <InputField label="NIP/NPA Guru" name="teacherId" value={formData.teacherId} onChange={handleInputChange} required />
                            <InputField label="Mata Pelajaran" name="subject" value={formData.subject} onChange={handleInputChange} required />
                            <InputField label="Materi Pokok" name="mainMaterial" value={formData.mainMaterial} onChange={handleInputChange} required />
                            <InputField label="Kelas" name="grade" value={formData.grade} onChange={handleInputChange} placeholder="Contoh: X" required />
                            <InputField label="Fase" name="fase" value={formData.fase} onChange={handleInputChange} placeholder="Contoh: E" required />
                            <InputField label="Tahun Ajaran" name="academicYear" value={formData.academicYear} onChange={handleInputChange} required />
                            <InputField label="Alokasi Waktu" name="timeAllocation" value={formData.timeAllocation} onChange={handleInputChange} placeholder="6 x 45 Menit (3 Pertemuan)" required />
                            <InputField label="Kota & Tanggal TTD" name="signaturePlaceDate" value={formData.signaturePlaceDate} onChange={handleInputChange} placeholder="Contoh: Jakarta, 20 Juli 2024" required />
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

                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                                <i className="fa-solid fa-shield-halved mr-2 text-sky-500"></i>Tanda Air Keamanan
                            </label>
                            <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-500 dark:text-slate-400 text-sm italic">
                                {`Dokumen akan ditandai: "Dibuat oleh Gendhis untuk ${formData.teacherName || '...'}. Dilarang diperjualbelikan."`}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center space-x-2 bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {isLoading ? <Spinner /> : <MagicWandIcon />}
                            <span>{isLoading ? (progressMessage || 'Sedang Memproses...') : 'Generate RPM'}</span>
                        </button>
                    </form>
                </div>

                <RpmPreview
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

export default RpmGenerator;