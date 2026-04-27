import React, { useEffect } from 'react';
import Spinner from './Spinner';

type PaymentStatus = 'loading' | 'success' | 'error';

interface PaymentStatusModalProps {
    isOpen: boolean;
    status: PaymentStatus;
    errorMessage?: string;
    onClose: () => void;
    onRetry?: () => void;
}

// FIX: Replaced JSX.Element with React.ReactNode to resolve the "Cannot find namespace 'JSX'" error.
const statusConfig: Record<PaymentStatus, { icon: React.ReactNode; color: 'sky' | 'emerald' | 'rose' | 'amber'; title: string; description: string }> = {
    loading: {
        icon: <i className="fa-solid fa-wand-magic-sparkles text-3xl animate-pulse"></i>,
        color: 'sky',
        title: 'Menghubungi Server...',
        description: 'Sedang memproses permintaan Anda. Mohon tunggu sebentar.',
    },
    success: {
        icon: <i className="fa-solid fa-lock-open text-3xl"></i>,
        color: 'emerald',
        title: 'Akses Berhasil Dibuka!',
        description: 'Dokumen Anda sekarang siap untuk diunduh. Silakan lanjutkan.',
    },
    error: {
        icon: <i className="fa-solid fa-circle-xmark text-4xl"></i>,
        color: 'rose',
        title: 'Terjadi Kesalahan',
        description: 'Proses tidak dapat dilanjutkan.',
    },
};


const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({ isOpen, status, errorMessage, onClose, onRetry }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const config = statusConfig[status];
    const colorClasses = {
        sky: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/50' },
        amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50' },
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50' },
        rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/50' },
    };
    const currentTheme = colorClasses[config.color];


    return (
        <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <style>
                {`
                    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    .animate-fade-in { animation: fade-in 0.3s ease-out; }
                    .animate-scale-in { animation: scale-in 0.3s ease-out; }
                `}
            </style>
            <div
                className={`bg-slate-900/50 border ${currentTheme.border} rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center p-8 animate-scale-in`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`relative w-20 h-20 mb-6 ${currentTheme.text}`}>
                    <div className={`absolute inset-0 ${currentTheme.bg} rounded-full animate-ping-slow`}></div>
                    <div className={`relative w-full h-full flex items-center justify-center bg-slate-800 rounded-full border-2 ${currentTheme.border}`}>
                        {config.icon}
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white text-center">{config.title}</h2>
                <p className="mt-2 text-slate-300 text-center text-sm">
                    {errorMessage || config.description}
                </p>

                <div className="mt-8 w-full space-y-3">
                    {status === 'success' && (
                        <button
                            onClick={onClose}
                            className="w-full bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all duration-300"
                        >
                            Lanjutkan & Unduh
                        </button>
                    )}
                    {status === 'error' && onRetry && (
                         <button
                            onClick={onRetry}
                            className="w-full bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 transition-all duration-300"
                        >
                            Coba Lagi
                        </button>
                    )}
                     {status === 'error' && (
                         <button
                            onClick={onClose}
                            className="w-full bg-slate-600/50 text-slate-300 font-semibold py-2 px-4 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-all duration-300"
                        >
                           Tutup
                        </button>
                    )}
                </div>
            </div>
            <style>{`.animate-ping-slow { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }`}</style>
        </div>
    );
};

export default PaymentStatusModal;
