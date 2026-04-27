
import React, { useState, useCallback } from 'react';
import type { RpdFormData } from '../types';
import { generateRpd } from '../services/rpdService';
import { handleGenerationError } from '../services/core/geminiCore';
import InputField from './InputField';
import Spinner from './Spinner';
import { ArrowLeftIcon, MagicWandIcon } from './IconComponents';
import RpdPreview from './RpdPreview';
import { logUsage, saveGeneratedDocument } from '../services/supabaseService';
import GenerationStatusModal from './GenerationStatusModal';

interface RpdGeneratorProps {
    onBack: () => void;
    isClientApiKeyEnabled: boolean;
    isPaymentSystemEnabled: boolean;
    documentPrice: number;
    // FIX: Add onTopUpRequest to handle opening the top-up modal from the preview.
    onTopUpRequest: () => void;
}

const RpdGenerator: React.FC<RpdGeneratorProps> = ({ onBack, isClientApiKeyEnabled, isPaymentSystemEnabled, documentPrice, onTopUpRequest }) => {
    const [formData, setFormData] = useState<RpdFormData>({
        schoolName: '',
        teacherName: '',
        subject: '',
        gradeAndSemester: '',
        timeAllocation: '30 Menit',
        mainTopic: '',
        principalName: '',
        curriculumVicePrincipalName: '',
        signaturePlaceDate: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [freeResultHtml, setFreeResultHtml] = useState<string>('');
    const [error, setError] = useState('');
    const [modalState, setModalState] = useState<'hidden' | 'loading' | 'success'>('hidden');
    const [userApiKey, setUserApiKey] = useState('');

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setModalState('loading');
        setDocumentId(null);
        setFreeResultHtml('');
        setError('');

        try {
            await generateRpd(formData, (chunk) => {
                setFreeResultHtml(prev => prev + chunk);
            }, userApiKey.trim());

            if (isPaymentSystemEnabled) {
                const savedDocument = await saveGeneratedDocument({
                    userName: formData.teacherName,
                    featureType: 'RPD',
                    htmlContent: freeResultHtml
                });
                setDocumentId(savedDocument.id);
                setModalState('success');
            } else {
                setModalState('hidden');
            }

            logUsage({
                type: 'RPD',
                school_name: formData.schoolName,
                teacher_name: formData.teacherName,
                subject: formData.subject
            }).catch(err => {
                console.error('Gagal mengirim log RPD ke Supabase:', err);
            });

        } catch (err) {
            const friendlyErrorMessage = handleGenerationError(err);
            setError(friendlyErrorMessage);
            setModalState('hidden');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
             <GenerationStatusModal
                isOpen={modalState !== 'hidden'}
                isLoading={modalState === 'loading'}
                isSuccess={modalState === 'success'}
                featureName="RPD (Microteaching)"
                onClose={() => setModalState('hidden')}
            />
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-sm text-rose-600 hover:underline dark:text-rose-400 mb-8"
            >
                <ArrowLeftIcon />
                <span>Kembali ke Menu Utama</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">Generator RPD (Microteaching)</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Isi data di bawah ini untuk membuat Rencana Pembelajaran Digital.</p>
                        
                        <InputField label="Topik Utama Pembelajaran" name="mainTopic" value={formData.mainTopic} onChange={handleInputChange} placeholder="Contoh: Dasar Desain Komunikasi Visual" required themeColor="rose"/>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Nama Sekolah" name="schoolName" value={formData.schoolName} onChange={handleInputChange} required themeColor="rose"/>
                            <InputField label="Nama Guru" name="teacherName" value={formData.teacherName} onChange={handleInputChange} required themeColor="rose"/>
                            <InputField label="Mata Pelajaran" name="subject" value={formData.subject} onChange={handleInputChange} required themeColor="rose"/>
                            <InputField label="Kelas & Semester" name="gradeAndSemester" value={formData.gradeAndSemester} onChange={handleInputChange} placeholder="Contoh: XI / Ganjil" required themeColor="rose"/>
                            <InputField label="Alokasi Waktu" name="timeAllocation" value={formData.timeAllocation} onChange={handleInputChange} required themeColor="rose"/>
                             <InputField label="Kota & Tanggal TTD" name="signaturePlaceDate" value={formData.signaturePlaceDate} onChange={handleInputChange} placeholder="Contoh: Yogyakarta, 22 Agustus 2025" required themeColor="rose"/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Nama Kepala Sekolah" name="principalName" value={formData.principalName} onChange={handleInputChange} required themeColor="rose"/>
                            <InputField label="Nama Waka Kurikulum" name="curriculumVicePrincipalName" value={formData.curriculumVicePrincipalName} onChange={handleInputChange} required themeColor="rose"/>
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
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 bg-rose-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-rose-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                        {isLoading ? <Spinner /> : <MagicWandIcon />}
                        <span>{isLoading ? 'Sedang Memproses RPD...' : 'Generate RPD'}</span>
                    </button>
                </form>

                <RpdPreview
                  documentId={documentId}
                  freeResultHtml={freeResultHtml}
                  isPaymentSystemEnabled={isPaymentSystemEnabled}
                  error={error}
                  userName={formData.teacherName}
                  documentPrice={documentPrice}
                  onTopUpRequest={onTopUpRequest}
                />
            </div>
             <style>
              {`
                .custom-scrollbar-rose::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar-rose::-webkit-scrollbar-track { background: #f1f5f9; }
                .dark .custom-scrollbar-rose::-webkit-scrollbar-track { background: #1e293b; }
                .custom-scrollbar-rose::-webkit-scrollbar-thumb { background-color: #f472b6; border-radius: 10px; border: 2px solid #f1f5f9; }
                .dark .custom-scrollbar-rose::-webkit-scrollbar-thumb { background-color: #db2777; border-color: #1e293b; }
              `}
            </style>
        </div>
    );
};

export default RpdGenerator;