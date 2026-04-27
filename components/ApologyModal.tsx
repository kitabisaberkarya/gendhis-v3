
import React, { useEffect, useState } from 'react';

interface ApologyModalProps {
    onClose: () => void;
}

const ApologyModal: React.FC<ApologyModalProps> = ({ onClose }) => {
    const [copySuccess, setCopySuccess] = useState(false);

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

    const handleCopy = () => {
        navigator.clipboard.writeText('4640123414');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <style>
                {`
                    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scale-in { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                    .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                    .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                `}
            </style>
            <div
                className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-scale-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center space-x-4">
                         <div className="bg-gradient-to-br from-rose-500 to-red-600 p-3 rounded-full text-white shadow-md">
                           <i className="fa-solid fa-heart-crack text-2xl"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                Sebuah Pesan dari Hati Tim Gendhis
                            </h2>
                             <p className="text-sm text-slate-500 dark:text-slate-400">Pemberitahuan Penting untuk Para Guru Hebat.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Tutup modal"
                        className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                    <p>Dengan berat hati, kami ingin menyampaikan <strong>permohonan maaf yang tulus</strong>.</p>
                    <p>
                        Baru-baru ini, kami menemukan adanya penyalahgunaan aplikasi Gendhis oleh beberapa oknum untuk tujuan komersial. Tindakan ini sangat bertentangan dengan semangat awal Gendhis: yaitu sebagai alat bantu yang <strong className="text-emerald-500">sepenuhnya gratis</strong> untuk memberdayakan guru di seluruh Indonesia.
                    </p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                        Untuk menjaga integritas dan tujuan mulia aplikasi ini, kami terpaksa menonaktifkan sementara fitur ini.
                    </p>
                    <p>
                        Perlu Bapak/Ibu ketahui, menjaga Gendhis agar tetap dapat diakses secara gratis membutuhkan biaya operasional yang tidak sedikit, terutama untuk server dan layanan pihak ketiga yang menopang teknologi AI kami.
                    </p>

                    <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-700/50 space-y-4">
                        <h3 className="font-bold text-lg text-center text-sky-800 dark:text-sky-300">Dukung Misi Kami, Jaga Gendhis Tetap Gratis</h3>
                        <p className="text-center">
                            Jika Bapak/Ibu merasa Gendhis telah memberikan manfaat dan ingin mendukung keberlangsungannya, kami akan sangat berterima kasih atas <strong className="font-semibold">donasi seikhlasnya</strong> melalui:
                        </p>
                         <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                             <div className="flex items-center space-x-3 mb-2">
                                 <img src="https://res.cloudinary.com/dt1nrarpq/image/upload/v1758018393/960px-Bank_Central_Asia.svg_mekzzu.png" alt="BCA Logo" className="h-5"/>
                                 <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Bank Central Asia (BCA)</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">a.n. Ari Wijaya</p>
                                 </div>
                             </div>
                             <div className="relative flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-md border dark:border-slate-600">
                                 <span className="font-mono text-base text-sky-600 dark:text-sky-400 tracking-wider">4640123414</span>
                                 <button onClick={handleCopy} className={`text-sm font-semibold px-3 py-1 rounded ${copySuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600' } transition-all duration-300`} title="Salin Nomor Rekening">
                                     {copySuccess ? <><i className="fa-solid fa-check mr-2"></i>Tersalin!</> : <><i className="fa-solid fa-copy mr-2"></i>Salin</>}
                                 </button>
                             </div>
                        </div>
                        <a href="https://wa.me/6282134894442" target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-green-600 dark:text-green-400 hover:underline">
                             <i className="fa-brands fa-whatsapp mr-1"></i> Klik di sini untuk informasi atau konfirmasi via WhatsApp
                        </a>
                    </div>
                     <p className="text-center text-xs text-slate-500 dark:text-slate-400 italic pt-2">
                        Setiap dukungan Anda adalah bahan bakar bagi kami untuk terus berkarya dan memastikan Gendhis tetap menjadi sahabat setia para Pahlawan Pendidikan. Terima kasih atas pengertian Anda.
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-right">
                    <button
                        onClick={onClose}
                        className="bg-sky-600 text-white font-semibold py-2.5 px-8 rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-300 transform hover:scale-105"
                    >
                        Mengerti
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApologyModal;
