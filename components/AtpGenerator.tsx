
import React, { useState, useCallback } from 'react';
import type { AtpFormData } from '../types';
import { generateAtp } from '../services/atpService';
import { handleGenerationError } from '../services/core/geminiCore';
import InputField from './InputField';
import Spinner from './Spinner';
import { ArrowLeftIcon, MagicWandIcon } from './IconComponents';
import AtpPreview from './AtpPreview';
import { logUsage, saveGeneratedDocument } from '../services/supabaseService';
import GenerationStatusModal from './GenerationStatusModal';

interface AtpGeneratorProps {
    onBack: () => void;
    isClientApiKeyEnabled: boolean;
    isPaymentSystemEnabled: boolean;
    documentPrice: number;
    // FIX: Add onTopUpRequest to handle opening the top-up modal from the preview.
    onTopUpRequest: () => void;
}

const AtpGenerator: React.FC<AtpGeneratorProps> = ({ onBack, isClientApiKeyEnabled, isPaymentSystemEnabled, documentPrice, onTopUpRequest }) => {
    const [formData, setFormData] = useState<AtpFormData>({
        penyusun: '',
        sekolah: '',
        mataPelajaran: '',
        fase: '',
        kelas: '',
        kepalaSekolah: '',
        guruPengampu: '',
        kotaTanggalTtd: '',
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
            await generateAtp(formData, (chunk) => {
                accumulatedResult += chunk;
                setFreeResultHtml(prev => prev + chunk);
            }, userApiKey.trim());

            // Membersihkan artefak Markdown dari output AI setelah streaming selesai.
            const cleanedHtml = accumulatedResult
                .replace(/^```html\s*/, '')
                .replace(/```$/, '');

            if (isPaymentSystemEnabled) {
                const savedDocument = await saveGeneratedDocument({
                    userName: formData.penyusun,
                    featureType: 'ATP',
                    htmlContent: cleanedHtml // Menyimpan HTML yang sudah bersih
                });
                setDocumentId(savedDocument.id);
                setModalState('success');
            } else {
                setFreeResultHtml(cleanedHtml); // Memperbarui pratinjau dengan HTML bersih
                setModalState('hidden');
            }

            logUsage({
                type: 'ATP',
                school_name: formData.sekolah,
                teacher_name: formData.penyusun,
                subject: formData.mataPelajaran
            }).catch(err => {
                console.error('Gagal mengirim log ATP ke Supabase:', err);
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
                featureName="ATP"
                onClose={() => setModalState('hidden')}
            />
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-sm text-fuchsia-600 hover:underline dark:text-fuchsia-400 mb-8"
            >
                <ArrowLeftIcon />
                <span>Kembali ke Menu Utama</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">Generator Alur Tujuan Pembelajaran (ATP)</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Isi data di bawah ini untuk merancang ATP yang modern dan sistematis.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <InputField label="Mata Pelajaran" name="mataPelajaran" value={formData.mataPelajaran} onChange={handleInputChange} placeholder="Contoh: Video Editing" required themeColor="violet"/>
                           <InputField label="Penyusun" name="penyusun" value={formData.penyusun} onChange={handleInputChange} required themeColor="violet"/>
                           <InputField label="Nama Sekolah" name="sekolah" value={formData.sekolah} onChange={handleInputChange} required themeColor="violet"/>
                           <InputField label="Kelas" name="kelas" value={formData.kelas} onChange={handleInputChange} placeholder="Contoh: XI" required themeColor="violet"/>
                           <InputField label="Fase" name="fase" value={formData.fase} onChange={handleInputChange} placeholder="Contoh: F" required themeColor="violet"/>
                           <InputField label="Kota & Tanggal TTD" name="kotaTanggalTtd" value={formData.kotaTanggalTtd} onChange={handleInputChange} placeholder="Contoh: Surabaya, 20 Juli 2025" required themeColor="violet"/>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField label="Nama Kepala Sekolah" name="kepalaSekolah" value={formData.kepalaSekolah} onChange={handleInputChange} required themeColor="violet"/>
                            <InputField label="Nama Guru Pengampu" name="guruPengampu" value={formData.guruPengampu} onChange={handleInputChange} required themeColor="violet"/>
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
                        className="w-full flex items-center justify-center space-x-2 bg-fuchsia-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-fuchsia-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                        {isLoading ? <Spinner /> : <MagicWandIcon />}
                        <span>{isLoading ? 'Sedang Memproses ATP...' : 'Generate ATP'}</span>
                    </button>
                </form>

                <AtpPreview
                  documentId={documentId}
                  freeResultHtml={freeResultHtml}
                  isPaymentSystemEnabled={isPaymentSystemEnabled}
                  error={error}
                  userName={formData.penyusun}
                  documentPrice={documentPrice}
                  onTopUpRequest={onTopUpRequest}
                />
            </div>
        </div>
    );
};

export default AtpGenerator;