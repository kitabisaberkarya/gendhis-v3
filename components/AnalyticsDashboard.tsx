
import React, { useState, useEffect, useCallback } from 'react';
import { getAnalyticsSummary } from '../services/supabaseService';

interface AnalyticsData {
    schoolCounts: Record<string, number>;
    featureCounts: Record<string, number>;
    testimonialCount: number;
    totalDocuments: number;
}

const AnalyticsDashboard: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const summary: AnalyticsData = await getAnalyticsSummary();
            setData(summary);
            setError(null);
        } catch (err) {
            let msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            console.error("Analytics fetch failed:", msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 45000); 
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const schoolColors: Record<string, string> = {
        SD: '#0ea5e9',
        SMP: '#10b981',
        SMA: '#6366f1',
        SMK: '#f59e0b',
        MA: '#f43f5e',
        UNIVERSITAS: '#8b5cf6',
        LAINNYA: '#64748b'
    };

    const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
        <div className={`relative bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6 backdrop-blur-md overflow-hidden ${className}`}>
             <h3 className="text-sm font-semibold text-center text-slate-300 mb-4 uppercase tracking-wider">{title}</h3>
            {children}
        </div>
    );
    
    if (isLoading && !data) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 my-16">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-center text-slate-700 dark:text-slate-300 mb-2">Memuat Laporan Analisis Gendhis...</h2>
                    <p className="text-center text-slate-500 dark:text-slate-400">Menghubungi server untuk data real-time.</p>
                </div>
                <div className="relative p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-pulse h-96"></div>
            </div>
        );
    }

    if (error && !data) {
        const isPausedError = error.includes("Paused") || error.includes("Tertidur");
        return (
             <div className="w-full max-w-5xl mx-auto px-4 my-16">
                <div className={`border p-8 rounded-2xl text-center shadow-xl ${isPausedError ? 'bg-slate-800 border-indigo-500/30' : 'bg-slate-900 border-amber-500/30'}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isPausedError ? 'bg-indigo-500/10' : 'bg-amber-500/10'}`}>
                        <i className={`fa-solid ${isPausedError ? 'fa-bed' : 'fa-cloud-bolt'} text-4xl ${isPausedError ? 'text-indigo-400' : 'text-amber-500'}`}></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 mb-4">
                        {isPausedError ? "Database Sedang Istirahat (Mode Hemat)" : "Database Sedang Sibuk"}
                    </h3>
                    <p className="text-slate-400 max-w-lg mx-auto mb-6 text-sm leading-relaxed">
                        {isPausedError 
                            ? "Database analitik Supabase saat ini sedang dalam mode tidur (Paused) karena menggunakan paket Gratis. Jangan khawatir, fitur utama GENERATE DOKUMEN tetap berjalan normal menggunakan API Key Gemini Anda."
                            : error}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button 
                            onClick={() => { setIsLoading(true); fetchData(); }}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-bell"></i> Bangunkan Database
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;
    
    const rpmCount = data.featureCounts['RPM'] || 0;
    const questionCardCount = data.featureCounts['Question Card'] || data.featureCounts['Kartu Soal'] || 0;
    const rpsCount = data.featureCounts['RPS'] || 0;
    const rpdCount = data.featureCounts['RPD'] || 0;
    const atpCount = data.featureCounts['ATP'] || 0;

    const maxSchoolCount = Math.max(...(Object.values(data.schoolCounts) as number[]), 1);
    
    const schoolOrder = ['SD', 'SMP', 'SMA', 'MA', 'SMK', 'UNIVERSITAS'];
    const sortedSchoolData = Object.entries(data.schoolCounts)
        .filter(([key]) => key.toUpperCase() !== 'LAINNYA')
        .sort(([aKey], [bKey]) => {
            const indexA = schoolOrder.indexOf(aKey.toUpperCase());
            const indexB = schoolOrder.indexOf(bKey.toUpperCase());
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

    const lainnyaData = Object.entries(data.schoolCounts).find(([key]) => key.toUpperCase() === 'LAINNYA');
    if (lainnyaData) sortedSchoolData.push(lainnyaData);

    return (
        <div className="w-full max-w-5xl mx-auto px-4 my-16">
            <h2 className="text-2xl font-bold text-center text-slate-700 dark:text-slate-300 mb-2">Laporan Analisis Gendhis</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Data penggunaan secara real-time dari seluruh Indonesia.</p>

            <div className="relative p-4 sm:p-6 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
                <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-sky-500/20 rounded-full filter blur-3xl animate-pulse"></div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <Card title="Pengguna per Jenjang Sekolah" className="md:col-span-2">
                        <div className="flex flex-col h-48">
                            <div className="flex-grow flex justify-around items-end gap-2 px-2">
                                {sortedSchoolData.map(([key, value]) => {
                                    const barHeight = maxSchoolCount > 0 ? ((Number(value) || 0) / maxSchoolCount) * 100 : 0;
                                    return (
                                        <div key={key} className="w-full h-full flex flex-col justify-end items-center">
                                            <span className="text-xs font-bold text-slate-200 mb-1">{(Number(value) || 0).toLocaleString()}</span>
                                            <div
                                                className="w-6 sm:w-8 rounded-t-md transition-all duration-700 ease-out hover:opacity-100 opacity-80"
                                                style={{ height: `${barHeight}%`, backgroundColor: schoolColors[key.toUpperCase()] || '#64748b' }}
                                            ></div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-around pt-2 mt-2 border-t border-slate-700/50">
                                {sortedSchoolData.map(([key]) => (
                                    <div key={key} className="w-full text-center">
                                        <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">{key.toUpperCase()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Card title="Popularitas Fitur" className="md:col-span-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 items-center py-4">
                            {[
                                { count: rpmCount, label: 'RPM', color: 'sky' },
                                { count: questionCardCount, label: 'Kartu Soal', color: 'purple' },
                                { count: rpsCount, label: 'RPS', color: 'violet' },
                                { count: atpCount, label: 'ATP', color: 'fuchsia' },
                                { count: rpdCount, label: 'RPD', color: 'rose' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center">
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-${item.color}-500/20 border-2 border-${item.color}-400 shadow-lg shadow-${item.color}-500/50 animate-pulse`}>
                                        <span className="text-xl sm:text-2xl font-bold text-white">{item.count}</span>
                                    </div>
                                    <span className="mt-2 text-xs sm:text-sm text-slate-300">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Total Testimoni">
                         <div className="flex justify-center items-center h-40">
                            <div className="relative w-32 h-32">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                                <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-800 rounded-full border-2 border-indigo-400">
                                    <span className="text-4xl font-bold text-white">{data.testimonialCount || 0}</span>
                                    <span className="text-xs text-indigo-300">Ulasan</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                    
                    <Card title="Total Dokumen Dibuat">
                        <div className="flex justify-center items-center h-40 relative">
                            <div className="flex flex-col items-center z-10">
                                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-400">{(data.totalDocuments || 0).toLocaleString()}</span>
                                <span className="text-sm text-amber-300 uppercase tracking-widest mt-2">Dokumen</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
