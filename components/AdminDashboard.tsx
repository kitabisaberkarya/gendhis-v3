
import React, { useEffect, useState, useMemo } from 'react';
import { getAnalyticsSummary, updateFeatureToggle, updateSetting, getAllUserProfiles, adminAddCredits } from '../services/supabaseService';
import Spinner from './Spinner';
import { ArrowLeftIcon } from './IconComponents';
import type { UserProfile } from '../types';

interface AnalyticsData {
    schoolCounts: Record<string, number>;
    featureCounts: Record<string, number>;
    testimonialCount: number;
    totalDocuments: number;
}

interface AdminDashboardProps {
    onBack: () => void;
    isRpmEnabled: boolean; onToggleRpm: (v: boolean) => void;
    isQuestionCardEnabled: boolean; onToggleQuestionCard: (v: boolean) => void;
    isRpsEnabled: boolean; onToggleRps: (v: boolean) => void;
    isRpdEnabled: boolean; onToggleRpd: (v: boolean) => void;
    isAtpEnabled: boolean; onToggleAtp: (v: boolean) => void;
    isJournalEnabled: boolean; onToggleJournal: (v: boolean) => void;
    isCkEnabled: boolean; onToggleCk: (v: boolean) => void;
    isClientApiKeyEnabled: boolean; onToggleClientApiKey: (v: boolean) => void;
    isPaymentSystemEnabled: boolean; onTogglePaymentSystem: (v: boolean) => void;
    isDonationCardEnabled: boolean; onToggleDonationCard: (v: boolean) => void;
    documentPrice: number; onUpdatePrice: (v: number) => void;
}

