
import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Calendar, ShoppingBag, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, Activity, Globe, Heart
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { BusinessInsights } from '../components/BusinessInsights';
import { LashStatsDashboard } from '../components/LashStatsDashboard';

const formatPrice = (price: number | string) => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const AnalyticsPage: React.FC = () => {
  const [activeHubTab, setActiveHubTab] = useState<'FINANCIAL' | 'LASH_DIAGNOSIS'>('FINANCIAL');
  const { data: stats, isLoading } = useQuery({
    queryKey: ['businessStats'],
    queryFn: api.getBusinessStats
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.getAppointments()
  });

  const kpis = useMemo(() => {
    const defaultKpis = [
      { label: 'Ingresos Mensuales', value: '$0', trend: '0%', isUp: true, icon: DollarSign, color: 'text-emerald-500' },
      { label: 'Citas Finalizadas', value: '0', trend: '0%', isUp: true, icon: Calendar, color: 'text-blue-500' },
      { label: 'Nuevos Clientes', value: '0', trend: '0%', isUp: true, icon: Users, color: 'text-amber-500' },
      { label: 'Tasa de Ocupación', value: '0%', trend: '0%', isUp: true, icon: Activity, color: 'text-[#D4AF37]' },
    ];

    if (!stats?.kpis || stats.kpis.length === 0) return defaultKpis;

    return stats.kpis.map((k: any, i: number) => ({
      label: k.label,
      value: k.value,
      trend: k.change,
      isUp: k.trend === 'up',
      icon: i === 0 ? DollarSign : i === 1 ? Calendar : i === 2 ? Users : Activity,
      color: i === 0 ? 'text-emerald-500' : i === 1 ? 'text-blue-500' : i === 2 ? 'text-amber-500' : 'text-[#D4AF37]'
    }));
  }, [stats]);

  const maxRevenue = useMemo(() => {
    if (!stats?.revenueFlow?.length) return 1;
    return Math.max(...stats.revenueFlow.map((d: any) => d.total));
  }, [stats]);

  const serviceDistribution = useMemo(() => {
    if (!stats?.serviceMix?.length) return [
      { label: 'Sin datos', value: 100, color: 'bg-white/10' }
    ];
    const total = stats.serviceMix.reduce((acc: number, s: any) => acc + s.value, 0);
    return stats.serviceMix.map((s: any, i: number) => ({
      label: s.name,
      value: Math.round((s.value / total) * 100),
      color: i === 0 ? 'bg-[#D4AF37]' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-emerald-500' : 'bg-white/10'
    }));
  }, [stats]);

  const topProducts = stats?.topProducts || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
              Intelligence <span className="gold-text-gradient font-light">Hub</span>
            </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Financial Metrics &amp; Network Analytics</p>
        </div>
        <div className="flex gap-4">
           <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-3 border-white/5">
              <Globe size={18} className="text-[#D4AF37]" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Node Sync: Active</span>
           </div>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1.5 mb-12 max-w-md">
        <button
          onClick={() => setActiveHubTab('FINANCIAL')}
          className={`flex-1 py-3 px-4 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeHubTab === 'FINANCIAL'
              ? 'bg-[#D4AF37] text-black shadow-lg font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 size={14} /> Métricas del Negocio
        </button>
        <button
          onClick={() => setActiveHubTab('LASH_DIAGNOSIS')}
          className={`flex-1 py-3 px-4 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeHubTab === 'LASH_DIAGNOSIS'
              ? 'bg-[#D4AF37] text-black shadow-lg font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart size={14} /> Fichas Técnicas LASH
        </button>
      </div>

      {activeHubTab === 'FINANCIAL' && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {kpis.map((kpi, i) => (
              <div key={i} className="glass-card p-8 rounded-[3rem] border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                  <kpi.icon size={48} />
                </div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{kpi.label}</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-3xl font-black text-white tracking-tighter">{kpi.value}</h3>
                  <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-white/5 ${kpi.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {kpi.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Main Insights Chart Area */}
            <div className="lg:col-span-2 space-y-12">
               <BusinessInsights />
               
               <div className="glass-card p-10 rounded-[3.5rem] border-white/5">
                  <div className="flex justify-between items-center mb-10">
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                       <BarChart3 size={20} className="text-[#D4AF37]" /> Flujo de Ingresos Semanal
                     </h3>
                     <div className="flex gap-4">
                        <span className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase"><div className="w-2 h-2 rounded-full bg-[#D4AF37]" /> Servicios</span>
                        <span className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase"><div className="w-2 h-2 rounded-full bg-white/20" /> Productos</span>
                     </div>
                  </div>
                  
                  <div className="h-64 flex items-end justify-between gap-4 px-4">
                     {(stats?.revenueFlow || [0,0,0,0,0,0,0]).map((d: any, i: number) => {
                       const h = maxRevenue > 0 ? (d.total / maxRevenue) * 100 : 0;
                       const dayLabel = d.day ? new Date(d.day).toLocaleDateString('es-MX', { weekday: 'short' }) : `Día ${i+1}`;
                       return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                            <div className="w-full relative h-full flex items-end">
                              <div style={{ height: `${Math.max(h, 5)}%` }} className="w-full bg-white/5 rounded-t-xl group-hover:bg-white/10 transition-all border-t border-x border-white/5" />
                              <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-gradient-to-t from-[#D4AF37] to-[#F1C40F] rounded-t-xl shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
                            </div>
                            <span className="text-[8px] font-black text-slate-600 uppercase">{dayLabel}</span>
                        </div>
                       );
                     })}
                  </div>
               </div>
            </div>

            {/* Sidebar Analytics */}
            <div className="lg:col-span-1 space-y-12">
               <div className="glass-card p-10 rounded-[3.5rem] border-white/5">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                    <PieChart size={20} className="text-blue-500" /> Mix de Servicios
                  </h3>
                  <div className="space-y-6">
                     {serviceDistribution.map((item: any, i: number) => (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-slate-400 truncate max-w-[150px]">{item.label}</span>
                             <span className="text-white">{item.value}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div style={{ width: `${item.value}%` }} className={`h-full ${item.color}`} />
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="glass-card p-10 rounded-[3.5rem] border-white/5 bg-gradient-to-tr from-[#050505] to-[#0a0a0a]">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                    <ShoppingBag size={20} className="text-emerald-500" /> Top Productos
                  </h3>
                  <div className="space-y-6">
                     {topProducts.length > 0 ? topProducts.map((prod: any, i: number) => (
                       <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="overflow-hidden">
                            <p className="text-[11px] font-black text-white uppercase truncate">{prod.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold">{prod.sales} Unidades vendidas</p>
                          </div>
                          <span className="text-xs font-black text-emerald-500 whitespace-nowrap">+{prod.sales}</span>
                       </div>
                     )) : (
                        <div className="text-center py-8">
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sin ventas registradas</p>
                        </div>
                     )}
                  </div>
                  <button className="w-full mt-10 py-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-all">Ver Reporte Completo</button>
               </div>
            </div>
          </div>
        </>
      )}

      {activeHubTab === 'LASH_DIAGNOSIS' && (
        <LashStatsDashboard />
      )}
    </div>
  );
};
