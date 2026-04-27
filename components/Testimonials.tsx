import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeftIcon } from './IconComponents';
// FIX: Import TestimonialData from the correct types file, not the service file.
import { getTestimonials, submitTestimonial } from '../services/supabaseService';
import type { TestimonialData } from '../types';
import Spinner from './Spinner';

// Palet warna yang cerah dan solid sesuai permintaan pengguna
const cardThemes = [
    { 
        card: 'bg-[#55efc4] border-emerald-700/20', // Mint Green
        message: 'text-slate-800/90', 
        author: 'text-slate-900 font-bold', 
        school: 'text-emerald-900',
        divider: 'border-slate-800/20'
    },
    { 
        card: 'bg-[#fab1a0] border-rose-700/20', // Light Salmon
        message: 'text-slate-800/90', 
        author: 'text-slate-900 font-bold', 
        school: 'text-rose-900',
        divider: 'border-slate-800/20'
    },
    { 
        card: 'bg-[#a29bfe] border-purple-700/20', // Light Purple
        message: 'text-slate-800/90', 
        author: 'text-slate-900 font-bold', 
        school: 'text-purple-900',
        divider: 'border-slate-800/20'
    },
    { 
        card: 'bg-[#ffeaa7] border-amber-700/20', // Light Yellow
        message: 'text-slate-800/90', 
        author: 'text-slate-900 font-bold', 
        school: 'text-amber-900',
        divider: 'border-slate-800/20'
    },
    { 
        card: 'bg-[#576574] border-slate-400/20', // Dark Grey
        message: 'text-white/90', 
        author: 'text-white font-bold', 
        school: 'text-slate-300',
        divider: 'border-white/20'
    },
];