const FeatureToggle: React.FC<{
    title: string; isEnabled: boolean; onToggle: (v: boolean) => void; isUpdating: boolean;
}> = ({ title, isEnabled, onToggle, isUpdating }) => {
    const id = `admin-toggle-${title.replace(/\s+/g, '-')}`;
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 relative transition-opacity duration-300">
            <span className={`font-medium text-slate-300 ${isUpdating ? 'opacity-50' : ''}`}>{title}</span>
            <div className="flex items-center space-x-3">
                {isUpdating && <div className="w-4 h-4 text-slate-400"><Spinner /></div>}
                <label htmlFor={id} className={`flex items-center ${isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    <div className="relative">
                        <input type="checkbox" id={id} className="sr-only" checked={isEnabled} onChange={e => onToggle(e.target.checked)} disabled={isUpdating} />
                        <div className="block bg-slate-600 w-12 h-6 rounded-full transition-colors"></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 ease-in-out ${isEnabled ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                </label>
            </div>
            <style>{`input:checked ~ .dot { background-color: #0ea5e9; }`}</style>
        </div>
    );
};

const AddCreditModal: React.FC<{
    user: UserProfile;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ user, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const creditAmount = parseInt(amount, 10);
        if (isNaN(creditAmount) || creditAmount === 0) {
            setError('Jumlah kredit harus berupa angka.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        const { success, error: submissionError } = await adminAddCredits(user.id, creditAmount);
        if (success) onSuccess();
        else setError(submissionError?.message || 'Gagal.');
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700">
                    <h3 className="font-semibold text-white">Tambah Kuota untuk <span className="text-cyan-400">{user.email}</span></h3>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label htmlFor="credit-amount" className="text-sm text-slate-400">Jumlah Kuota Unduhan</label>
                        <input id="credit-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full p-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:ring-2 focus:ring-cyan-500" placeholder="Contoh: 50" autoFocus />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-slate-300 hover:bg-slate-700">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white font-semibold disabled:bg-slate-500">{isSubmitting ? <Spinner /> : 'Tambahkan'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const { onBack } = props;
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [priceInput, setPriceInput] = useState(props.documentPrice.toString());
    const [updatingStates, setUpdatingStates] = useState<Record<string, boolean>>({});
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [analyticsData, userData] = await Promise.all([
                getAnalyticsSummary(),
                getAllUserProfiles()
            ]);
            setAnalytics(analyticsData);
            setUsers(userData);
        } catch (err) {
            console.error("Dashboard load failed:", err);
            setError(`Gagal memuat data. Pastikan RPC admin sudah terpasang.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => { fetchData(); }, []);
    
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const query = searchQuery.toLowerCase();
            return (user.full_name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query));
        });
    }, [users, searchQuery]);

    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const currentRows = useMemo(() => {
        const indexOfLastRow = currentPage * rowsPerPage;
        const indexOfFirstRow = indexOfLastRow - rowsPerPage;
        return filteredUsers.slice(indexOfFirstRow, indexOfLastRow);
    }, [filteredUsers, currentPage, rowsPerPage]);

    const handleToggle = async (featureName: string, newValue: boolean, stateUpdater: (v: boolean) => void) => {
        setUpdatingStates(prev => ({ ...prev, [featureName]: true }));
        const { success, error } = await updateFeatureToggle(featureName, newValue);
        if (success) stateUpdater(newValue);
        else alert(`Error: ${error?.message}`);
        setUpdatingStates(prev => ({ ...prev, [featureName]: false }));
    };

    const handlePriceUpdate = async () => {
        const newPrice = parseInt(priceInput, 10);
        if (isNaN(newPrice) || newPrice < 0) return alert("Invalid price.");
        setUpdatingStates(prev => ({ ...prev, document_price: true }));
        const { success, error } = await updateSetting('document_price', newPrice.toString());
        if (success) props.onUpdatePrice(newPrice);
        else alert(`Error: ${error?.message}`);
        setUpdatingStates(prev => ({ ...prev, document_price: false }));
    };

    return (
         <div className="w-full max-w-6xl mx-auto px-4">
            {selectedUser && <AddCreditModal user={selectedUser} onClose={() => setSelectedUser(null)} onSuccess={() => { setSelectedUser(null); fetchData(); }} />}
            <button onClick={onBack} className="flex items-center space-x-2 text-sm text-sky-600 hover:underline mb-8"><ArrowLeftIcon /><span>Kembali ke Menu Utama</span></button>
            <div className="bg-slate-900 border border-sky-500/20 rounded-2xl shadow-2xl w-full overflow-hidden">
                <header className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-user-shield text-2xl text-sky-400"></i>
                        <h2 className="text-xl font-bold text-slate-100">Dasbor Admin Gendhis</h2>
                    </div>
                    <button onClick={fetchData} className="text-slate-400 hover:text-white transition-colors"><i className="fa-solid fa-rotate"></i></button>
                </header>
                <main className="p-6 space-y-8">
                    {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-4 rounded-lg">{error}</div>}
                    
                    {/* Live Analytics */}
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-semibold text-sky-400 mb-4 uppercase tracking-wider text-xs">Live Analytics</h3>
                        {isLoading ? <p className="text-slate-400 text-sm">Memuat data...</p> : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="bg-slate-700/50 p-3 rounded-lg"><p className="text-2xl font-bold text-white">{analytics?.totalDocuments || 0}</p><p className="text-[10px] text-slate-400 uppercase">Dokumen Dibuat</p></div>
                                <div className="bg-slate-700/50 p-3 rounded-lg"><p className="text-2xl font-bold text-white">{analytics?.testimonialCount || 0}</p><p className="text-[10px] text-slate-400 uppercase">Testimoni</p></div>
                                <div className="bg-slate-700/50 p-3 rounded-lg"><p className="text-2xl font-bold text-white">{analytics?.featureCounts['RPM'] || 0}</p><p className="text-[10px] text-slate-400 uppercase">Pengguna RPM</p></div>
                                <div className="bg-slate-700/50 p-3 rounded-lg"><p className="text-2xl font-bold text-white">{analytics?.featureCounts['Question Card'] || 0}</p><p className="text-[10px] text-slate-400 uppercase">Pengguna Kartu Soal</p></div>
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Manajemen Fitur */}
                        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                             <h3 className="text-lg font-semibold text-sky-400 mb-4 uppercase tracking-wider text-xs">Saklar Fitur Aplikasi</h3>
                             <div className="space-y-3">
                                <FeatureToggle title="Generator RPM" isEnabled={props.isRpmEnabled} onToggle={v => handleToggle('rpm_generator', v, props.onToggleRpm)} isUpdating={updatingStates['rpm_generator']} />
                                <FeatureToggle title="Generator Kartu Soal" isEnabled={props.isQuestionCardEnabled} onToggle={v => handleToggle('question_card_generator', v, props.onToggleQuestionCard)} isUpdating={updatingStates['question_card_generator']} />
                                <FeatureToggle title="Generator RPS" isEnabled={props.isRpsEnabled} onToggle={v => handleToggle('rps_generator', v, props.onToggleRps)} isUpdating={updatingStates['rps_generator']} />
                                <FeatureToggle title="Generator ATP" isEnabled={props.isAtpEnabled} onToggle={v => handleToggle('atp_generator', v, props.onToggleAtp)} isUpdating={updatingStates['atp_generator']} />
                                <FeatureToggle title="Generator RPD" isEnabled={props.isRpdEnabled} onToggle={v => handleToggle('rpd_generator', v, props.onToggleRpd)} isUpdating={updatingStates['rpd_generator']} />
                                <FeatureToggle title="Jurnal Digital Guru" isEnabled={props.isJournalEnabled} onToggle={v => handleToggle('journal_generator', v, props.onToggleJournal)} isUpdating={updatingStates['journal_generator']} />
                                <FeatureToggle title="Capaian Kompetensi (CK)" isEnabled={props.isCkEnabled} onToggle={v => handleToggle('ck_generator', v, props.onToggleCk)} isUpdating={updatingStates['ck_generator']} />
                            </div>
                        </div>

                        {/* Pengaturan Global */}
                        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                             <h3 className="text-lg font-semibold text-sky-400 mb-4 uppercase tracking-wider text-xs">Konfigurasi Sistem</h3>
                             <div className="space-y-3">
                                <FeatureToggle title="Sistem Kredit & Unduh" isEnabled={props.isPaymentSystemEnabled} onToggle={v => handleToggle('payment_system', v, props.onTogglePaymentSystem)} isUpdating={updatingStates['payment_system']} />
                                <FeatureToggle title="Input API Key Klien" isEnabled={props.isClientApiKeyEnabled} onToggle={v => handleToggle('client_api_key_input', v, props.onToggleClientApiKey)} isUpdating={updatingStates['client_api_key_input']} />
                                <FeatureToggle title="Kartu Donasi" isEnabled={props.isDonationCardEnabled} onToggle={v => handleToggle('donation_card', v, props.onToggleDonationCard)} isUpdating={updatingStates['donation_card']} />
                                <div className="pt-2">
                                    <label htmlFor="price-input" className="block text-sm font-medium text-slate-300 mb-2">Biaya per Unduhan (Rp)</label>
                                    <div className="flex items-center gap-2">
                                        <input id="price-input" type="number" value={priceInput} onChange={e => setPriceInput(e.target.value)} className="flex-grow px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 outline-none" disabled={updatingStates['document_price']} />
                                        <button onClick={handlePriceUpdate} disabled={updatingStates['document_price']} className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-sky-700 transition-colors">{updatingStates['document_price'] ? <Spinner/> : 'Simpan'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MANAJEMEN PENGGUNA (TABEL CLIENT) */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="p-5 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="text-lg font-semibold text-sky-400 uppercase tracking-wider text-xs">Manajemen Guru & Kuota</h3>
                            <div className="relative w-full sm:w-64">
                                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                                <input 
                                    type="text" 
                                    placeholder="Cari Nama/Email..." 
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                                />
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-700/30 text-slate-400 uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Nama Lengkap</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4 text-center">Saldo Kuota</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {isLoading ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500"><Spinner /><p className="mt-2">Memuat data guru...</p></td></tr>
                                    ) : currentRows.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">Tidak ada data guru ditemukan.</td></tr>
                                    ) : currentRows.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-200">{user.full_name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-slate-400">{user.email}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.credit_balance > 0 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-rose-900/40 text-rose-400'}`}>
                                                    {user.credit_balance} Unduhan
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedUser(user)}
                                                    className="bg-sky-600/20 hover:bg-sky-600 text-sky-400 hover:text-white px-3 py-1.5 rounded-md text-xs font-semibold border border-sky-600/50 transition-all"
                                                >
                                                    <i className="fa-solid fa-plus-circle mr-1"></i> Tambah Kuota
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 bg-slate-800/30 border-t border-slate-700 flex justify-between items-center">
                                <span className="text-xs text-slate-500">Menampilkan {currentRows.length} dari {filteredUsers.length} Guru</span>
                                <div className="flex gap-2">
                                    <button 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="p-2 bg-slate-700 text-slate-300 rounded disabled:opacity-30"
                                    >
                                        <i className="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <span className="flex items-center px-4 text-sm font-bold text-sky-400">{currentPage} / {totalPages}</span>
                                    <button 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="p-2 bg-slate-700 text-slate-300 rounded disabled:opacity-30"
                                    >
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
