
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendPositive?: boolean;
    color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    trendPositive,
    color = '#D4AF37'
}) => {
    return (
        <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border-theme bg-card-theme">
            <div
                className="absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 rounded-full"
                style={{ backgroundColor: color }}
            />

            <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-input-theme border border-theme group-hover:border-[#D4AF37]/30 transition-all">
                    <Icon size={24} style={{ color }} />
                </div>
                {trend && (
                    <div className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${trendPositive
                        ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                        : 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                        }`}>
                        {trend}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-4xl font-black text-main tracking-tighter mb-1">{value}</h3>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">{title}</p>
            </div>
        </div>
    );
};
