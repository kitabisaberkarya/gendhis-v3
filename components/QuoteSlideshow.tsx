
import React, { useState, useEffect, useCallback } from 'react';

const quotes = [
    {
        text: "Guru Haruslah Fokus untuk Mendidik, Mengayomi, dan Pendekatan secara Mendalam, terhadap Murid yang di Didiknya. Janganlah Terlalu Pusing Memikirkan Letter, terutama RPM, karena itu saya Berinovasi membuat Mesin Generate bernama Gendhis ini Supaya Semua Guru di Indonesia tidak di Pusingkan dengan RPM dan administrasi lainnya, selamat Berkarya Bapak Ibu Guru di Indonesia. BERGERAK - BERKARYA - BERDAMPAK",
    },
    {
        text: "Fokuskan energi Anda pada pembentukan karakter dan penemuan potensi setiap murid, karena warisan sejati seorang guru bukanlah tumpukan kertas, melainkan jejak inspirasi yang abadi di hati generasi penerus. Teruslah menyalakan lilin pengetahuan.",
    },
    {
        text: "Administrasi adalah catatan, namun interaksi di kelas adalah inti dari pendidikan. Biarkan semangat mengajar Anda lebih besar dari beban kerja, karena sentuhan tulus seorang guru akan membentuk masa depan yang lebih cerah bagi bangsa.",
    },
    {
        text: "Tugas utama kita adalah membangun jiwa, bukan sekadar mengisi angka dalam laporan. Mengajar dengan hati adalah inovasi terbaik yang tak akan pernah tergantikan oleh sistem apapun. Teruslah menjadi pahlawan di dalam dan di luar kelas.",
    },
    {
        text: "Jangan biarkan birokrasi memadamkan api pengabdian Anda. Ingatlah selalu alasan pertama Anda memilih profesi mulia ini: untuk membimbing, mencerahkan, dan menjadi teladan. Siswa Anda lebih membutuhkan kehadiran Anda daripada kesempurnaan administrasi.",
    },
    {
        text: "Di tengah tuntutan zaman yang terus berubah, pegang teguh esensi menjadi pendidik: ciptakan ruang aman untuk bertumbuh, jadilah pendengar yang baik bagi setiap keluh kesah, dan rayakan setiap pencapaian kecil murid Anda. Itulah karya terbesar seorang guru.",
    }
];

const author = {
    name: "Ari Wijaya",
    dedication: "Dedikasi untuk Guru Indonesia"
};

const QuoteSlideshow: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    const handleNextQuote = useCallback(() => {
        setIsFading(true);
        setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % quotes.length);
            setIsFading(false);
        }, 500); // Durasi fade out
    }, []);

    useEffect(() => {
        const timer = setInterval(handleNextQuote, 8000); // Ganti kutipan setiap 8 detik
        return () => clearInterval(timer);
    }, [handleNextQuote]);

    const goToQuote = (index: number) => {
        if (index === currentIndex) return;
        setIsFading(true);
        setTimeout(() => {
            setCurrentIndex(index);
            setIsFading(false);
        }, 500);
    };

    return (
        <div className="text-center mb-12 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
            <div className="relative min-h-[160px] sm:min-h-[120px] flex items-center justify-center">
                <p className={`text-base italic text-slate-600 dark:text-slate-400 leading-relaxed transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                    "{quotes[currentIndex].text}"
                </p>
            </div>
             <p className="mt-4 text-sm font-semibold text-sky-600 dark:text-sky-400">
                - {author.name} - <span className="font-normal">{author.dedication}</span>
            </p>
            <div className="flex justify-center space-x-2 mt-6">
                {quotes.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToQuote(index)}
                        aria-label={`Go to quote ${index + 1}`}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-5 bg-sky-500' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default QuoteSlideshow;
