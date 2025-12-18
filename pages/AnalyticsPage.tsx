
import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Calendar, ShoppingBag, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, Activity, Globe
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { BusinessInsights } from '../components/BusinessInsights';

export const AnalyticsPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['businessStats'],
    queryFn: api.getBusinessStats
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: api.getAppointments
  });

  const kpis = useMemo(() => [
    { 
      label: 'Ingresos Mensuales', 
      value: `$${stats?.revenueThisMonth.toLocaleString() || '0'}`, 
      trend: '+14.2%', 
      isUp: true, 
      icon: DollarSign, 
      color: 'text-emerald-500' 
    },
    { 
      label: 'Citas Finalizadas', 
      value: stats?.appointmentsCompleted || '0', 
      trend: '+5.1%', 
      isUp: true, 
      icon: Calendar, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Nuevos Clientes', 
      value: stats?.newClientsThisMonth || '0', 
      trend: '-2.4%', 
      isUp: false, 
      icon: Users, 
      color: 'text-amber-500' 
    },
    { 
      label: 'Tasa de Ocupación', 
      value: `${stats?.occupationRate || '0'}%`, 
      trend: '+0.8%', 
      isUp: true, 
      icon: Activity, 
      color: 'text-[#D4AF37]' 
    },
  ], [stats]);

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
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Financial Metrics & Network Analytics</p>
        </div>
        <div className="flex gap-4">
           <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-3 border-white/5">
              <Globe size={18} className="text-[#D4AF37]" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Node Sync: Active</span>
           </div>
        </div>
      </div>

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
                 {[45, 78, 52, 91, 63, 84, 95].map((h, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                      <div className="w-full relative">
                        <div style={{ height: `${h}%` }} className="w-full bg-white/5 rounded-t-xl group-hover:bg-white/10 transition-all border-t border-x border-white/5" />
                        <div style={{ height: `${h * 0.7}%` }} className="absolute bottom-0 w-full bg-gradient-to-t from-[#D4AF37] to-[#F1C40F] rounded-t-xl shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
                      </div>
                      <span className="text-[9px] font-black text-slate-600 uppercase">Día {i+1}</span>
                   </div>
                 ))}
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
                 {[
                   { label: 'Cejas / Micro', value: 45, color: 'bg-[#D4AF37]' },
                   { label: 'Labios / Blush', value: 30, color: 'bg-blue-500' },
                   { label: 'Retoques', value: 15, color: 'bg-emerald-500' },
                   { label: 'Otros', value: 10, color: 'bg-white/10' }
                 ].map((item, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-400">{item.label}</span>
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
                 {[
                   { name: 'Aftercare Serum Pro', sales: 124, revenue: 3100 },
                   { name: 'Brow Gel Aurum', sales: 89, revenue: 1780 },
                   { name: 'Kit Cicatrización', sales: 65, revenue: 1950 }
                 ].map((prod, i) => (
                   <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-[11px] font-black text-white uppercase">{prod.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold">{prod.sales} Unidades vendidas</p>
                      </div>
                      <span className="text-xs font-black text-emerald-500">${prod.revenue}</span>
                   </div>
                 ))}
              </div>
              <button className="w-full mt-10 py-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-all">Ver Reporte Completo</button>
           </div>
        </div>
      </div>
    </div>
  );
};
