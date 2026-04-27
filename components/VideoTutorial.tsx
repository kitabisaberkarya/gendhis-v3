import React, { useState, useRef } from 'react';

const VideoTutorial: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoContainerRef = useRef<HTMLDivElement>(null);

    // URL YouTube diubah menjadi format 'embed' dan dinamis dengan parameter autoplay
    const embedUrl = `https://www.youtube.com/embed/gSMkiwtBooI${isPlaying ? '?autoplay=1&rel=0' : '?rel=0'}`;

    const handlePlayAndFullscreen = () => {
        setIsPlaying(true);
        // Meminta fullscreen pada elemen container setelah state diatur.
        // Diberi jeda singkat untuk memastikan iframe sempat memuat URL baru sebelum fullscreen.
        setTimeout(() => {
            if (videoContainerRef.current && videoContainerRef.current.requestFullscreen) {
                videoContainerRef.current.requestFullscreen().catch(err => {
                    console.warn("Gagal masuk ke mode fullscreen:", err.message);
                });
            }
        }, 50);
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 my-16">
            {/* The main container with background and effects */}
            <div className="relative bg-slate-900 border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
                
                {/* Animated background blobs */}
                <div className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-4000"></div>

                {/* Grid layout for content */}
                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center p-8 md:p-12">
                    
                    {/* Left Column: Text Content */}
                    <div className="text-center md:text-left">
                        <div className="inline-block bg-cyan-400/10 text-cyan-400 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                            PANDUAN CEPAT
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                            Lihat Gendhis<br />Beraksi
                        </h2>
                        <p className="text-lg text-slate-400 mb-8 max-w-md mx-auto md:mx-0">
                            Pelajari cara mengubah ide menjadi dokumen profesional hanya dalam beberapa menit. Tonton tutorial ini untuk memulai.
                        </p>
                        
                        <ul className="space-y-4 text-left max-w-md mx-auto md:mx-0">
                            <li className="flex items-center space-x-3">
                                <i className="fa-solid fa-check-circle text-emerald-400"></i>
                                <span className="text-slate-300">Buat RPM lengkap secara instan.</span>
                            </li>
                             <li className="flex items-center space-x-3">
                                <i className="fa-solid fa-check-circle text-emerald-400"></i>
                                <span className="text-slate-300">Generate Kartu Soal & Kisi-kisi.</span>
                            </li>
                             <li className="flex items-center space-x-3">
                                <i className="fa-solid fa-check-circle text-emerald-400"></i>
                                <span className="text-slate-300">Download hasil dalam format Word.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Right Column: Video Player */}
                    <div className="relative group [perspective:1000px]">
                        {/* Glow effect */}
                        <div className="absolute -inset-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                        
                        {/* Video container with 3D hover effect */}
                        <div 
                            ref={videoContainerRef}
                            className="relative w-full overflow-hidden rounded-xl [transform-style:preserve-3d] group-hover:[transform:rotateY(3deg)_scale(1.05)] transition-transform duration-500 shadow-2xl" 
                            style={{ paddingTop: '56.25%' }}
                        >
                            <iframe
                                className="absolute top-0 left-0 w-full h-full border-2 border-slate-700/50 rounded-xl"
                                src={embedUrl}
                                title="Tutorial Penggunaan Aplikasi Gendhis"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                allowFullScreen
                            ></iframe>
                            
                            {!isPlaying && (
                                <div
                                    onClick={handlePlayAndFullscreen}
                                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/40 group-hover:bg-black/20 transition-colors duration-300"
                                    aria-label="Putar dan tampilkan video dalam mode layar penuh"
                                >
                                    <div className="w-20 h-20 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                                        <svg className="w-10 h-10 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
             <style>
                {`
                    .animation-delay-4000 {
                        animation-delay: 4s;
                    }
                `}
            </style>
        </div>
    );
};

export default VideoTutorial;