const Testimonials: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // State untuk data dari Supabase
    const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
    const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Memuat testimoni saat komponen dimuat
    useEffect(() => {
        const fetchTestimonials = async () => {
            setIsLoadingTestimonials(true);
            setFetchError(null);
            try {
                const data = await getTestimonials();
                setTestimonials(data);
            } catch (error) {
                 if (error instanceof Error) {
                    setFetchError(`Kesalahan saat mengambil testimoni: ${error.message}`);
                } else {
                    setFetchError('Terjadi kesalahan yang tidak diketahui saat mengambil testimoni.');
                }
                console.error('Error fetching testimonials:', error);
            } finally {
                setIsLoadingTestimonials(false);
            }
        };

        fetchTestimonials();
    }, []);

    // State untuk formulir
    const [name, setName] = useState('');
    const [school, setSchool] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    
    // Logika untuk menduplikasi testimoni agar loop marquee terlihat mulus
    const loopedTestimonials = useMemo(() => {
        if (testimonials.length === 0) return [];

        // Pastikan ada cukup item untuk efek loop yang mulus, terutama jika hanya ada 1 atau 2 testimoni.
        const minItemsForLoop = 5; // Mengurangi jumlah duplikasi
        if (testimonials.length > 0 && testimonials.length < minItemsForLoop) {
            const repeatCount = Math.ceil(minItemsForLoop / testimonials.length);
            return Array(repeatCount).fill(testimonials).flat();
        }
        return testimonials;
    }, [testimonials]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !school.trim() || !message.trim()) return;
        
        setIsSubmitting(true);
        setSubmitError(null);
        
        const result = await submitTestimonial({ name, school, message });

        setIsSubmitting(false);

        if (!result.success) {
            console.error('Error submitting testimonial:', result.error);
            setSubmitError('Gagal mengirim testimoni. Silakan coba lagi.');
        } else {
            setSubmitted(true);
            setName('');
            setSchool('');
            setMessage('');
            setTimeout(() => setSubmitted(false), 5000);
        }
    };
    
    // --- Logika Carousel Interaktif ---
    const marqueeRef = useRef<HTMLDivElement>(null);
    const position = useRef(0);
    const isDragging = useRef(false);
    const startPos = useRef(0);
    const animationFrameId = useRef<number | null>(null);
    const [isHovering, setIsHovering] = useState(false);

    const animateMarquee = useCallback(() => {
        if (marqueeRef.current && !isDragging.current && !isHovering) {
            position.current -= 0.5; // Kecepatan scroll
            const marqueeWidth = marqueeRef.current.scrollWidth / 2;
            if (Math.abs(position.current) >= marqueeWidth) {
                position.current += marqueeWidth;
            }
            marqueeRef.current.style.transform = `translateX(${position.current}px)`;
        }
        animationFrameId.current = requestAnimationFrame(animateMarquee);
    }, [isHovering]);

    useEffect(() => {
        // Hanya mulai animasi jika ada testimoni
        if (loopedTestimonials.length > 0) {
            animationFrameId.current = requestAnimationFrame(animateMarquee);
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [animateMarquee, loopedTestimonials]);

    const handleDragStart = (clientX: number) => {
        if (!marqueeRef.current) return;
        isDragging.current = true;
        startPos.current = clientX - position.current;
        marqueeRef.current.style.cursor = 'grabbing';
        marqueeRef.current.style.userSelect = 'none';
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging.current || !marqueeRef.current) return;
        position.current = clientX - startPos.current;
        marqueeRef.current.style.transform = `translateX(${position.current}px)`;
    };

    const handleDragEnd = () => {
        if (!marqueeRef.current) return;
        isDragging.current = false;
        marqueeRef.current.style.cursor = 'grab';
        marqueeRef.current.style.userSelect = 'auto';
    };

    const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.pageX);
    const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.pageX);
    const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
    const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
            <button onClick={onBack} className="flex items-center space-x-2 text-sm text-indigo-600 hover:underline dark:text-indigo-400 mb-8">
                <ArrowLeftIcon />
                <span>Kembali ke Menu Utama</span>
            </button>

            {/* Bagian Pengiriman Testimoni */}
            <div className="mb-20">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Bagikan Pengalaman Anda</h2>
                    <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">Kami senang mendengar pendapat Anda tentang Gendhis!</p>
                </div>
                
                <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg">
                    {submitted ? (
                        <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 rounded-lg animate-fade-in-up">
                            <style>{`@keyframes fade-in-up { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }`}</style>
                            <i className="fa-solid fa-check-circle text-4xl text-emerald-500 mb-3"></i>
                            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Terima Kasih!</h3>
                            <p className="text-emerald-700 dark:text-emerald-400 mt-1">Testimoni Anda telah kami terima dan akan segera kami tampilkan setelah proses moderasi.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nama Lengkap</label>
                                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:placeholder-slate-400 dark:text-white transition" placeholder="Contoh : Ari Wijaya" required />
                                </div>
                                <div>
                                    <label htmlFor="school" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Asal Sekolah</label>
                                    <input type="text" id="school" value={school} onChange={(e) => setSchool(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:placeholder-slate-400 dark:text-white transition" placeholder="SMK Nusantara" required />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Testimoni Anda</label>
                                <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:placeholder-slate-400 dark:text-white transition" placeholder="Ceritakan bagaimana Gendhis membantu Anda..." required></textarea>
                            </div>
                            {submitError && <p className="text-sm text-red-600 text-center">{submitError}</p>}
                            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300">
                                {isSubmitting ? <Spinner /> : <i className="fa-solid fa-paper-plane"></i>}
                                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Testimoni'}</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Carousel Testimoni */}
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Apa Kata Para Guru</h2>
                <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">Lihat pengalaman para pendidik lain yang telah menggunakan Gendhis.</p>
            </div>
            
            <div className="w-full">
                 {isLoadingTestimonials ? (
                     <div className="flex items-center justify-center h-48">
                         <p className="text-slate-500 dark:text-slate-400">Memuat testimoni...</p>
                     </div>
                ) : fetchError ? (
                     <div className="flex items-center justify-center h-48 text-center bg-red-50 p-4 rounded-lg border border-red-200">
                         <p className="text-red-600">{fetchError}</p>
                     </div>
                ) : testimonials.length === 0 ? (
                    <div className="flex items-center justify-center h-48">
                         <p className="text-slate-500 dark:text-slate-400">Belum ada testimoni. Jadilah yang pertama!</p>
                     </div>
                ) : (
                    <div 
                        className="relative w-full overflow-hidden cursor-grab"
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => { setIsHovering(false); handleDragEnd(); }}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={handleDragEnd}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={handleDragEnd}
                    >
                        <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>

                        <div ref={marqueeRef} className="flex w-max">
                            {[...loopedTestimonials, ...loopedTestimonials].map((testimonial, index) => {
                                // Gunakan index dari map untuk menggilir warna secara terus-menerus
                                const theme = cardThemes[index % cardThemes.length];
                                
                                return (
                                    <div key={`${testimonial.id}-${index}`} className={`flex-shrink-0 w-[320px] p-6 rounded-2xl border flex flex-col text-center shadow-lg transition-transform duration-300 hover:-translate-y-1.5 mx-3 ${theme.card}`}>
                                        <p className={`italic text-base leading-relaxed flex-grow ${theme.message}`}>"{testimonial.message}"</p>
                                        <div className={`mt-4 pt-4 border-t ${theme.divider}`}>
                                            <p className={`text-lg ${theme.author}`}>{testimonial.name}</p>
                                            <p className={`text-sm mt-1 ${theme.school}`}>{testimonial.school}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Testimonials;