
import React from 'react';
import { ShieldAlert, Home, Lock, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MaintenanceScreenProps {
  contactPhone?: string;
  brandName?: string;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ 
  contactPhone = "+52 55 0000 0000", 
  brandName = "Aurum Ecosystem" 
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 relative overflow-hidden">
       {/* Background Aesthetics */}
       <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
       <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

       <div className="max-w-2xl w-full text-center space-y-12 animate-entrance relative z-10">
          <div className="relative inline-block group">
             <div className="w-32 h-32 rounded-[3rem] bg-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shadow-[0_0_60px_rgba(212,175,55,0.15)] group-hover:scale-105 transition-transform duration-700">
                <ShieldAlert size={64} className="animate-pulse" />
             </div>
             <div className="absolute -top-3 -right-3 bg-red-500/90 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full border-4 border-[#050505] tracking-widest shadow-xl">
                System Lock
             </div>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
              Protocolo de <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#8C6F1B]">Mantenimiento</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg mx-auto">
              La infraestructura de <b>{brandName}</b> está recibiendo una actualización de seguridad crítica o ajustes de temporada.
              <br/><br/>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-600 font-bold">El acceso público está temporalmente restringido.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
             <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02]">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                   <Phone size={12} className="text-[#D4AF37]" /> Concierge Directo
                </p>
                <p className="text-white font-black tracking-widest text-sm">{contactPhone}</p>
             </div>
             <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02]">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                   <Lock size={12} className="text-emerald-500" /> Estado de Red
                </p>
                <p className="text-emerald-500 font-black uppercase tracking-widest text-sm">Datos Protegidos</p>
             </div>
          </div>

          <div className="pt-12 flex justify-center gap-8 border-t border-white/5">
             <button 
                onClick={() => navigate('/login')} 
                className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-[#D4AF37] transition-all group"
             >
                <Lock size={14} className="group-hover:text-[#D4AF37] transition-colors" /> Acceso Staff
             </button>
          </div>
       </div>
    </div>
  );
};
