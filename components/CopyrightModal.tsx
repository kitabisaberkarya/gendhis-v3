import React, { useEffect } from 'react';
import { SparklesIcon } from './IconComponents';

interface CopyrightModalProps {
    onClose: () => void;
}

const CopyrightModal: React.FC<CopyrightModalProps> = ({ onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);
    
    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } @keyframes scale-in { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } } .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); } .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }`}</style>
            <div
                className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-scale-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center space-x-3">
                        <div className="bg-sky-100 dark:bg-sky-900/50 p-2 rounded-full">
                           <SparklesIcon />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                            Pemberitahuan Hak Cipta
                        </h2>
                    </div>
                    <button onClick={onClose} aria-label="Tutup modal" className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 dark:text-slate-300">
                     <div className="text-center p-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">ID Sertifikat Hak Cipta Digital</p>
                        <p className="font-mono tracking-widest text-base text-sky-600 dark:text-sky-400 mt-1">GNDS250916-110789-KMP01-B5E7</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><i className="fa-solid fa-gavel text-slate-400 dark:text-slate-500"></i>Perlindungan Hukum</h3>
                        <p>Aplikasi <strong>Gendhis</strong> ini secara penuh dilindungi oleh <strong className="font-semibold">Undang-Undang No. 28 Tahun 2014 tentang Hak Cipta.</strong></p>
                    </div>
                    <div className="space-y-2 p-4 border border-yellow-300 dark:border-yellow-600/50 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 flex items-center"><i className="fa-solid fa-triangle-exclamation mr-2"></i>Sanksi Pelanggaran (Pasal 113 ayat 3)</h3>
                        <p className="text-yellow-700 dark:text-yellow-400">Setiap orang yang tanpa hak dan/atau tanpa izin Pencipta atau pemegang Hak Cipta melakukan pelanggaran hak ekonomi Pencipta [...] untuk Penggunaan Secara Komersial dipidana dengan pidana penjara paling lama <strong>4 (empat) tahun</strong> dan/atau pidana denda paling banyak <strong>Rp1.000.000.000,00 (satu miliar rupiah)</strong>.</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><i className="fa-solid fa-robot text-slate-400 dark:text-slate-500"></i>Monitoring AI 24/7</h3>
                        <p>Aplikasi ini dimonitor oleh kecerdasan buatan (AI) 24/7 untuk mendeteksi segala bentuk penyalahgunaan, duplikasi, atau pelanggaran hak cipta lainnya.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                            Informasi Pengembang: <span className="font-bold text-sky-500 dark:text-sky-400">Ari Wijaya</span>
                        </h3>

                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <a href="mailto:ariwjaya56@guru.smk.belajar.id" className="group flex items-center justify-center gap-2 text-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors duration-200"><i className="fa-solid fa-envelope text-sky-500"></i><span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400">Email</span></a>
                            <a href="https://wa.me/6282134894442" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-center gap-2 text-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors duration-200"><i className="fa-brands fa-whatsapp text-green-500"></i><span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-green-600 dark:group-hover:text-green-400">WhatsApp</span></a>
                            <a href="https://www.youtube.com/@kitabisaberkarya" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-center gap-2 text-center p-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors duration-200"><i className="fa-brands fa-youtube text-red-500"></i><span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400">YouTube</span></a>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-right">
                    <button onClick={onClose} className="bg-sky-600 text-white font-semibold py-2.5 px-8 rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-300 transform hover:scale-105">
                        Mengerti
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CopyrightModal;