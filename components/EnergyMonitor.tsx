import React from 'react';
import { ShieldCheck, Zap, TrendingUp, Globe } from 'lucide-react';

export const EnergyMonitor: React.FC = () => {
  const codes = [
    { label: 'Macro Salvación', code: '319817318', icon: Globe, color: 'text-blue-400/60' },
    { label: 'Protección Aurum', code: '8888', icon: ShieldCheck, color: 'text-indigo-400/60' },
    { label: 'Flujo Abundancia', code: '520 71427321893', icon: TrendingUp, color: 'text-emerald-400/60' },
    { label: 'Crecimiento Exponencial', code: '419 488 71', icon: Zap, color: 'text-[#D4AF37]/60' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
      {codes.map((item, i) => (
        <div
          key={i}
          className="flex-shrink-0 bg-card-theme border border-theme px-6 py-3 rounded-[1.5rem] flex items-center gap-4 group hover:bg-input-theme transition-all cursor-default"
        >
          <div className={`${item.color} group-hover:scale-110 transition-transform`}>
            <item.icon size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-main transition-colors">
              {item.label}
            </span>
            <span className="text-[11px] font-mono font-bold text-muted group-hover:text-main transition-colors">
              {item.code}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};