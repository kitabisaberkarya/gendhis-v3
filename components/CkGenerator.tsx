
import React, { useState, useCallback } from 'react';
import type { CkFormData } from '../types';
import { generateCk } from '../services/ckService';
import { handleGenerationError } from '../services/core/geminiCore';
import InputField from './InputField';
import Spinner from './Spinner';
import { ArrowLeftIcon, MagicWandIcon, AwardIcon } from './IconComponents';
import CkPreview from './CkPreview';
import { logUsage, saveGeneratedDocument } from '../services/supabaseService';
import GenerationStatusModal from './GenerationStatusModal';

interface CkGeneratorProps {
    onBack: () => void;
    isClientApiKeyEnabled: boolean;
    isPaymentSystemEnabled: boolean;
    documentPrice: number;
    onTopUpRequest: () => void;
}

const CkGenerator: React.FC<CkGeneratorProps> = ({ onBack, isClientApiKeyEnabled, isPaymentSystemEnabled, documentPrice, onTopUpRequest }) => {
    const [formData, setFormData] = useState<CkFormData>({
        studentName: '',
        studentId: '',
        schoolName: '',
        subject: '',
        grade: '',
        semester: 'Ganjil',
        academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
        competencyElement: '',
        achievementLevel: 'Baik',
        teacherName: '',
        signaturePlaceDate: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [freeResultHtml, setFreeResultHtml] = useState<string>('');
    const [error, setError] = useState('');
    const [modalState, setModalState] = useState<'hidden' | 'loading' | 'success'>('hidden');
    const [userApiKey, setUserApiKey] = useState('');
    const [progressMessage, setProgressMessage] = useState('');

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setModalState('loading');
        setProgressMessage('Menyusun narasi Deep Learning...');
        setDocumentId(null);
        setFreeResultHtml('');
        setError('');

        let accumulatedResult = '';
        try {
            await generateCk(formData, (chunk) => {
                accumulatedResult += chunk;
                setFreeResultHtml(prev => prev + chunk);
            }, userApiKey.trim());

            const cleanedHtml = accumulatedResult
                .replace(/^```html\s*/, '')
                .replace(/```$/, '');

            if (isPaymentSystemEnabled) {
                const savedDocument = await saveGeneratedDocument({
                    userName: formData.studentName,
                    featureType: 'CK Deep Learning',
                    htmlContent: cleanedHtml
                });
                setDocumentId(savedDocument.id);
                setModalState('success');
            } else {
                setFreeResultHtml(cleanedHtml);
                setModalState('hidden');
            }

            logUsage({
                type: 'CK',
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
                featureName="Capaian Kompetensi"
                onClose={() => setModalState('hidden')}
                progressMessage={progressMessage}
            />
            <button onClick={onBack} className="flex items-center space-x-2 text-sm text-amber-600 hover:underline dark:text-amber-400 mb-8">
                <ArrowLeftIcon />
                <span>Kembali ke Menu Utama</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                             <i className="fa-solid fa-award text-amber-500"></i> Capaian Kompetensi (CK)
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Buat narasi rapor berbasis Deep Learning yang personal untuk tiap siswa.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Nama Siswa" name="studentName" value={formData.studentName} onChange={handleInputChange} required themeColor="sky"/>
                            <InputField label="NIS/NISN" name="studentId" value={formData.studentId} onChange={handleInputChange} required themeColor="sky"/>
                            <InputField label="Nama Sekolah" name="schoolName" value={formData.schoolName} onChange={handleInputChange} required themeColor="sky"/>
                            <InputField label="Mata Pelajaran" name="subject" value={formData.subject} onChange={handleInputChange} required themeColor="sky"/>
                            <InputField label="Kelas" name="grade" value={formData.grade} onChange={handleInputChange} placeholder="X DKV" required themeColor="sky"/>
                            <InputField label="Tahun Ajaran" name="academicYear" value={formData.academicYear} onChange={handleInputChange} required themeColor="sky"/>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Predikat Capaian</label>
                                <select 
                                    name="achievementLevel" 
                                    value={formData.achievementLevel} 
                                    onChange={handleInputChange as any}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 transition"
                                >
                                    <option value="Sangat Baik">Sangat Baik</option>
                                    <option value="Baik">Baik</option>
                                    <option value="Cukup">Cukup</option>
                                    <option value="Perlu Bimbingan">Perlu Bimbingan</option>
                                </select>
                            </div>
                            <InputField label="Kota & Tanggal Rapor" name="signaturePlaceDate" value={formData.signaturePlaceDate} onChange={handleInputChange} placeholder="Surabaya, 20 Des 2025" required themeColor="sky"/>
                        </div>
                        
                        <InputField label="Elemen Kompetensi (Materi Utama)" name="competencyElement" value={formData.competencyElement} onChange={handleInputChange} placeholder="Contoh: Pembuatan Logo Digital" required themeColor="sky"/>
                        <InputField label="Nama Guru Mata Pelajaran" name="teacherName" value={formData.teacherName} onChange={handleInputChange} required themeColor="sky"/>

                        {isClientApiKeyEnabled && (
                            <div className="pt-2">
                                <label className="block text-xs font-medium text-slate-500 mb-1">API Key Sendiri (Opsional)</label>
                                <input type="password" value={userApiKey} onChange={(e) => setUserApiKey(e.target.value)} placeholder="Masukkan API Key Gemini" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-md text-sm" />
                            </div>
                        )}
                    </div>
                    
                    <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center space-x-2 bg-amber-500 text-white font-semibold py-4 px-4 rounded-lg shadow-md hover:bg-amber-600 disabled:bg-slate-400 transition-all transform active:scale-95">
                        {isLoading ? <Spinner /> : <MagicWandIcon />}
                        <span>{isLoading ? (progressMessage || 'Menganalisis...') : 'Generate Narasi Rapor'}</span>
                    </button>
                </form>

                <CkPreview
                  documentId={documentId}
                  freeResultHtml={freeResultHtml}
                  isPaymentSystemEnabled={isPaymentSystemEnabled}
                  error={error}
                  userName={formData.studentName}
                  documentPrice={documentPrice}
                  onTopUpRequest={onTopUpRequest}
                />
            </div>
        </div>
    );
};

export default CkGenerator;
