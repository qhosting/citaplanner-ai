
import React, { useState, useEffect } from 'react';
import { Type } from '@google/genai';
import { 
  Sparkles, Loader2, ChevronRight, TrendingUp, AlertCircle, 
  Target, ShieldCheck, Zap, BarChart3, Info, RefreshCw
} from 'lucide-react';
import { api, ERROR_PROTECTION_CODE } from '../services/api';

interface SWOTAnalysis {
  fortalezas: string[];
  debilidades: string[];
  oportunidades: string[];
  amenazas: string[];
  conclusion: string;
}

export const BusinessInsights: React.FC = () => {
  const [analysis, setAnalysis] = useState<SWOTAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDAFO, setShowFullDAFO] = useState(false);

  useEffect(() => {
    generateInsight();
  }, []);

  const generateInsight = async () => {
    setLoading(true);
    setError(null);
    const stats = await api.getBusinessStats();
    
    try {
      const response = await api.generateAIContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza estas métricas: ${JSON.stringify(stats)}`,
        config: {
          systemInstruction: "Eres un consultor de negocios de Aurum Capital. Devuelve un JSON DAFO (máximo 3 puntos por sección) y una conclusión sofisticada.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fortalezas: { type: Type.ARRAY, items: { type: Type.STRING } },
              debilidades: { type: Type.ARRAY, items: { type: Type.STRING } },
              oportunidades: { type: Type.ARRAY, items: { type: Type.STRING } },
              amenazas: { type: Type.ARRAY, items: { type: Type.STRING } },
              conclusion: { type: Type.STRING }
            },
            required: ["fortalezas", "debilidades", "oportunidades", "amenazas", "conclusion"]
          }
        },
      });

      const data = JSON.parse(response.text) as SWOTAnalysis;
      setAnalysis(data);
    } catch (err) {
      setError("Frecuencia inestable. Reintenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-[3rem] p-10 text-white relative overflow-hidden mb-12 border border-[#D4AF37]/10 animate-slide-up">
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#D4AF37]/5 blur-[100px] rounded-full" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] p-3 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <Sparkles className="text-black" size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl tracking-tight uppercase">Estratega AI <span className="text-[#D4AF37] font-light italic">Master</span></h3>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Análisis Predictivo de Red</p>
            </div>
          </div>
          <button 
            onClick={generateInsight}
            disabled={loading}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
          >
            {loading ? <Loader2 size={18} className="animate-spin text-[#D4AF37]" /> : <RefreshCw size={18} className="text-[#D4AF37]" />}
          </button>
        </div>

        {loading ? (
          <div className="space-y-6"><div className="h-24 w-full bg-white/5 animate-pulse rounded-[2.5rem]" /><div className="grid grid-cols-2 gap-4"><div className="h-32 bg-white/5 animate-pulse rounded-[2.5rem]" /><div className="h-32 bg-white/5 animate-pulse rounded-[2.5rem]" /></div></div>
        ) : error ? (
          <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] text-center">
            <AlertCircle className="mx-auto text-[#D4AF37] mb-4" size={32} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{error}</p>
          </div>
        ) : analysis ? (
          <div className="space-y-10">
            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-8 rounded-[2.5rem] relative">
              <p className="text-xl font-light text-slate-200 italic leading-relaxed pr-10">"{analysis.conclusion}"</p>
              <Info className="absolute top-8 right-8 text-[#D4AF37]/30" size={20} />
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-700 ${showFullDAFO ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden md:max-h-none md:opacity-100'}`}>
              {[
                { title: 'Fortalezas', items: analysis.fortalezas, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
                { title: 'Debilidades', items: analysis.debilidades, icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/5' },
                { title: 'Oportunidades', items: analysis.oportunidades, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/5' },
                { title: 'Amenazas', items: analysis.amenazas, icon: Target, color: 'text-red-400', bg: 'bg-red-500/5' }
              ].map((sec, i) => (
                <div key={i} className={`${sec.bg} border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-colors`}>
                  <div className={`flex items-center gap-2 mb-4 ${sec.color}`}>
                    <sec.icon size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{sec.title}</span>
                  </div>
                  <ul className="space-y-3">
                    {sec.items.map((it, idx) => (
                      <li key={idx} className="text-xs text-slate-400 flex items-start gap-3">
                        <div className={`w-1 h-1 rounded-full ${sec.color} mt-1.5`} />
                        <span className="leading-relaxed">{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex justify-center md:hidden">
              <button onClick={() => setShowFullDAFO(!showFullDAFO)} className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">{showFullDAFO ? 'Ocultar DAFO' : 'Ver DAFO Maestro'}</button>
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-wrap gap-10 items-center justify-between">
               <div className="flex gap-10">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400"><TrendingUp size={18} /></div>
                    <div><p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Crecimiento</p><p className="text-lg font-black text-white">+12.5%</p></div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400"><BarChart3 size={18} /></div>
                    <div><p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Retención</p><p className="text-lg font-black text-white">65%</p></div>
                 </div>
               </div>
               <button className="gold-btn px-8 py-3 rounded-xl text-[9px] uppercase tracking-widest flex items-center gap-2">Estrategia Detallada <ChevronRight size={14}/></button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
