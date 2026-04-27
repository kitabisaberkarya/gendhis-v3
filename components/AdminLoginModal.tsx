import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../services/supabaseService';
import Spinner from './Spinner';
import { SparklesIcon } from './IconComponents';

interface AdminLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [emailInput, setEmailInput] = useState(() => localStorage.getItem('lastAdminEmail') || '');
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailInput || !passwordInput) return;

        setIsVerifying(true);
        setAuthError('');
        const supabase = getSupabaseClient();

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailInput,
                password: passwordInput,
            });

            if (error) {
                throw error;
            }

            if (data.user?.user_metadata?.role === 'admin') {
                localStorage.setItem('lastAdminEmail', emailInput);
                onSuccess();
            } else {
                setAuthError('Akses ditolak. Akun ini tidak memiliki hak admin.');
                await supabase.auth.signOut();
            }

        } catch (error) {
            console.error('Admin login error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Invalid login credentials')) {
                    setAuthError('Email atau kata sandi salah.');
                } else {
                    setAuthError(`Terjadi kesalahan: ${error.message}`);
                }
            } else {
                setAuthError('Terjadi kesalahan yang tidak diketahui.');
            }
        } finally {
            setIsVerifying(false);
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <style>{`@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } @keyframes scale-in { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } } .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); } .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }`}</style>
            <div
                className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center space-x-3">
                         <div className="bg-sky-100 dark:bg-sky-900/50 p-2 rounded-full">
                           <i className="fa-solid fa-user-shield text-xl text-sky-500"></i>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                            Akses Panel Admin
                        </h2>
                    </div>
                    <button onClick={onClose} aria-label="Tutup modal" className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="admin-email" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email Admin:</label>
                        <input id="admin-email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required autoFocus />
                    </div>
                    
                    <div>
                        <label htmlFor="admin-password" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Kata Sandi Admin:</label>
                        <input id="admin-password" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                    </div>

                    {authError && <p className="text-sm text-red-500 text-center pt-2">{authError}</p>}
                    
                    <div className="pt-2">
                        <button type="submit" disabled={isVerifying} className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-wait transition-colors">
                            {isVerifying ? <Spinner /> : <i className="fa-solid fa-right-to-bracket"></i>}
                            <span>{isVerifying ? 'Memverifikasi...' : 'Login'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginModal;