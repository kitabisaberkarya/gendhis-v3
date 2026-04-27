
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FileWordIcon, FileExcelIcon } from './IconComponents';
import { getDocumentById, getUserProfile, useCreditForDocument } from '../services/supabaseService';
import type { GeneratedDocumentData } from '../types';
import Spinner from './Spinner';
import PaymentStatusModal from './PaymentStatusModal';

interface RpmPreviewProps {
  documentId: string | null;
  freeResultHtml: string;
  isPaymentSystemEnabled: boolean;
  userName: string;
  error: string;
  documentPrice: number;
  onTopUpRequest: () => void;
}

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="p-4 sm:p-6 text-center text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 rounded-lg m-4 border border-rose-200 dark:border-rose-500/30">
    <div className="flex flex-col items-center">
      <i className="fa-solid fa-circle-xmark text-4xl text-rose-500 mb-4"></i>
      <h4 className="text-lg font-bold text-rose-800 dark:text-rose-200">Gagal Membuat Dokumen</h4>
      <p className="mt-2 text-sm">{message}</p>
      
      <div className="mt-6 text-left w-full max-w-md border-t border-rose-200 dark:border-rose-500/30 pt-4">
        <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Saran & Solusi:</h5>
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <li>Coba sederhanakan input pada kolom <strong>"Materi Pokok"</strong>. Terkadang, topik yang terlalu kompleks dapat diblokir oleh filter keamanan AI.</li>
          <li>Pastikan koneksi internet Anda stabil dan coba lagi.</li>
          <li>Jika menggunakan API Key sendiri, pastikan kunci tersebut valid, aktif, dan memiliki kuota yang cukup.</li>
          <li>Jika masalah berlanjut, server AI mungkin sibuk. Mohon coba lagi setelah beberapa saat.</li>
        </ul>
      </div>
    </div>
  </div>
);


