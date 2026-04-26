
import React from 'react';

interface LogoProps {
    size?: number;
    color?: string;
    customUrl?: string;
    businessName?: string;
}

export const LogoCitaplanner: React.FC<LogoProps> = ({ size = 20, color = "#fff", customUrl, businessName }) => {
    const hasUrl = customUrl && customUrl.trim() !== "";
    
    return (
        <div className="flex items-center gap-4 cursor-pointer group">
            <div className="relative flex items-center">
                <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                {hasUrl ? (
                    <img 
                        src={customUrl} 
                        alt={businessName} 
                        className="h-10 md:h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-110" 
                        onLoad={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.opacity = "1";
                        }}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.closest('.group');
                            if (parent) {
                                const fallback = parent.querySelector('.logo-text-fallback');
                                if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                            }
                        }}
                        style={{ opacity: 0, transition: 'opacity 0.3s' }}
                    />
                ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: color }}>
                        <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                            <path d="M12 20L28 20M20 12L20 28" stroke="white" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                    </div>
                )}
            </div>
            <span className={`logo-text-fallback text-sm md:text-base font-playfair font-black uppercase tracking-tighter transition-all duration-500 ${hasUrl ? 'hidden' : 'block'}`} style={{ color }}>
                {businessName || "CitaPlanner"}
            </span>
        </div>
    );
};
