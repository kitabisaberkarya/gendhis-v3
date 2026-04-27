import React, { useEffect, useState } from 'react';

interface GenerationStatusModalProps {
    isOpen: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    featureName: string;
    onClose: () => void;
    progressMessage?: string;
}

const GenerationStatusModal: React.FC<GenerationStatusModalProps> = ({
    isOpen,
    isLoading,
    isSuccess,
    featureName,
    onClose,
    progressMessage,
}) => {
    const [dynamicMessage, setDynamicMessage] = useState('');

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    // Efek untuk menampilkan pesan progresif selama proses loading yang panjang
    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];
        if (isLoading) {
            setDynamicMessage(''); // Reset pesan setiap kali loading baru dimulai

            timers.push(setTimeout(() => {
                setDynamicMessage("Merespons sedikit lebih lambat... Ini wajar untuk permintaan yang kompleks. Gendhis tetap bekerja keras untuk Anda, mohon bersabar...");
            }, 15000)); // Pesan pertama setelah 15 detik

            timers.push(setTimeout(() => {
                setDynamicMessage("Proses ini membutuhkan waktu lebih lama dari biasanya. AI sedang menyusun bagian 'Kegiatan Pembelajaran' yang detail. Mohon tetap bersabar.");
            }, 45000)); // Pesan kedua setelah 45 detik

            timers.push(setTimeout(() => {
                setDynamicMessage("Terima kasih atas kesabaran Anda. Proses hampir selesai, AI sedang melakukan finalisasi dokumen.");
            }, 90000)); // Pesan ketiga setelah 90 detik

        } else {
            setDynamicMessage('');
        }

        return () => {
            // Bersihkan semua timer saat komponen di-unmount atau isLoading berubah
            timers.forEach(clearTimeout);
        };
    }, [isLoading]);


    if (!isOpen) {
        return null;
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <>
                    <div className="relative w-20 h-20 mb-6 text-sky-400">
                        <div className="absolute inset-0 bg-sky-500/10 rounded-full animate-ping"></div>
                        <div className="relative w-full h-full flex items-center justify-center bg-slate-800 rounded-full border-2 border-sky-500/50">
                             <i className="fa-solid fa-wand-magic-sparkles text-3xl animate-pulse"></i>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white text-center">Mohon Tunggu Sebentar...</h2>
                    <p className="mt-2 text-slate-300 text-center">
                        {progressMessage || `Gendhis sedang Meracik ${featureName} Anda...`}
                    </p>
                    {/* Area Pesan Progresif */}
                    <div className="h-20 mt-4 flex items-center justify-center">
                        {dynamicMessage && (
                            <div className="text-center p-3 bg-amber-900/50 border border-amber-500/30 rounded-lg animate-fade-in-slow">
                                <p className="text-xs text-amber-300">
                                    {dynamicMessage}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            );
        }

        if (isSuccess) {
            return (
                 <>
                    <div className="relative w-20 h-20 mb-6 text-emerald-400">
                        <div className="relative w-full h-full flex items-center justify-center bg-slate-800 rounded-full border-2 border-emerald-500/50">
                             <i className="fa-solid fa-check text-4xl"></i>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white text-center">Berhasil Dibuat!</h2>
                    <p className="mt-2 text-slate-300 text-center">
                       Dokumen Anda siap untuk diunduh.
                    </p>
                    <button
                        onClick={onClose}
                        className="mt-8 w-full bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all duration-300"
                    >
                        Tampilkan & Unduh
                    </button>
                </>
            );
        }
        return null;
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <style>
                {`
                    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    @keyframes fade-in-slow { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fade-in { animation: fade-in 0.3s ease-out; }
                    .animate-scale-in { animation: scale-in 0.3s ease-out; }
                    .animate-fade-in-slow { animation: fade-in-slow 1s ease-out; }
                `}
            </style>
            <div
                className="bg-slate-900/50 border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center p-8 animate-scale-in"
            >
                {renderContent()}
            </div>
        </div>
    );
};

export default GenerationStatusModal;