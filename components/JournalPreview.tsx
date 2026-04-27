
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FileWordIcon } from './IconComponents';
import { getDocumentById, getUserProfile, useCreditForDocument } from '../services/supabaseService';
import type { GeneratedDocumentData } from '../types';
import Spinner from './Spinner';
import PaymentStatusModal from './PaymentStatusModal';

interface JournalPreviewProps {
  documentId: string | null;
  freeResultHtml: string;
  isPaymentSystemEnabled: boolean;
  userName: string;
  error: string;
  documentPrice: number;
  onTopUpRequest: () => void;
}

const JournalPreview: React.FC<JournalPreviewProps> = ({ documentId, freeResultHtml, isPaymentSystemEnabled, error, onTopUpRequest }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [documentData, setDocumentData] = useState<GeneratedDocumentData | null>(null);
  const [profile, setProfile] = useState<{ credit_balance: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingCredit, setIsUsingCredit] = useState(false);

  const [modalState, setModalState] = useState<{ isOpen: boolean; status: 'loading' | 'success' | 'error'; message: string; }>({ isOpen: false, status: 'loading', message: '', });

  const closeModal = useCallback(() => setModalState({ isOpen: false, status: 'loading', message: '' }), []);

  const fetchDocumentAndProfile = useCallback(async (id: string) => {
    try {
      const [doc, userProfile] = await Promise.all([ getDocumentById(id), getUserProfile() ]);
      setDocumentData(doc);
      setProfile(userProfile);
    } catch (e) {
      setModalState({ isOpen: true, status: 'error', message: 'Gagal memuat status.' });
    }
  }, []);

  useEffect(() => {
    if (isPaymentSystemEnabled && documentId) {
      setIsLoading(true);
      fetchDocumentAndProfile(documentId).finally(() => setIsLoading(false));
    }
  }, [documentId, isPaymentSystemEnabled, fetchDocumentAndProfile]);

  const handleUseCredit = async () => {
    if (!documentId || (profile?.credit_balance ?? 0) <= 0) return;
    setIsUsingCredit(true);
    setModalState({ isOpen: true, status: 'loading', message: 'Mengurangi saldo...' });
    const { success, error: creditError } = await useCreditForDocument(documentId);
    if (success) {
      setModalState({ isOpen: true, status: 'success', message: '' });
      setTimeout(() => { closeModal(); fetchDocumentAndProfile(documentId); }, 1500);
    } else {
      setModalState({ isOpen: true, status: 'error', message: creditError?.message || 'Gagal.' });
    }
    setIsUsingCredit(false);
  };

  const handleWordDownload = () => {
    const contentElement = contentRef.current;
    if (!contentElement) return;
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page { size: A4; margin: 1.5cm; } body { font-family: Arial, sans-serif; }</style></head><body>${contentElement.innerHTML}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Jurnal_Guru_Gendhis.doc';
    link.click();
  };

  const isLocked = isPaymentSystemEnabled && documentData?.payment_status !== 'paid';
  const htmlContent = isPaymentSystemEnabled ? (documentData?.document_content_html || '') : freeResultHtml;
  const showContent = !!htmlContent && !error;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 h-[750px] flex flex-col sticky top-24">
      <PaymentStatusModal isOpen={modalState.isOpen} status={modalState.status} errorMessage={modalState.message} onClose={closeModal}/>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Pratinjau Jurnal</h3>
      <div className="relative flex-grow overflow-hidden bg-slate-50 dark:bg-slate-900/50 rounded-md p-4">
        <div className="h-full overflow-y-auto custom-scrollbar-lime">
          <div ref={contentRef} className="bg-white p-6 shadow-sm min-h-full">
            {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
            {error ? (<div className="text-rose-500 p-4">{error}</div>) : !showContent && !isLoading ? (<div className="flex flex-col items-center justify-center h-full text-slate-400"><i className="fa-solid fa-file-signature text-5xl mb-4"></i><p>Jurnal Anda akan tampil di sini.</p></div>) : (htmlContent && <div className="text-black prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />)}
          </div>
        </div>
        {documentId && isLocked && !isLoading && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <i className="fa-solid fa-lock text-white text-4xl mb-4"></i>
                <h4 className="text-xl font-bold text-white mb-2">Simpan ke Jurnal Digital</h4>
                <p className="text-slate-200 text-sm mb-6">Gunakan 1 kredit untuk membuka akses unduh file Word.</p>
                {(profile?.credit_balance ?? 0) > 0 ? (
                    <button onClick={handleUseCredit} disabled={isUsingCredit} className="w-full max-w-xs bg-lime-500 hover:bg-lime-600 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2">
                         {isUsingCredit ? <Spinner /> : <i className="fa-solid fa-key"></i>} Gunakan 1 Kredit (Sisa: {profile?.credit_balance})
                    </button>
                ) : (
                    <button onClick={onTopUpRequest} className="bg-amber-500 text-white px-6 py-3 rounded-lg font-bold">Isi Ulang Saldo</button>
                )}
            </div>
        )}
      </div>
      {showContent && !isLocked && (
          <button onClick={handleWordDownload} className="mt-4 w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2">
            <FileWordIcon /> Unduh File Word (.doc)
          </button>
      )}
      <style>{`.custom-scrollbar-lime::-webkit-scrollbar-thumb { background-color: #84cc16; }`}</style>
    </div>
  );
};

export default JournalPreview;
