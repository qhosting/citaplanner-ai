
import React from 'react';

interface LogoProps {
    size?: number;
    color?: string;
    customUrl?: string;
    businessName?: string;
}

export const LogoCitaplanner: React.FC<LogoProps> = ({ size = 20, color = "#fff", customUrl, businessName }) => (
    <div className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
            {customUrl ? (
                <img src={customUrl} alt={businessName} className="object-contain transition-transform duration-500 group-hover:scale-110" style={{ height: size * 1.5, width: 'auto' }} />
            ) : (
                <svg width={size * 1.5} height={size * 1.5} viewBox="0 0 40 40" fill="none" className="transition-transform duration-500 group-hover:rotate-12">
                    <rect width="40" height="40" rx="12" fill={color} />
                    <path d="M12 20L28 20M20 12L20 28" stroke="white" strokeWidth="4" strokeLinecap="round" />
                </svg>
            )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 group-hover:tracking-[0.6em]" style={{ color }}>{businessName || "CitaPlanner"}</span>
    </div>
);
