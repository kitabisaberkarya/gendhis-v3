import React from 'react';
import { ArrowLeftIcon } from './IconComponents';

interface CreatorBioCardProps {
    onBack: () => void;
}

const CreatorBioCard: React.FC<CreatorBioCardProps> = ({ onBack }) => {
    const bannerImageUrl = 'https://res.cloudinary.com/dt1nrarpq/image/upload/v1761307223/WhatsApp_Image_2025-09-13_at_11.09.27_3728ee73_wivnot.jpg';

    return (
        <div className="w-full max-w-5xl mx-auto px-4">
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-sm text-sky-600 hover:underline dark:text-sky-400 mb-8"
            >
                <ArrowLeftIcon />
                <span>Kembali ke Beranda</span>
            </button>

            <div className="relative group rounded-2xl overflow-hidden">
                {/* --- Background & Border Glow --- */}
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 via-purple-500 to-rose-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-90 transition-all duration-500"></div>

                <div className="relative grid md:grid-cols-5 bg-slate-900 border border-slate-700 rounded-2xl text-white">
                    {/* --- Image Section --- */}
                    <div className="md:col-span-2">
                        <img 
                            src={bannerImageUrl} 
                            alt="Foto Ari Wijaya" 
                            className="w-full h-full object-cover object-top"
                        />
                    </div>

                    {/* --- Content Section --- */}
                    <div className="md:col-span-3 p-8 flex flex-col justify-center">
                        <span className="text-sm font-semibold text-sky-400 uppercase tracking-widest mb-2">
                            Sang Inovator di Balik Gendhis
                        </span>
                        <h2 className="text-4xl font-extrabold tracking-tight mb-2 [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                            Ari Wijaya
                        </h2>
                        <p className="text-lg font-medium text-slate-300">
                            Guru Koding & Kecerdasan Artifisial
                        </p>
                        <p className="text-md text-slate-400 flex items-center gap-2 mt-1">
                            <i className="fa-solid fa-school text-slate-500"></i>
                            SMK DR. SOETOMO SURABAYA
                        </p>

                        <div className="my-6 border-t border-slate-700"></div>

                        <blockquote className="italic text-slate-300 leading-relaxed">
                            "Gendhis adalah wujud nyata dari keyakinan saya: teknologi harus menjadi jembatan, bukan beban. Misi saya adalah membebaskan para guru dari rutinitas administrasi, agar mereka dapat kembali fokus pada esensi sejati pendidikan—menginspirasi dan membentuk generasi masa depan."
                        </blockquote>

                        <div className="mt-8 flex items-center gap-4">
                            <a href="https://wa.me/6282134894442" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-center py-2 px-5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 transition-all duration-300 transform hover:scale-105">
                                <i className="fa-brands fa-whatsapp"></i>
                                <span>Hubungi Saya</span>
                            </a>
                            <a href="https://www.youtube.com/@kitabisaberkarya" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-center py-2 px-5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold border border-red-500/30 transition-all duration-300 transform hover:scale-105">
                                <i className="fa-brands fa-youtube"></i>
                                <span>Kanal YouTube</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatorBioCard;