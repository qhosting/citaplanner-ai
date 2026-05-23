import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, Sparkles, TrendingUp, Info, Moon, Compass, Users, AlertTriangle, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export const LashStatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLashStats();
      if (res && res.success) {
        setStats(res);
      } else {
        toast.error('Error al cargar analíticas de pestañas');
      }
    } catch (e) {
      toast.error('Error de red al cargar analíticas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="animate-spin text-[#D4AF37] mx-auto" size={36} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">
          Procesando datos relacionales de pestañas...
        </p>
      </div>
    );
  }

  if (!stats || stats.totalWithDiagnosis === 0) {
    return (
      <div className="py-24 text-center glass-card rounded-[2rem] border-dashed border-white/5 opacity-40 max-w-xl mx-auto">
        <Users size={48} className="mx-auto mb-4 text-slate-700 animate-pulse" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[9.5px]">Analíticas de Pestañas Indisponibles</p>
        <p className="text-slate-600 font-medium text-[10px] mt-2 max-w-[320px] mx-auto leading-normal">
          Las estadísticas comenzarán a calcularse en vivo tan pronto como las clientas o el staff registren las primeras Fichas Técnicas.
        </p>
      </div>
    );
  }

  // Porcentaje de alergia al cianoacrilato
  const cyanoPercent = Math.round((stats.criticalAllergies.cyanoacrylate / stats.totalWithDiagnosis) * 100) || 0;
  
  // Porcentaje total de fricción mecánica al dormir (dormir de lado)
  const sideSleepersCount = stats.sleepSides.DERECHO + stats.sleepSides.IZQUIERDO;
  const sideSleepersPercent = Math.round((sideSleepersCount / stats.totalWithDiagnosis) * 100) || 0;

  // Encontrar el canal de adquisición más efectivo
  let topSource = 'Ninguno';
  let maxSourceVal = -1;
  Object.entries(stats.referralSources).forEach(([key, val]) => {
    if ((val as number) > maxSourceVal) {
      maxSourceVal = val as number;
      topSource = key;
    }
  });

  return (
    <div className="space-y-8 animate-entrance">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total diagnósticos */}
        <div className="glass-card p-5 rounded-2xl border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start gap-4">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider leading-relaxed">Fichas Completadas</span>
            <Users size={16} className="text-[#D4AF37]" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.totalWithDiagnosis}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Socias</span>
          </div>
          <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-2 border-t border-white/5 pt-2">
            {Math.round((stats.totalWithDiagnosis / stats.totalClients) * 100)}% de tu base de clientes
          </div>
        </div>

        {/* KPI 2: Hipersensibilidad al cianoacrilato */}
        <div className={`glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between border-white/5 ${
          cyanoPercent > 10 ? 'bg-rose-950/10 border-rose-500/20' : 'bg-gradient-to-b from-white/[0.02] to-transparent'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start gap-4">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider leading-relaxed">Hipersensibilidad Cianoacrilato</span>
            <ShieldAlert size={16} className={cyanoPercent > 10 ? 'text-rose-500' : 'text-slate-500'} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${cyanoPercent > 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{cyanoPercent}%</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">({stats.criticalAllergies.cyanoacrylate} Socias)</span>
          </div>
          <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-2 border-t border-white/5 pt-2 flex items-center gap-1.5">
            {cyanoPercent > 10 && <AlertTriangle size={10} className="text-rose-500" />}
            Requiere adhesivo hipoalergénico especial
          </div>
        </div>

        {/* KPI 3: Lado de Sueño / Fricción mecánica */}
        <div className="glass-card p-5 rounded-2xl border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start gap-4">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider leading-relaxed">Fricción Mecánica Activa</span>
            <Moon size={16} className="text-sky-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{sideSleepersPercent}%</span>
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Lado Derecho/Izquierdo</span>
          </div>
          <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-2 border-t border-white/5 pt-2">
            Riesgo de menor retención por contacto físico
          </div>
        </div>

        {/* KPI 4: Top canal de adquisición */}
        <div className="glass-card p-5 rounded-2xl border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start gap-4">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider leading-relaxed">Líder de Adquisición</span>
            <Compass size={16} className="text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white truncate max-w-44 uppercase tracking-tighter">{topSource}</span>
          </div>
          <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-2 border-t border-white/5 pt-2">
            {maxSourceVal} clientes registradas a través de este canal
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Aggregates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sleeping Positions Retention Friction */}
        <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent space-y-6">
          <div>
            <h4 className="text-[10px] sm:text-[11px] font-black text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center gap-2">
              <Moon size={14} className="text-sky-400" /> Distribución de Posición al Dormir (Retención)
            </h4>
            <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">Correlación física de durabilidad de pestañas</p>
          </div>

          <div className="space-y-4">
            {[
              { id: 'DERECHO', label: 'Dormir sobre Lado Derecho (Fricción ojo derecho)', val: stats.sleepSides.DERECHO, color: 'from-amber-500 to-[#D4AF37]' },
              { id: 'IZQUIERDO', label: 'Dormir sobre Lado Izquierdo (Fricción ojo izquierdo)', val: stats.sleepSides.IZQUIERDO, color: 'from-amber-600 to-[#B8860B]' },
              { id: 'BOCA_ARRIBA', label: 'Dormir Boca Arriba (Retención óptima/sin contacto)', val: stats.sleepSides.BOCA_ARRIBA, color: 'from-emerald-600 to-emerald-500' }
            ].map(item => {
              const percent = Math.round((item.val / stats.totalWithDiagnosis) * 100) || 0;
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white">{item.val} ({percent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-black/60 border border-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-4 rounded-xl flex gap-3 items-start">
            <Info size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
            <p className="text-[8.5px] text-slate-500 leading-relaxed uppercase tracking-wider">
              **Recomendación Técnica**: Si el 30% o más de tus clientas duerme sobre un lado específico, capacita a tus estilistas para aplicar sellador acrílico protector adicional y realizar un mayor aislamiento en el extremo externo de ese ojo.
            </p>
          </div>
        </div>

        {/* Acquisition referral channels */}
        <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent space-y-6">
          <div>
            <h4 className="text-[10px] sm:text-[11px] font-black text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center gap-2">
              <Compass size={14} className="text-emerald-400" /> Efectividad de Canales de Adquisición
            </h4>
            <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">Origen de referidos y tráfico del salón</p>
          </div>

          <div className="space-y-4">
            {[
              { id: 'RECOMENDACION', label: 'Recomendación de Socios', val: stats.referralSources.RECOMENDACION, color: 'from-[#D4AF37] to-amber-500' },
              { id: 'FACEBOOK', label: 'Facebook / Redes Sociales', val: stats.referralSources.FACEBOOK, color: 'from-sky-600 to-sky-400' },
              { id: 'REVISTA', label: 'Revista o Impresos', val: stats.referralSources.REVISTA, color: 'from-purple-600 to-purple-400' },
              { id: 'OTRO', label: 'Otro Canal / Desconocido', val: stats.referralSources.OTRO, color: 'from-slate-600 to-slate-400' }
            ].map(item => {
              const percent = Math.round((item.val / stats.totalWithDiagnosis) * 100) || 0;
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white">{item.val} ({percent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-black/60 border border-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex gap-3 items-start">
            <Sparkles size={14} className="text-emerald-400" shrink-0="true" />
            <p className="text-[8.5px] text-slate-500 leading-relaxed uppercase tracking-wider">
              Las recomendaciones directas siguen siendo el motor de mayor retención de socios. Refuerza tu programa de referidos otorgando puntos de lealtad adicionales.
            </p>
          </div>
        </div>
      </div>

      {/* Medical conditions aggregates */}
      <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent space-y-6">
        <div>
          <h4 className="text-[10px] sm:text-[11px] font-black text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center gap-2">
            <Activity size={14} className="text-rose-500" /> Registro Consolidado de Condiciones Clínicas
          </h4>
          <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider">Factores de riesgo médico registrados e identificados</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Tiroides', val: stats.commonConditions.thyroid, desc: 'Afecta caída/crecimiento' },
            { label: 'Alopecia', val: stats.commonConditions.alopecia, desc: 'Pocas pestañas naturales' },
            { label: 'Cirugía de Ojos', val: stats.commonConditions.eyeSurgery, desc: 'Sensibilidad corneal' },
            { label: 'Embarazo (<3m)', val: stats.commonConditions.pregnancy, desc: 'Retención hormonal' },
            { label: 'Hormonal', val: stats.commonConditions.hormonalImbalance, desc: 'Glándula sebácea activa' },
            { label: 'Estrés Extremo', val: stats.commonConditions.extremeStress, desc: 'Debilitamiento folicular' }
          ].map((item, idx) => (
            <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl text-center space-y-2 flex flex-col justify-between">
              <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider leading-relaxed block">{item.label}</span>
              <div>
                <span className="text-2xl font-black text-white block">{item.val}</span>
                <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wide block mt-1">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
