import React from 'react';
import { BusinessInsights } from '../components/BusinessInsights';
import { BarChart3, ShieldCheck, Zap } from 'lucide-react';

export const InsightsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-entrance">
      <div className="mb-16">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Estrategia <span className="gold-text-gradient font-light">AI Master</span></h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-1">Inteligencia de Negocios Basada en Redes Neuronales</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <BusinessInsights />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-10 rounded-[3.5rem] border-white/5">
                <ShieldCheck className="text-[#D4AF37] mb-6" size={32} />
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Garantía de Privacidad</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Sus datos están protegidos bajo el protocolo de encriptación Aurum Layer-8. La IA analiza patrones agregados sin comprometer la identidad individual de sus clientes elite.</p>
            </div>
            <div className="glass-card p-10 rounded-[3.5rem] border-white/5">
                <Zap className="text-[#D4AF37] mb-6" size={32} />
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Optimización en Tiempo Real</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Este módulo se sincroniza cada 60 segundos con los datos de VENTAS & POS y agenda para ofrecerle sugerencias de crecimiento precisas y escalables.</p>
            </div>
        </div>
      </div>
    </div>
  );
};