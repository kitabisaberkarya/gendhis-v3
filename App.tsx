
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import RpmGenerator from './components/RpmGenerator';
import RpsGenerator from './components/RpsGenerator';
import RpdGenerator from './components/RpdGenerator';
import AtpGenerator from './components/AtpGenerator';
import JournalGenerator from './components/JournalGenerator';
import CkGenerator from './components/CkGenerator';
import CopyrightModal from './components/CopyrightModal';
import { AppView } from './types';
import { ClipboardDocumentListIcon, DocumentTextIcon, CommentsIcon, HandHoldingDollarIcon, ChalkboardUserIcon, GraduationCapIcon, UserTieIcon, SitemapIcon, BookJournalWhillsIcon, ChartLineIcon, ShoppingBagIcon, AwardIcon } from './components/IconComponents';
import QuestionCardGenerator from './components/QuestionCardGenerator';
import Testimonials from './components/Testimonials';
import DonationModal from './components/DonationModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import QuoteSlideshow from './components/QuoteSlideshow';
import { logUsage, getFeatureToggles, getSettings, onAuthStateChange, getSession } from './services/supabaseService';
import ApologyModal from './components/ApologyModal';
import VideoTutorial from './components/VideoTutorial';
import CreatorBioCard from './components/CreatorBioCard';
import AuthModal from './components/AuthModal';
import type { Session } from '@supabase/supabase-js';
import AdminDashboard from './components/AdminDashboard';
import CreditStore from './components/CreditStore';
import AdminLoginModal from './components/AdminLoginModal';

