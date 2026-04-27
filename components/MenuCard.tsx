import React from 'react';

interface MenuCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    enabled: boolean;
    theme: 'sky' | 'emerald' | 'indigo' | 'amber' | 'rose' | 'violet' | 'fuchsia' | 'lime' | 'teal' | 'cyan';
    onDisabledClick?: () => void;
}

const themeClasses = {
    sky: {
        gradient: 'from-sky-500 to-cyan-400',
        shadow: 'hover:shadow-sky-500/40',
        glowColor: 'rgba(14, 165, 233, 0.6)'
    },
    emerald: {
        gradient: 'from-emerald-500 to-green-500',
        shadow: 'hover:shadow-emerald-500/40',
        glowColor: 'rgba(16, 185, 129, 0.6)'
    },
    indigo: {
        gradient: 'from-indigo-500 to-purple-500',
        shadow: 'hover:shadow-indigo-500/40',
        glowColor: 'rgba(99, 102, 241, 0.6)'
    },
    amber: {
        gradient: 'from-amber-500 to-orange-500',
        shadow: 'hover:shadow-amber-500/40',
        glowColor: 'rgba(245, 158, 11, 0.6)'
    },
    rose: {
        gradient: 'from-rose-500 to-pink-500',
        shadow: 'hover:shadow-rose-500/40',
        glowColor: 'rgba(244, 63, 94, 0.6)'
    },
    violet: {
        gradient: 'from-violet-500 to-fuchsia-500',
        shadow: 'hover:shadow-violet-500/40',
        glowColor: 'rgba(139, 92, 246, 0.6)'
    },
    fuchsia: {
        gradient: 'from-fuchsia-500 to-pink-600',
        shadow: 'hover:shadow-fuchsia-500/40',
        glowColor: 'rgba(217, 70, 239, 0.6)'
    },
    lime: {
        gradient: 'from-lime-500 to-green-500',
        shadow: 'hover:shadow-lime-500/40',
        glowColor: 'rgba(132, 204, 22, 0.6)'
    },
    teal: {
        gradient: 'from-teal-500 to-cyan-500',
        shadow: 'hover:shadow-teal-500/40',
        glowColor: 'rgba(20, 184, 166, 0.6)'
    },
    cyan: {
        gradient: 'from-cyan-500 to-sky-500',
        shadow: 'hover:shadow-cyan-500/40',
        glowColor: 'rgba(6, 182, 212, 0.6)'
    }
};

const MenuCard: React.FC<MenuCardProps> = ({ title, description, icon, onClick, enabled, theme, onDisabledClick }) => {
    if (!enabled) {
        // Jika kartu dinonaktifkan oleh admin (memiliki handler onDisabledClick), tampilkan "Readme"
        if (onDisabledClick) {
            return (
                <div 
                    onClick={onDisabledClick}
                    className="relative group p-6 rounded-xl text-white overflow-hidden transition-all duration-300 bg-gradient-to-br from-slate-500 to-slate-600 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                    <div>
                        <div className="mb-4">{icon}</div>
                        <h3 className="text-xl font-bold">{title}</h3>
                        <p className="mt-2 text-sm text-white/90 flex-grow">{description}</p>
                    </div>

                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                        <span className="text-base font-bold text-white bg-black/50 px-4 py-2 rounded-full border border-white/30 shadow-lg">
                            Readme😇
                        </span>
                    </div>
                    
                    <div className="absolute -bottom-8 -right-6 text-white/10 opacity-60">
                        <div style={{ fontSize: '5rem' }}>{icon}</div>
                    </div>
                </div>
            );
        }

        // Jika kartu dinonaktifkan secara permanen (tanpa handler), tampilkan "Segera Hadir"
        const { gradient, glowColor } = themeClasses[theme];
        return (
            <div className={`relative group p-6 rounded-xl text-white overflow-hidden transition-all duration-300 bg-gradient-to-br ${gradient} cursor-not-allowed shadow-lg animate-pulse-glow`}>
                <style>
                    {`
                        @keyframes pulse-glow {
                            0%, 100% { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1), 0 0 15px -5px ${glowColor}; }
                            50% { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1), 0 0 25px 0px ${glowColor}; }
                        }
                        .animate-pulse-glow {
                            animation: pulse-glow 3s infinite ease-in-out;
                        }
                    `}
                </style>

                <div>
                    <div className="mb-4">{icon}</div>
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="mt-2 text-sm text-white/90 flex-grow">{description}</p>
                </div>

                <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                    <span className="text-sm font-bold text-white bg-black/50 px-4 py-2 rounded-full border border-white/30 shadow-lg">
                        Segera Hadir
                    </span>
                </div>
                
                <div className="absolute -bottom-8 -right-6 text-white/10 opacity-60">
                    <div style={{ fontSize: '5rem' }}>{icon}</div>
                </div>
            </div>
        );
    }

    const { gradient, shadow } = themeClasses[theme];

    return (
        <div 
            className={`relative group flex flex-col p-6 rounded-xl text-white overflow-hidden transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br ${gradient} cursor-pointer shadow-lg ${shadow} hover:shadow-xl`}
            onClick={onClick}
        >
            <div className="mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 text-sm text-white/90 flex-grow">{description}</p>
            <div className="absolute -bottom-8 -right-6 text-white/10 transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">
                 {/* FIX: Replaced React.cloneElement with a styled wrapper div. This avoids a TypeScript error because the underlying icon components do not accept a 'style' prop, and correctly resizes the icon via style inheritance. */}
                 <div style={{ fontSize: '5rem' }}>{icon}</div>
            </div>
        </div>
    );
};

export default MenuCard;