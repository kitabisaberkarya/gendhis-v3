import React from 'react';
import { ArrowLeft, Zap, Rocket, Star, Building, Gem, Award, School } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// Definisi Tipe untuk Paket
interface CreditPackage {
  id: string;
  name: string;
  description: string;
  downloads: number;
  price: number;
  theme: {
    gradient: string;
    iconColor: string;
    button: string;
    badge?: string;
    glow?: string;
  };
  icon: React.ReactNode;
  isPopular?: boolean;
}

const packages: CreditPackage[] = [
  {
    id: 'trial',
    name: 'PERCOBAAN',
    description: 'Untuk mencoba fitur dasar.',
    downloads: 5,
    price: 10000,
    theme: {
      gradient: 'from-teal-900/50 to-slate-900',
      iconColor: 'text-teal-400',
      button: 'bg-teal-500 hover:bg-teal-600',
    },
    icon: <Rocket size={24} />,
  },
  {
    id: 'saver',
    name: 'HEMAT',
    description: 'Kebutuhan satu bulan.',
    downloads: 15,
    price: 25000,
    theme: {
      gradient: 'from-sky-900/50 to-slate-900',
      iconColor: 'text-sky-400',
      button: 'bg-sky-500 hover:bg-sky-600',
    },
    icon: <Star size={24} />,
  },
  {
    id: 'teacher',
    name: 'GURU',
    description: 'Pilihan terbaik & paling hemat.',
    downloads: 30,
    price: 45000,
    theme: {
      gradient: 'from-violet-800/50 to-slate-900',
      iconColor: 'text-violet-400',
      button: 'bg-violet-600 hover:bg-violet-700',
      badge: 'bg-gradient-to-r from-violet-500 to-purple-500',
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.5)]',
    },
    icon: <Gem size={24} />,
    isPopular: true,
  },
  {
    id: 'expert',
    name: 'AHLI',
    description: 'Untuk pengguna aktif.',
    downloads: 50,
    price: 70000,
    theme: {
      gradient: 'from-amber-800/50 to-slate-900',
      iconColor: 'text-amber-400',
      button: 'bg-amber-500 hover:bg-amber-600',
    },
    icon: <Award size={24} />,
  },
  {
    id: 'school',
    name: 'SEKOLAH',
    description: 'Kebutuhan satu tim/sekolah kecil.',
    downloads: 100,
    price: 125000,
    theme: {
      gradient: 'from-rose-900/50 to-slate-900',
      iconColor: 'text-rose-400',
      button: 'bg-rose-500 hover:bg-rose-600',
    },
    icon: <School size={24} />,
  },
  {
    id: 'institution',
    name: 'INSTITUSI',
    description: 'Skala besar untuk institusi.',
    downloads: 250,
    price: 250000,
    theme: {
      gradient: 'from-indigo-900/50 to-slate-900',
      iconColor: 'text-indigo-400',
      button: 'bg-indigo-500 hover:bg-indigo-600',
    },
    icon: <Building size={24} />,
  },
];

interface CreditStoreProps {
    onBack: () => void;
    session: Session | null;
}

const CreditStore: React.FC<CreditStoreProps> = ({ onBack, session }) => {
    
    const handlePackageSelect = (pkg: CreditPackage) => {
        const userName = session?.user?.user_metadata?.full_name || 'Pengguna Gendhis';
        const userEmail = session?.user?.email || 'Tidak ada email';

        const whatsAppNumber = "6282134894442";
        const bcaNumber = "4640123414";
        const bcaName = "Ari Wijaya";
        
        const message = `
Halo Tim Gendhis,

Saya tertarik untuk mengisi ulang saldo unduhan. Berikut adalah detail pesanan saya:

*Nama:* ${userName}
*Email:* ${userEmail}

*Paket Pilihan:*
-----------------------------
*Nama Paket:* *${pkg.name}*
*Jumlah:* ${pkg.downloads} Unduhan
*Total Biaya:* *Rp ${pkg.price.toLocaleString('id-ID')}*
-----------------------------

Mohon konfirmasi selanjutnya untuk proses transfer ke rekening BCA *${bcaNumber}* a.n. *${bcaName}*.

Terima kasih atas inovasinya yang luar biasa!
`.trim();

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsAppNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

  return (
    <div className="min-h-screen bg-slate-900 pb-20 text-white">
      {/* Header Navigation */}
      <div className="bg-slate-900/80 backdrop-blur-sm shadow-sm sticky top-0 z-20 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-300" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-white">Kembali ke Menu Utama</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-12 space-y-12">
        {/* Banner Header */}
        <div className="text-center">
            <div className="inline-block p-4 bg-sky-900/50 rounded-full mb-4 border border-sky-500/30">
                <Zap className="w-8 h-8 text-sky-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Isi Ulang Saldo Unduhan</h2>
            <p className="text-slate-400 text-lg mt-2 max-w-2xl mx-auto">
              Pilih paket yang paling sesuai dengan kebutuhan Anda dan lanjutkan berkarya.
            </p>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-slate-800 rounded-2xl p-6 border transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl flex flex-col ${
                pkg.isPopular ? `border-violet-500 ${pkg.theme.glow}` : 'border-slate-700'
              }`}
            >
                {/* Popular Badge */}
                {pkg.isPopular && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg tracking-wide ${pkg.theme.badge}`}>
                    PALING POPULER
                  </div>
                )}
                
                <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`${pkg.theme.iconColor}`}>{pkg.icon}</div>
                        <h3 className="font-bold text-slate-100 text-lg tracking-wide uppercase">
                            {pkg.name}
                        </h3>
                    </div>
                    <p className="text-slate-400 text-xs mb-6 h-8">{pkg.description}</p>
                </div>
                
                <div className="text-center my-6">
                    <div className={`text-6xl font-extrabold ${pkg.theme.iconColor} flex items-baseline justify-center gap-1`}>
                      {pkg.downloads}
                      <span className="text-xl font-medium text-slate-400">Unduhan</span>
                    </div>
                    <div className="text-2xl font-semibold text-slate-300 mt-2">
                      Rp {pkg.price.toLocaleString('id-ID')}
                    </div>
                </div>

                <button
                    onClick={() => handlePackageSelect(pkg)}
                    className={`w-full py-3 mt-auto rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-white ${pkg.theme.button} active:scale-95`}
                >
                    <i className="fa-brands fa-whatsapp"></i>
                    Pilih Paket
                </button>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 pt-8 border-t border-slate-700 space-y-2">
           <h3 className="text-lg font-medium text-slate-300 mb-2">Butuh solusi khusus untuk Dinas atau Institusi besar?</h3>
            <a 
                href="https://wa.me/6282134894442?text=Halo%20Tim%20Gendhis%2C%20saya%20tertarik%20dengan%20solusi%20khusus%20untuk%20skala%20besar."
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Hubungi Kami Sekarang
            </a>
        </div>
      </div>
    </div>
  );
};

export default CreditStore;