const UniqueSellingPoint: React.FC = () => {
    return (
        <div className="w-full max-w-5xl mx-auto px-4 my-16">
            <div className="relative group bg-gradient-to-br from-[#384c64] to-[#1f2937] rounded-2xl shadow-xl shadow-slate-900/50 overflow-hidden p-8 text-center border border-slate-700">
                <div 
                    className="absolute inset-0 z-0 opacity-20" 
                    style={{ 
                        backgroundImage: `
                            linear-gradient(to right, rgba(34, 211, 238, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
                        `, 
                        backgroundSize: '2rem 2rem' 
                    }}
                ></div>
                <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#1f2937]/50 to-transparent z-0"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-6">
                        <div className="absolute -inset-2.5 bg-cyan-500 rounded-full opacity-50 blur-xl group-hover:opacity-75 transition-opacity duration-500 animate-pulse"></div>
                        <div className="relative w-20 h-20 flex items-center justify-center bg-slate-800 rounded-full border-2 border-cyan-500/50">
                            <i className="fa-solid fa-trophy text-4xl text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]"></i>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-1 rounded-md shadow-lg transform rotate-12 border border-amber-300">
                            EST. 2021
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-cyan-400 mb-2 tracking-tight [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                        Nomor Satu di Indonesia
                    </h2>
                    <p className="text-lg text-cyan-500/80 mb-6 font-medium">
                        Pionir Ekosistem Administrasi Guru Berbasis AI Sejak 2021.
                    </p>
                    <p className="max-w-3xl mx-auto text-base text-slate-300 leading-relaxed">
                        Gendhis dirancang dari hati, untuk menjadi solusi nyata bagi tantangan administrasi yang dihadapi para pahlawan pendidikan. Kami bangga menjadi pelopor aplikasi generator dokumen cerdas yang sepenuhnya <span className="font-semibold text-emerald-400">gratis</span>, <span className="font-semibold text-amber-400">aman</span>, dan berpihak pada kemajuan guru di seluruh nusantara.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Komponen Baru: Promo Gendhis Portable
const GendhisPortablePromo: React.FC = () => {
    return (
        <div className="w-full max-w-5xl mx-auto px-4 mb-12">
            <div className="relative group overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-slate-900 shadow-2xl shadow-amber-500/10 transition-all duration-500 hover:shadow-amber-500/20 hover:border-amber-500/50">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] animate-pulse"></div>
                
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 gap-6">
                    
                    {/* Left Side: Copy */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-md shadow-sm">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">Kabar Gembira 2026</span>
                        </div>

                        <div>
                            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300">Gendhis Portable</span> 
                                <span className="text-slate-400 ml-2 text-2xl font-light">Lisensi Resmi</span>
                            </h2>
                            <p className="text-slate-300 mt-2 text-sm sm:text-base leading-relaxed">
                                Solusi <strong className="text-emerald-400">Anti-Overload</strong>. Berjalan di perangkat Anda sendiri, lebih cepat, stabil, dan sepenuhnya mengacu pada <strong className="text-white">Standar Kerangka Kementerian Pendidikan Indonesia</strong>.
                            </p>
                        </div>

                        {/* Business Opportunity Box */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 cursor-default group/box">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg shadow-lg group-hover/box:scale-110 transition-transform duration-300">
                                    <i className="fa-solid fa-money-bill-trend-up text-white text-lg"></i>
                                </div>
                                <div>
                                    <h4 className="text-amber-300 font-bold text-sm uppercase tracking-wide">Peluang Bisnis Digital Tanpa Batas</h4>
                                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                        Ajak sekolah & rekan guru menggunakan Gendhis Portable. Dapatkan penghasilan tambahan sebagai <span className="text-white font-semibold">Reseller Resmi</span>. Kami sediakan Marketing Kit Lengkap!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: CTA Buttons */}
                    <div className="flex flex-col w-full md:w-auto gap-3 min-w-[280px]">
                        <a 
                            href="https://whatsapp.com/channel/0029Vb6VZRXCxoAwg6OWSk0A" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:shadow-green-500/40 border border-green-500/50"
                        >
                            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
                            <div className="relative flex items-center justify-center gap-3">
                                <i className="fa-brands fa-whatsapp text-3xl"></i>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-medium opacity-90 uppercase tracking-wider text-green-100">Gabung Saluran Resmi</span>
                                    <span className="text-sm font-bold text-white">Gendhis Official Updates 📢</span>
                                </div>
                            </div>
                        </a>

                        <a 
                            href="https://gemini.google.com/share/4aa6ef72fb23" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group rounded-xl bg-slate-800 border border-slate-600 p-4 text-center font-semibold text-slate-300 transition-all hover:bg-slate-700 hover:border-slate-500 hover:text-white shadow-lg"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <i className="fa-solid fa-file-contract text-amber-400 group-hover:animate-pulse"></i>
                                <span>Cek Detail Lisensi & Demo</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<AppView>(AppView.MainMenu);
    const [isCopyrightModalOpen, setIsCopyrightModalOpen] = useState(false);
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [isApologyModalOpen, setIsApologyModalOpen] = useState(false);
    const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

    const [isRpmEnabled, setIsRpmEnabled] = useState<boolean>(true);
    const [isQuestionCardEnabled, setIsQuestionCardEnabled] = useState<boolean>(true);
    const [isRpsEnabled, setIsRpsEnabled] = useState<boolean>(true);
    const [isRpdEnabled, setIsRpdEnabled] = useState<boolean>(true);
    const [isAtpEnabled, setIsAtpEnabled] = useState<boolean>(true);
    const [isJournalEnabled, setIsJournalEnabled] = useState<boolean>(true);
    const [isCkEnabled, setIsCkEnabled] = useState<boolean>(true); 
    const [isClientApiKeyEnabled, setIsClientApiKeyEnabled] = useState<boolean>(true);
    const [isPaymentSystemEnabled, setIsPaymentSystemEnabled] = useState<boolean>(true);
    const [isDonationCardEnabled, setIsDonationCardEnabled] = useState<boolean>(true);
    const [documentPrice, setDocumentPrice] = useState<number>(10000);
    const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);

    useEffect(() => {
        getSession().then(({ session }) => {
            setSession(session);
            setAuthLoading(false);
        });
        const subscription = onAuthStateChange(setSession);
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (session && isAuthModalOpen) {
            setIsAuthModalOpen(false);
        }
    }, [session, isAuthModalOpen]);

    // Fungsi fetchConfig dipisahkan agar bisa dipanggil ulang jika diperlukan
    const fetchConfig = useCallback(async () => {
        try {
            const [toggles, settings] = await Promise.all([
                getFeatureToggles(),
                getSettings()
            ]);

            setIsRpmEnabled(toggles['rpm_generator'] ?? true);
            setIsQuestionCardEnabled(toggles['question_card_generator'] ?? true);
            setIsRpsEnabled(toggles['rps_generator'] ?? true);
            setIsRpdEnabled(toggles['rpd_generator'] ?? true);
            setIsAtpEnabled(toggles['atp_generator'] ?? true);
            setIsJournalEnabled(toggles['journal_generator'] ?? true);
            setIsCkEnabled(toggles['ck_generator'] ?? true); 
            setIsClientApiKeyEnabled(toggles['client_api_key_input'] ?? true);
            setIsPaymentSystemEnabled(toggles['payment_system'] ?? true);
            setIsDonationCardEnabled(toggles['donation_card'] ?? true);

            if (settings['document_price']) {
                setDocumentPrice(parseInt(settings['document_price'], 10));
            }
        } catch (error) {
            console.error("Config fetch error:", error);
        } finally {
            setIsLoadingFeatures(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedTheme = window.localStorage.getItem('theme');
            if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        logUsage({
            type: 'Website Visit',
            school_name: 'N/A',
            teacher_name: 'N/A',
            subject: 'N/A',
        }).catch(err => console.warn("Log failed:", err));
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

    const navigateTo = useCallback((view: AppView) => {
        setCurrentView(view);
        window.scrollTo(0, 0);
    }, []);

    const handleAdminLoginSuccess = () => {
        setIsAdminLoginModalOpen(false);
        navigateTo(AppView.AdminDashboard);
    };

    const handleFeatureClick = useCallback((view: AppView) => {
        if (session) navigateTo(view);
        else setIsAuthModalOpen(true);
    }, [session, navigateTo]);
    
    const handleTopUpRequest = useCallback(() => {
        if (session) navigateTo(AppView.CreditStore);
        else setIsAuthModalOpen(true);
    }, [session, navigateTo]);

    const renderContent = () => {
        switch (currentView) {
            case AppView.RpmGenerator:
                return <RpmGenerator onBack={() => navigateTo(AppView.MainMenu)} isClientApiKeyEnabled={isClientApiKeyEnabled} isPaymentSystemEnabled={isPaymentSystemEnabled} documentPrice={documentPrice} onTopUpRequest={handleTopUpRequest} />;
            case AppView.RpsGenerator:
                return <RpsGenerator onBack={() => navigateTo(AppView.MainMenu)} isClientApiKeyEnabled={isClientApiKeyEnabled} isPaymentSystemEnabled={isPaymentSystemEnabled} documentPrice={documentPrice} onTopUpRequest={handleTopUpRequest} />;
            case AppView.RpdGenerator:
                return <RpdGenerator onBack={() => navigateTo(AppView.MainMenu)} isClientApiKeyEnabled={isClientApiKeyEnabled} isPaymentSystemEnabled={isPaymentSystemEnabled} documentPrice={documentPrice} onTopUpRequest={handleTopUpRequest} />;
            case AppView.AtpGenerator:
                return <AtpGenerator onBack={() => navigateTo(AppView.MainMenu)} isClientApiKeyEnabled={isClientApiKeyEnabled} isPaymentSystemEnabled={isPaymentSystemEnabled} documentPrice={documentPrice} onTopUpRequest={handleTopUpRequest} />;
            case AppView.QuestionCardGenerator:
                return <QuestionCardGenerator onBack={() => navigateTo(AppView.MainMenu)} isClientApiKeyEnabled={isClientApiKeyEnabled} isPaymentSystemEnabled={isPaymentSystemEnabled} documentPrice={documentPrice} onTopUpRequest={handleTopUpRequest} />;
            case AppView.JournalGenerator:
                return <JournalGenerator onBack={() => navigateTo(AppView.MainMenu)} isClientApiKeyEnabled={isClientApiKeyEnabled} isPaymentSystemEnabled={isPaymentSystemEnabled} documentPrice={documentPrice} onTopUpRequest={handleTopUpRequest} />;
            case AppView.CkGenerator:
                return <CkGenerator onBack={() => navigateTo(AppView.MainMenu)} isClientApiKeyEnabled={isClientApiKeyEnabled} isPaymentSystemEnabled={isPaymentSystemEnabled} documentPrice={documentPrice} onTopUpRequest={handleTopUpRequest} />;
            case AppView.Testimonials:
                return <Testimonials onBack={() => navigateTo(AppView.MainMenu)} />;
            case AppView.CreatorBio:
                return <CreatorBioCard onBack={() => navigateTo(AppView.MainMenu)} />;
            case AppView.CreditStore:
                return <CreditStore onBack={() => navigateTo(AppView.MainMenu)} session={session} />;
            case AppView.AdminDashboard:
                return (
                    <AdminDashboard
                        onBack={() => navigateTo(AppView.MainMenu)}
                        isRpmEnabled={isRpmEnabled} onToggleRpm={setIsRpmEnabled}
                        isQuestionCardEnabled={isQuestionCardEnabled} onToggleQuestionCard={setIsQuestionCardEnabled}
                        isRpsEnabled={isRpsEnabled} onToggleRps={setIsRpsEnabled}
                        isRpdEnabled={isRpdEnabled} onToggleRpd={setIsRpdEnabled}
                        isAtpEnabled={isAtpEnabled} onToggleAtp={setIsAtpEnabled}
                        isJournalEnabled={isJournalEnabled} onToggleJournal={setIsJournalEnabled}
                        isCkEnabled={isCkEnabled} onToggleCk={setIsCkEnabled}
                        isClientApiKeyEnabled={isClientApiKeyEnabled} onToggleClientApiKey={setIsClientApiKeyEnabled}
                        isPaymentSystemEnabled={isPaymentSystemEnabled} onTogglePaymentSystem={setIsPaymentSystemEnabled}
                        isDonationCardEnabled={isDonationCardEnabled} onToggleDonationCard={setIsDonationCardEnabled}
                        documentPrice={documentPrice} onUpdatePrice={setDocumentPrice}
                    />
                );
            case AppView.MainMenu:
            default:
                return (
                    <div className="w-full max-w-5xl mx-auto px-4">
                        <QuoteSlideshow />
                        
                        {/* FITUR BARU: Gendhis Portable Promo */}
                        <GendhisPortablePromo />

                        <h2 className="text-2xl font-bold text-center text-slate-700 dark:text-slate-300 mb-8">Pilih Dokumen yang Ingin Dibuat</h2>
                        {isLoadingFeatures ? (
                            <div className="text-center p-8"><p className="text-slate-500">Memuat menu...</p></div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                <MenuCard title="Generate RPM" description="Buat Rancangan Pembelajaran Mendalam (RPM) secara otomatis." icon={<DocumentTextIcon />} onClick={() => handleFeatureClick(AppView.RpmGenerator)} enabled={isRpmEnabled} theme="sky" onDisabledClick={() => setIsApologyModalOpen(true)} />
                                <MenuCard title="Generate Kartu Soal & Kisi-Kisi" description="Buat kartu soal ujian dan kisi-kisi penilaian yang terstruktur." icon={<ClipboardDocumentListIcon />} onClick={() => handleFeatureClick(AppView.QuestionCardGenerator)} enabled={isQuestionCardEnabled} theme="emerald" onDisabledClick={() => setIsApologyModalOpen(true)} />
                                <MenuCard title="Generate Rencana Pembelajaran Semester (RPS)" description="Susun RPS untuk perkuliahan di Universitas secara terstruktur." icon={<GraduationCapIcon />} onClick={() => handleFeatureClick(AppView.RpsGenerator)} enabled={isRpsEnabled} theme="violet" onDisabledClick={() => setIsApologyModalOpen(true)} />
                                <MenuCard title="Generate ATP" description="Rancang Alur Tujuan Pembelajaran (ATP) yang sistematis dan modern." icon={<SitemapIcon />} onClick={() => handleFeatureClick(AppView.AtpGenerator)} enabled={isAtpEnabled} theme="fuchsia" onDisabledClick={() => setIsApologyModalOpen(true)} />
                                <MenuCard title="Rencana Pembelajaran Digital (Microteaching)" description="Buat skenario microteaching yang inovatif dan terstruktur." icon={<ChalkboardUserIcon />} onClick={() => handleFeatureClick(AppView.RpdGenerator)} enabled={isRpdEnabled} theme="rose" onDisabledClick={() => setIsApologyModalOpen(true)} />
                                <MenuCard title="Jurnal Digital Guru" description="Catat refleksi dan kemajuan siswa secara terstruktur." icon={<BookJournalWhillsIcon />} onClick={() => handleFeatureClick(AppView.JournalGenerator)} enabled={isJournalEnabled} theme="lime" />
                                
                                <MenuCard title="Capaian Kompetensi (CK)" description="Buat narasi rapor Deep Learning yang mendalam & personal." icon={<AwardIcon />} onClick={() => handleFeatureClick(AppView.CkGenerator)} enabled={isCkEnabled} theme="amber" />
                                
                                <MenuCard title="Toko Kredit" description="Isi ulang saldo unduhan Anda untuk mengakses semua fitur." icon={<ShoppingBagIcon />} onClick={handleTopUpRequest} enabled={isPaymentSystemEnabled} theme="cyan" />
                                <MenuCard title="Testimoni Pengguna" description="Lihat apa kata para guru tentang Gendhis." icon={<CommentsIcon />} onClick={() => navigateTo(AppView.Testimonials)} enabled={true} theme="indigo" />
                                <MenuCard title="Profil Kreator" description="Kenali Ari Wijaya, sosok di balik inovasi Gendhis." icon={<UserTieIcon />} onClick={() => navigateTo(AppView.CreatorBio)} enabled={true} theme="amber" />
                                {isDonationCardEnabled && (
                                    <MenuCard title="Donasi & Dukungan" description="Bantu Gendhis tetap gratis untuk semua guru." icon={<HandHoldingDollarIcon />} onClick={() => setIsDonationModalOpen(true)} enabled={true} theme="amber" />
                                )}
                            </div>
                        )}
                        <AnalyticsDashboard />
                        <UniqueSellingPoint />
                        <VideoTutorial />
                    </div>
                );
        }
    };
    
    if (authLoading) return <div className="flex items-center justify-center h-screen bg-slate-50"><p className="text-slate-500">Memuat...</p></div>;

    return (
        <div className="min-h-screen text-slate-800 dark:text-slate-200 font-sans">
            <Header theme={theme} toggleTheme={toggleTheme} session={session} onTopUpRequest={handleTopUpRequest} onAdminLoginRequest={() => setIsAdminLoginModalOpen(true)} />
            <main className="py-12">{renderContent()}</main>
            <footer className="text-center py-6 text-sm text-slate-500">
                <p>© {new Date().getFullYear()} Gendhis. Dibuat untuk Guru Cerdas & Harmonis.</p>
                <p className="mt-2">Developer: <span className="font-semibold text-sky-600">Ari Wijaya</span> | <button onClick={() => setIsCopyrightModalOpen(true)} className="hover:text-sky-500"><i className="fa-solid fa-copyright"></i> Hak Cipta</button></p>
            </footer>
            {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
            {isAdminLoginModalOpen && <AdminLoginModal isOpen={isAdminLoginModalOpen} onClose={() => setIsAdminLoginModalOpen(false)} onSuccess={handleAdminLoginSuccess} />}
            {isCopyrightModalOpen && <CopyrightModal onClose={() => setIsCopyrightModalOpen(false)} />}
            {isDonationModalOpen && <DonationModal onClose={() => setIsDonationModalOpen(false)} />}
            {isApologyModalOpen && <ApologyModal onClose={() => setIsApologyModalOpen(false)} />}
        </div>
    );
};

export default App;
