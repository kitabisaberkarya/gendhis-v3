import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../services/supabaseService';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';


interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [supabaseClient] = useState(() => getSupabaseClient());
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Efek untuk mendapatkan tema dari localStorage saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme === 'dark' || storedTheme === 'light') {
                setTheme(storedTheme);
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setTheme('dark');
            }
        }
    }, [isOpen]);

    // Efek untuk menangani tombol Escape
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);
    

    if (!isOpen) {
        return null;
    }
    
    if (!supabaseClient) {
        return (
             <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div className="bg-white dark:bg-slate-800 p-8 rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <p className="text-red-500">Klien Supabase tidak berhasil diinisialisasi. Periksa konfigurasi Anda.</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }`}</style>
            
            <div
                className="w-full max-w-md mx-auto"
                 onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                        Selamat Datang di Gendhis
                    </h1>
                    <p className="text-sm text-slate-300 italic">
                        Silakan masuk atau daftar untuk melanjutkan.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <Auth
                        supabaseClient={supabaseClient}
                        appearance={{ theme: ThemeSupa }}
                        theme={theme}
                        providers={['google']}
                        localization={{
                            variables: {
                                sign_in: {
                                    email_label: 'Alamat Email',
                                    password_label: 'Kata Sandi',
                                    email_input_placeholder: 'email@anda.com',
                                    password_input_placeholder: 'Kata sandi Anda',
                                    button_label: 'Masuk',
                                    social_provider_text: 'Masuk dengan {{provider}}',
                                    link_text: 'Sudah punya akun? Masuk',
                                },
                                sign_up: {
                                    email_label: 'Alamat Email',
                                    password_label: 'Buat Kata Sandi',
                                    email_input_placeholder: 'email@anda.com',
                                    password_input_placeholder: 'Kata sandi Anda',
                                    button_label: 'Daftar',
                                    social_provider_text: 'Daftar dengan {{provider}}',
                                    link_text: 'Belum punya akun? Daftar',
                                },
                                forgotten_password: {
                                    email_label: 'Alamat Email',
                                    email_input_placeholder: 'email@anda.com',
                                    button_label: 'Kirim instruksi',
                                    link_text: 'Lupa kata sandi?',
                                }
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AuthModal;