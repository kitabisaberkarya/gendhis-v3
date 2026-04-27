
import React, { useState, useCallback } from 'react';
import type { JournalFormData } from '../types';
import { generateJournal } from '../services/journalService';
import { handleGenerationError } from '../services/core/geminiCore';
import InputField from './InputField';
import TextareaField from './TextareaField';
import Spinner from './Spinner';
import { ArrowLeftIcon, MagicWandIcon } from './IconComponents';
import JournalPreview from './JournalPreview';
import { logUsage, saveGeneratedDocument } from '../services/supabaseService';
import GenerationStatusModal from './GenerationStatusModal';

interface JournalGeneratorProps {
    onBack: () => void;
    isClientApiKeyEnabled: boolean;
    isPaymentSystemEnabled: boolean;
    documentPrice: number;
    onTopUpRequest: () => void;
}

const JournalGenerator: React.FC<JournalGeneratorProps> = ({ onBack, isClientApiKeyEnabled, isPaymentSystemEnabled, documentPrice, onTopUpRequest }) => {
    const [formData, setFormData] = useState<JournalFormData>({
        schoolName: '',
        teacherName: '',
        subject: '',
        grade: '',
        date: new Date().toISOString().split('T')[0],
        material: '',
        classSituation: '',
        studentProgress: '',
        reflection: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [freeResultHtml, setFreeResultHtml] = useState<string>('');
    const [error, setError] = useState('');
    const [modalState, setModalState] = useState<'hidden' | 'loading' | 'success'>('hidden');
    const [userApiKey, setUserApiKey] = useState('');
    const [progressMessage, setProgressMessage] = useState('');

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setModalState('loading');
        setProgressMessage('Merangkum catatan Anda...');
        setDocumentId(null);
        setFreeResultHtml('');
        setError('');

        let accumulatedResult = '';
        try {
            await generateJournal(formData, (chunk) => {
                accumulatedResult += chunk;
                setFreeResultHtml(prev => prev + chunk);
            }, userApiKey.trim());

            const cleanedHtml = accumulatedResult
                .replace(/^```html\s*/, '')
                .replace(/```$/, '');

            if (isPaymentSystemEnabled) {
                const savedDocument = await saveGeneratedDocument({
                    userName: formData.teacherName,
                    featureType: 'Journal',
                    htmlContent: cleanedHtml
                });
                setDocumentId(savedDocument.id);
                setModalState('success');
            } else {
                setFreeResultHtml(cleanedHtml);
                setModalState('hidden');
            }

            logUsage({
                type: 'Journal',
                school_name: formData.schoolName,
                teacher_name: formData.teacherName,
                subject: formData.subject
            }).catch(err => console.error('Log error:', err));

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
        <div className="w-full max-w-7xl mx-auto px-4">
             <GenerationStatusModal
                isOpen={modalState !== 'hidden'}
                isLoading={modalState === 'loading'}
                isSuccess={modalState === 'success'}
                featureName="Jurnal Digital"
                onClose={() => setModalState('hidden')}
                progressMessage={progressMessage}
            />
            <button onClick={onBack} className="flex items-center space-x-2 text-sm text-lime-600 hover:underline dark:text-lime-400 mb-8">
                <ArrowLeftIcon />
                <span>Kembali ke Menu Utama</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                             <i className="fa-solid fa-book-journal-whills text-lime-500"></i> Jurnal Digital Guru
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Catat refleksi dan kemajuan siswa setelah sesi mengajar selesai.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Nama Sekolah" name="schoolName" value={formData.schoolName} onChange={handleInputChange} required themeColor="emerald"/>
                            <InputField label="Nama Guru" name="teacherName" value={formData.teacherName} onChange={handleInputChange} required themeColor="emerald"/>
                            <InputField label="Mata Pelajaran" name="subject" value={formData.subject} onChange={handleInputChange} required themeColor="emerald"/>
                            <InputField label="Kelas" name="grade" value={formData.grade} onChange={handleInputChange} placeholder="Contoh: X DKV" required themeColor="emerald"/>
                            <InputField label="Tanggal Mengajar" name="date" type="date" value={formData.date} onChange={handleInputChange} required themeColor="emerald"/>
                            <InputField label="Materi Pokok" name="material" value={formData.material} onChange={handleInputChange} placeholder="Misal: Tipografi Dasar" required themeColor="emerald"/>
                        </div>

                        <TextareaField label="Situasi Kelas" name="classSituation" value={formData.classSituation} onChange={handleInputChange} placeholder="Bagaimana suasana di kelas? Siswa aktif? Ada kendala disiplin?" required themeColor="emerald"/>
                        <TextareaField label="Kemajuan & Hambatan Siswa" name="studentProgress" value={formData.studentProgress} onChange={handleInputChange} placeholder="Seberapa banyak siswa yang paham? Siapa yang butuh bimbingan ekstra?" required themeColor="emerald"/>
                        <TextareaField label="Refleksi & Ide Anda" name="reflection" value={formData.reflection} onChange={handleInputChange} placeholder="Apa yang ingin Anda perbaiki di pertemuan berikutnya?" required themeColor="emerald"/>

                        {isClientApiKeyEnabled && (
                            <div className="pt-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">API Key Sendiri (Opsional)</label>
                                <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="Masukkan API Key Gemini" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-md text-sm" />
                            </div>
                        )}
                    </div>
                    
                    <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center space-x-2 bg-lime-600 text-white font-semibold py-4 px-4 rounded-lg shadow-md hover:bg-lime-700 disabled:bg-slate-400 transition-all transform active:scale-95">
                        {isLoading ? <Spinner /> : <MagicWandIcon />}
                        <span>{isLoading ? (progressMessage || 'Menganalisis...') : 'Simpan & Susun Jurnal'}</span>
                    </button>
                </form>

                <JournalPreview
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

export default JournalGenerator;