const RpmPreview: React.FC<RpmPreviewProps> = ({ documentId, freeResultHtml, isPaymentSystemEnabled, userName, error, documentPrice, onTopUpRequest }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [documentData, setDocumentData] = useState<GeneratedDocumentData | null>(null);
  const [profile, setProfile] = useState<{ credit_balance: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingCredit, setIsUsingCredit] = useState(false);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    status: 'loading' | 'success' | 'error';
    message: string;
  }>({
    isOpen: false,
    status: 'loading',
    message: '',
  });
  
  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, status: 'loading', message: '' });
  }, []);

  const fetchDocumentAndProfile = useCallback(async (id: string) => {
      try {
        const [doc, userProfile] = await Promise.all([
          getDocumentById(id),
          getUserProfile()
        ]);
        setDocumentData(doc);
        setProfile(userProfile);
      } catch (e) {
        console.error("Gagal mengambil data:", e);
        setModalState({ isOpen: true, status: 'error', message: 'Gagal memuat status dokumen atau profil. Silakan muat ulang halaman.' });
      }
  }, []);

  useEffect(() => {
    if (isPaymentSystemEnabled && documentId) {
      setIsLoading(true);
      fetchDocumentAndProfile(documentId).finally(() => setIsLoading(false));
    } else {
      setDocumentData(null);
      setProfile(null);
    }
  }, [documentId, isPaymentSystemEnabled, fetchDocumentAndProfile]);


  const handleUseCredit = async () => {
    if (!documentId || (profile?.credit_balance ?? 0) <= 0) return;

    setIsUsingCredit(true);
    setModalState({ isOpen: true, status: 'loading', message: 'Sedang menggunakan 1 kredit...' });

    const { success, error: creditError } = await useCreditForDocument(documentId);

    if (success) {
      setModalState({ isOpen: true, status: 'success', message: '' });
      // Otomatis tutup modal dan segarkan data setelah 2 detik
      setTimeout(() => {
        closeModal();
        fetchDocumentAndProfile(documentId);
      }, 2000);
    } else {
      setModalState({ isOpen: true, status: 'error', message: creditError?.message || 'Gagal menggunakan kredit.' });
    }
    
    setIsUsingCredit(false);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
  const handleWordDownload = () => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${contentElement.innerHTML}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'application/msword' });
    downloadFile(blob, 'RPM_Gendhis.doc');
  };
  
  const handleExcelDownload = () => {
    const contentElement = contentRef.current;
    if (!contentElement) return;
    
    const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>RPM</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${contentElement.innerHTML}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'application/vnd.ms-excel' });
    downloadFile(blob, 'RPM_Gendhis.xls');
  };

  const isLocked = isPaymentSystemEnabled && documentData?.payment_status !== 'paid';
  const htmlContent = isPaymentSystemEnabled ? (documentData?.document_content_html || '') : freeResultHtml;
  const showContent = !!htmlContent && !error;
  const hasCredits = (profile?.credit_balance ?? 0) > 0;

  const renderDownloadButtons = () => (
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-center text-slate-600 dark:text-slate-400 mb-3">Download Dokumen</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleWordDownload}
            className="flex items-center justify-center w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
          >
            <FileWordIcon /> Word
          </button>
          <button
            onClick={handleExcelDownload}
            className="flex items-center justify-center w-full bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
          >
            <FileExcelIcon /> Excel
          </button>
        </div>
      </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-2 sm:p-4 h-[750px] flex flex-col">
       <PaymentStatusModal
        isOpen={modalState.isOpen}
        status={modalState.status}
        errorMessage={modalState.message}
        onClose={closeModal}
      />
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 px-2 sm:px-2">Hasil Dokumen</h3>
      <div 
        className="relative flex-grow overflow-hidden bg-slate-50 dark:bg-slate-800/50 rounded-md"
      >
        <div 
          className="h-full overflow-y-auto custom-scrollbar"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #f1f5f9' }}
        >
          <style>
            {`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; } .dark .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #94a3b8; border-radius: 10px; border: 2px solid #f1f5f9; } .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; border-color: #1e293b; }`}
          </style>
          <div ref={contentRef}>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500 p-4">
                <Spinner />
                <p className="mt-4">Memuat pratinjau dokumen...</p>
              </div>
            )}
            {error ? (
              <ErrorDisplay message={error} />
            ) : !showContent && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500 p-4">
                 <i className="fa-solid fa-file-lines text-5xl mb-4"></i>
                <p>Hasil RPM Anda akan ditampilkan di sini.</p>
              </div>
            ) : (
              htmlContent && <div className="p-4 sm:p-6" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            )}
          </div>
        </div>

        {/* --- Logika Penguncian Cerdas --- */}
        {documentId && isLocked && !isLoading && (
            <>
            {hasCredits ? (
                // --- Tampilan "Soft Lock" jika punya kredit ---
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col items-center">
                    <p className="text-white text-sm mb-2 font-medium">Gunakan 1 kredit untuk membuka akses unduh.</p>
                    <button
                        onClick={handleUseCredit}
                        disabled={isUsingCredit}
                        className="flex items-center justify-center w-full max-w-xs bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 disabled:from-slate-500 disabled:to-slate-600 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isUsingCredit ? <Spinner /> : <i className="fa-solid fa-unlock-keyhole mr-2"></i>}
                        <span>Gunakan 1 Kredit (Sisa: {profile?.credit_balance})</span>
                    </button>
                </div>
            ) : (
                // --- Tampilan "Hard Lock" jika kredit habis ---
                <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 rounded-md">
                    <i className="fa-solid fa-lock text-4xl text-white/80 mb-4"></i>
                    <h4 className="text-xl font-bold text-white">Pratinjau Terkunci</h4>
                    <p className="text-slate-200 mt-2 mb-4">Anda tidak memiliki saldo unduhan.</p>
                    <button
                        onClick={onTopUpRequest}
                        className="mt-3 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-bolt"></i>
                        Isi Ulang Kredit untuk Melanjutkan
                    </button>
                </div>
            )}
            </>
        )}
      </div>
      
      {showContent && !isLocked && renderDownloadButtons()}
    </div>
  );
};

export default RpmPreview;
