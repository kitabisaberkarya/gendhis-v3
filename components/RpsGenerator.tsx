
import React, { useState, useCallback } from 'react';
import type { RpsFormData } from '../types';
import { generateRps } from '../services/rpsService';
import { handleGenerationError } from '../services/core/geminiCore';
import InputField from './InputField';
import Spinner from './Spinner';
import { ArrowLeftIcon, MagicWandIcon } from './IconComponents';
import RpsPreview from './RpsPreview';
import { logUsage, saveGeneratedDocument } from '../services/supabaseService';
import GenerationStatusModal from './GenerationStatusModal';

interface RpsGeneratorProps {
    onBack: () => void;
    isClientApiKeyEnabled: boolean;
    isPaymentSystemEnabled: boolean;
    documentPrice: number;
    // FIX: Add onTopUpRequest to handle opening the top-up modal from the preview.
    onTopUpRequest: () => void;
}

const RpsGenerator: React.FC<RpsGeneratorProps> = ({ onBack, isClientApiKeyEnabled, isPaymentSystemEnabled, documentPrice, onTopUpRequest }) => {
    const [formData, setFormData] = useState<RpsFormData>({
        universityName: '',
        faculty: '',
        studyProgram: '',
        documentCode: '',
        courseName: '',
        courseCode: '',
        courseGroup: '',
        courseCredits: '',
        semester: '',
        dateOfPreparation: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        rpsDeveloper: '',
        rmkCoordinator: '',
        headOfProgram: '',
        learningModel: 'Project Based Learning',
        logoUrl: '', // State baru untuk URL logo
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

        let accumulatedResult = '';

        try {
            await generateRps(formData, (chunk) => {
                accumulatedResult += chunk;
                setFreeResultHtml(prev => prev + chunk); // Update for streaming preview
            }, userApiKey.trim());

            const cleanedHtml = accumulatedResult
                .replace(/^```html\s*/, '') 
                .replace(/```$/, '');       

            if (isPaymentSystemEnabled) {
                const savedDocument = await saveGeneratedDocument({
                    userName: formData.rpsDeveloper,
                    featureType: 'RPS',
                    htmlContent: cleanedHtml
                });
                setDocumentId(savedDocument.id);
                setModalState('success');
            } else {
                setFreeResultHtml(cleanedHtml);
                setModalState('hidden');
            }

            logUsage({
                type: 'RPS',
                school_name: formData.universityName,
                teacher_name: formData.rpsDeveloper,
                subject: formData.courseName
            }).catch(err => {
                console.error('Gagal mengirim log RPS ke Supabase:', err);
            });

        } catch (err) {
            const friendlyErrorMessage = handleGenerationError(err);
            setError(friendlyErrorMessage);
            setModalState('hidden');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderFormSection = (title: string, children: React.ReactNode) => (
        <fieldset className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
            <legend className="px-2 text-lg font-bold text-slate-800 dark:text-slate-200">{title}</legend>
            <div className="space-y-4 mt-4">
                {children}
            </div>
        </fieldset>
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
             <GenerationStatusModal
                isOpen={modalState !== 'hidden'}
                isLoading={modalState === 'loading'}
                isSuccess={modalState === 'success'}
                featureName="RPS"
                onClose={() => setModalState('hidden')}
            />
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-sm text-violet-600 hover:underline dark:text-violet-400 mb-8"
            >
                <ArrowLeftIcon />
                <span>Kembali ke Menu Utama</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {renderFormSection("1. Informasi Institusi & Mata Kuliah", (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Nama Universitas" name="universityName" value={formData.universityName} onChange={handleInputChange} required themeColor="violet"/>
                                <InputField label="Fakultas" name="faculty" value={formData.faculty} onChange={handleInputChange} required themeColor="violet"/>
                            </div>
                             <InputField label="URL Logo Universitas" name="logoUrl" value={formData.logoUrl || ''} onChange={handleInputChange} placeholder="Opsional: https://.../logo.png" themeColor="violet"/>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Program Studi" name="studyProgram" value={formData.studyProgram} onChange={handleInputChange} required themeColor="violet"/>
                                <InputField label="Kode Dokumen" name="documentCode" value={formData.documentCode} onChange={handleInputChange} placeholder="Opsional" themeColor="violet"/>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Nama Mata Kuliah" name="courseName" value={formData.courseName} onChange={handleInputChange} required themeColor="violet"/>
                                <InputField label="Kode Mata Kuliah" name="courseCode" value={formData.courseCode} onChange={handleInputChange} required themeColor="violet"/>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <InputField label="Rumpun MK" name="courseGroup" value={formData.courseGroup} onChange={handleInputChange} placeholder="MK Wajib Prodi" required themeColor="violet"/>
                                <InputField label="Bobot (sks)" name="courseCredits" value={formData.courseCredits} onChange={handleInputChange} placeholder="T=2 P=1 (3 SKS)" required themeColor="violet"/>
                                <InputField label="Semester" name="semester" value={formData.semester} onChange={handleInputChange} type="number" required themeColor="violet"/>
                            </div>
                             <InputField label="Model Pembelajaran" name="learningModel" value={formData.learningModel} onChange={handleInputChange} required themeColor="violet"/>
                        </>
                    ))}

                    {renderFormSection("2. Otorisasi & Penanggung Jawab", (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Pengembang RPS / Dosen" name="rpsDeveloper" value={formData.rpsDeveloper} onChange={handleInputChange} required themeColor="violet"/>
                                <InputField label="Tanggal Penyusunan" name="dateOfPreparation" value={formData.dateOfPreparation} onChange={handleInputChange} required themeColor="violet"/>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Koordinator RMK" name="rmkCoordinator" value={formData.rmkCoordinator} onChange={handleInputChange} required themeColor="violet"/>
                                <InputField label="Ketua Program Studi" name="headOfProgram" value={formData.headOfProgram} onChange={handleInputChange} required themeColor="violet"/>
                            </div>
                        </>
                    ))}
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
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 bg-violet-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-violet-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                        {isLoading ? <Spinner /> : <MagicWandIcon />}
                        <span>{isLoading ? 'Sedang Memproses RPS...' : 'Generate RPS Lengkap'}</span>
                    </button>
                </form>

                <RpsPreview
                  documentId={documentId}
                  freeResultHtml={freeResultHtml}
                  isPaymentSystemEnabled={isPaymentSystemEnabled}
                  error={error}
                  userName={formData.rpsDeveloper}
                  documentPrice={documentPrice}
                  onTopUpRequest={onTopUpRequest}
                />
            </div>
             <style>
              {`
                .custom-scrollbar-violet::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar-violet::-webkit-scrollbar-track { background: #f1f5f9; }
                .dark .custom-scrollbar-violet::-webkit-scrollbar-track { background: #1e293b; }
                .custom-scrollbar-violet::-webkit-scrollbar-thumb { background-color: #a78bfa; border-radius: 10px; border: 2px solid #f1f5f9; }
                .dark .custom-scrollbar-violet::-webkit-scrollbar-thumb { background-color: #7c3aed; border-color: #1e293b; }
              `}
            </style>
        </div>
    );
};

export default RpsGenerator;