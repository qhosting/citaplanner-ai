
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldAlert, Globe, Activity, Zap, Building2, Users, 
  Search, Power, Database, Cpu, Server, ExternalLink,
  Loader2, TrendingUp, BarChart3, Lock, Unlock, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export const SuperAdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Estos endpoints deben ser implementados en server.js (ver abajo)
  const { data: globalStats } = useQuery({
    queryKey: ['saas-global-stats'],
    queryFn: async () => {
      const res = await fetch('/api/saas/stats');
      return res.json();
    }
  });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['saas-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/saas/tenants');
      return res.json();
    }
  });

  const toggleTenantStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/saas/tenants/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants'] });
      toast.success("Estado del nodo actualizado en la red global.");
    }
  });

  const filteredTenants = tenants.filter((t: any) => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <ShieldAlert size={32} />
             </div>
             <div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                    Nexus <span className="gold-text-gradient font-light italic">God Mode</span>
                </h1>
                <p className="text-red-500 font-bold uppercase tracking-[0.5em] text-[10px] mt-2">SaaS Infrastructure Master Authority</p>
             </div>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="glass-card px-8 py-4 rounded-2xl border-white/5 flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Global Health: Optimal</span>
           </div>
        </div>
      </div>

      {/* Infrastructure KPI's */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        {[
          { label: 'Ingresos Totales SaaS', value: `$${globalStats?.totalRevenue?.toLocaleString() || '0'}`, icon: Zap, color: 'text-[#D4AF37]' },
          { label: 'Nodos Activos', value: tenants.length, icon: Building2, color: 'text-blue-500' },
          { label: 'Usuarios Globales', value: globalStats?.totalUsers || '0', icon: Users, color: 'text-emerald-500' },
          { label: 'Uptime Sistema', value: '99.99%', icon: Activity, color: 'text-indigo-500' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-8 rounded-[3rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><s.icon size={48} /></div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{s.label}</p>
            <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Global Tenant Management */}
      <section className="space-y-10">
        <div className="glass-card p-4 rounded-[3.5rem] border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center bg-black/20">
            <div className="relative w-full md:w-[450px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
              <input 
                type="text" placeholder="Localizar nodo por nombre o subdominio..."
                className="w-full pl-16 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-red-500/30 transition-all font-medium"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
               <button className="bg-white/5 text-slate-400 px-8 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest border border-white/5 hover:text-white transition-all flex items-center gap-2">
                  <Database size={14} /> Backups Globales
               </button>
            </div>
        </div>

        <div className="glass-card rounded-[3.5rem] border-white/5 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                        <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Identidad del Nodo</th>
                        <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">DNS / Acceso</th>
                        <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Status Global</th>
                        <th className="px-10 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Autoridad Master</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredTenants.map((t: any) => (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-10 py-8">
                                <p className="font-black text-white text-lg uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">{t.name}</p>
                                <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">ID: {t.id.substring(0,8)}... • Plan: {t.plan_type}</p>
                            </td>
                            <td className="px-10 py-8">
                                <a href={`https://${t.subdomain}.citaplanner.com`} target="_blank" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                                    <Globe size={14} />
                                    <span className="text-xs font-mono font-bold tracking-tight">{t.subdomain}.citaplanner.com</span>
                                    <ExternalLink size={12} />
                                </a>
                            </td>
                            <td className="px-10 py-8 text-center">
                                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase border ${
                                    t.status === 'ACTIVE' 
                                    ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' 
                                    : 'border-red-500/30 text-red-500 bg-red-500/5'
                                }`}>
                                    {t.status}
                                </span>
                            </td>
                            <td className="px-10 py-8 text-right">
                                <div className="flex justify-end gap-3">
                                    {t.status === 'ACTIVE' ? (
                                        <button 
                                          onClick={() => toggleTenantStatus.mutate({ id: t.id, status: 'SUSPENDED' })}
                                          className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                          title="Suspender Nodo"
                                        >
                                            <Lock size={16} />
                                        </button>
                                    ) : (
                                        <button 
                                          onClick={() => toggleTenantStatus.mutate({ id: t.id, status: 'ACTIVE' })}
                                          className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                                          title="Reactivar Nodo"
                                        >
                                            <Unlock size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </section>

      {/* Global Server Health Matrix */}
      <section className="mt-20">
         <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4">
            <Server size={24} className="text-emerald-500" /> Infrastructure Matrix
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-10 rounded-[3.5rem] border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Procesadores de IA</p>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-white uppercase"><span>Gemini Core 3.0</span><span className="text-emerald-500">Online</span></div>
                    <div className="h-1 bg-white/5 rounded-full"><div className="h-full bg-emerald-500 w-[40%] shadow-[0_0_10px_#10b981]" /></div>
                </div>
            </div>
            <div className="glass-card p-10 rounded-[3.5rem] border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">DB Latency</p>
                <div className="flex items-end gap-3">
                    <span className="text-5xl font-black text-white tracking-tighter">14ms</span>
                    <span className="text-emerald-500 font-bold uppercase text-[10px] mb-3">Estable</span>
                </div>
            </div>
            <div className="glass-card p-10 rounded-[3.5rem] bg-red-500/5 border-red-500/10">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6">Alertas Críticas</p>
                <div className="flex items-center gap-4 text-white font-black text-xs uppercase">
                    <AlertTriangle size={20} className="text-red-500" />
                    <span>0 Nodos Caídos</span>
                </div>
            </div>
         </div>
      </section>
    </div>
  );
};
