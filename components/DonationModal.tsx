
import React, { useEffect, useState } from 'react';

interface DonationModalProps {
    onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ onClose }) => {
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
                className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] animate-scale-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center space-x-4">
                         <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-full text-white shadow-md">
                           <i className="fa-solid fa-hand-holding-dollar text-2xl"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                Satu Donasi, Berjuta Manfaat untuk Pendidikan
                            </h2>
                             <p className="text-sm text-slate-500 dark:text-slate-400">Bantu Gendhis tetap gratis dan terus berinovasi untuk Guru Indonesia.</p>
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
                <div className="p-6 md:p-8 overflow-y-auto">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Kolom Kiri: Narasi & Dampak */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">Misi Kami: Memberdayakan Guru, Mencerahkan Masa Depan.</h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                                    Gendhis lahir dari semangat seorang mahasiswa untuk meringankan beban administrasi guru. Setiap baris kode ditulis dengan harapan agar para pendidik bisa lebih fokus pada murid-muridnya. Donasi Anda adalah bahan bakar yang menjaga semangat ini tetap menyala.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-3">Dampak Donasi Anda:</h4>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex items-center space-x-3">
                                        <i className="fa-solid fa-lock-open text-emerald-500 text-lg w-5 text-center"></i>
                                        <span className="text-slate-700 dark:text-slate-300">Menjaga <strong>Gendhis 100% Gratis</strong> selamanya untuk semua guru.</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <i className="fa-solid fa-graduation-cap text-sky-500 text-lg w-5 text-center"></i>
                                        <span className="text-slate-700 dark:text-slate-300">Mendukung <strong>biaya kuliah</strong> & pengembangan fitur baru oleh developer.</span>
                                    </li>
                                    <li className="flex items-center space-x-3">
                                        <i className="fa-solid fa-server text-indigo-500 text-lg w-5 text-center"></i>
                                        <span className="text-slate-700 dark:text-slate-300">Menjamin <strong>kestabilan server</strong> & biaya perawatan website.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        {/* Kolom Kanan: Metode Donasi */}
                        <div className="space-y-6">
                             <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                 <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Transfer Bank</h4>
                                 <div className="flex items-center space-x-3 mb-2">
                                     <img src="https://res.cloudinary.com/dt1nrarpq/image/upload/v1758018393/960px-Bank_Central_Asia.svg_mekzzu.png" alt="BCA Logo" className="h-5"/>
                                     <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Bank Central Asia (BCA)</p>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">a.n. Ari Wijaya</p>
                                     </div>
                                 </div>
                                 <div className="relative flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-md border dark:border-slate-600">
                                     <span className="font-mono text-lg text-sky-600 dark:text-sky-400 tracking-wider">4640123414</span>
                                     <button onClick={handleCopy} className={`text-sm font-semibold px-3 py-1 rounded ${copySuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600' } transition-all duration-300`} title="Salin Nomor Rekening">
                                         {copySuccess ? <><i className="fa-solid fa-check mr-2"></i>Tersalin!</> : <><i className="fa-solid fa-copy mr-2"></i>Salin</>}
                                     </button>
                                 </div>
                            </div>
                            <div className="text-center bg-white dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shadow-inner">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-3">Donasi Cepat & Mudah via QRIS</h4>
                                <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-200">
                                    <img 
                                        src="https://res.cloudinary.com/dt1nrarpq/image/upload/v1758018323/WhatsApp_Image_2025-09-16_at_17.22.21_a602c769_cjedo0.jpg" 
                                        alt="QRIS Donation Code" 
                                        className="w-48 h-48 object-contain rounded-md shadow-lg"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">Mendukung semua E-Wallet & Mobile Banking (GoPay, OVO, Dana, dll.)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">Berapapun donasi Anda, kami sangat menghargainya. Terima kasih, Pahlawan Pendidikan!</p>
                    <button
                        onClick={onClose}
                        className="bg-slate-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-300"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DonationModal;