import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, SunIcon, MoonIcon } from './IconComponents';
import type { Session } from '@supabase/supabase-js';
import { signOut, getUserProfile } from '../services/supabaseService';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    session: Session | null;
    onTopUpRequest: () => void;
    onAdminLoginRequest: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, session, onTopUpRequest, onAdminLoginRequest }) => {
    const [profile, setProfile] = useState<{ credit_balance: number } | null>(null);
    const logoClickCount = useRef(0);
    const logoClickTimer = useRef<number | null>(null);

    useEffect(() => {
        if (session) {
            getUserProfile().then(userProfile => {
                if (userProfile) {
                    setProfile(userProfile);
                }
            }).catch(error => {
                console.error("Gagal mengambil profil pengguna:", error);
            });
        } else {
            setProfile(null);
        }
    }, [session]);

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Gagal melakukan logout:", error);
            alert("Gagal melakukan logout. Silakan coba lagi.");
        }
    };
    
    const handleLogoClick = () => {
        logoClickCount.current += 1;

        if (logoClickTimer.current) {
            clearTimeout(logoClickTimer.current);
        }

        logoClickTimer.current = window.setTimeout(() => {
            logoClickCount.current = 0; // Reset setelah 2 detik
        }, 2000);

        if (logoClickCount.current === 5) {
            logoClickCount.current = 0;
            if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
            onAdminLoginRequest();
        }
    };


    return (
        <header className="bg-white/80 dark:bg-slate-900/80 shadow-md backdrop-blur-sm sticky top-0 z-10">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div 
                        className="flex items-center space-x-3 cursor-pointer"
                        onClick={handleLogoClick}
                    >
                        <SparklesIcon />
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500">
                                Gendhis
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic -mt-1">
                                Generator Dokumen Guru Cerdas & Harmonis
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {session && (
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="flex flex-col items-end">
                                    <span className="hidden sm:block text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px] sm:max-w-xs">
                                        {session.user.email}
                                    </span>
                                    {profile !== null && (
                                        <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                            Saldo: {profile.credit_balance} Unduhan
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onTopUpRequest}
                                    title="Isi Ulang Saldo"
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex-shrink-0"
                                >
                                    <i className="fa-solid fa-plus"></i>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    title="Logout"
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                    <i className="fa-solid fa-right-from-bracket"></i>
                                </button>
                            </div>
                        )}
                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle dark mode"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
                        >
                            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;