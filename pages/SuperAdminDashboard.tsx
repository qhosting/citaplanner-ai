
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldAlert, Globe, Activity, Zap, Building2, Users, 
  Search, Power, Database, Cpu, Server, ExternalLink,
  Loader2, TrendingUp, BarChart3, Lock, Unlock, AlertTriangle, Plus,
  ShieldCheck, Wand2, ShoppingBag, Megaphone, Eye, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Tenant, TenantFeatures } from '../types';

export const SuperAdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { login } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const [newTenant, setNewTenant] = useState({ name: '', subdomain: '', planType: 'ELITE' });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['saas-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/saas/tenants', {
          headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      return res.json();
    }
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/saas/tenants', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants'] });
      setIsCreating(false);
      toast.success("Nodo maestro aprovisionado.");
    }
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, features }: { id: string, features: TenantFeatures }) => {
      await fetch(`/api/saas/tenants/${id}/features`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}`
        },
        body: JSON.stringify({ features })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants'] });
      toast.success("Protocolos de gating actualizados.");
    }
  });

  const impersonateMutation = useMutation({
    mutationFn: async (tenantId: string) => {
        const res = await fetch(`/api/saas/tenants/${tenantId}/impersonate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
        });
        return res.json();
    },
    onSuccess: (data) => {
        if (data.success) {
            localStorage.setItem('citaPlannerUser', JSON.stringify({ ...data.user, token: data.token, isImpersonated: true }));
            window.location.href = '/admin';
            toast.success("Identidad inyectada con éxito.");
        } else {
            toast.error("Falla en la inyección de identidad.");
        }
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
           <button 
             onClick={() => setIsCreating(true)}
             className="gold-btn text-black px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
           >
              <Plus size={18} /> Activar Nuevo Cliente
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        {[
          { label: 'Ecosistema SaaS', value: tenants.length, icon: Building2, color: 'text-blue-500' },
          { label: 'Uptime Sistema', value: '99.99%', icon: Activity, color: 'text-emerald-500' },
          { label: 'DB Latency', value: '12ms', icon: Server, color: 'text-[#D4AF37]' },
          { label: 'Nivel Autoridad', value: 'ROOT', icon: ShieldCheck, color: 'text-red-500' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-8 rounded-[3rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><s.icon size={48} /></div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{s.label}</p>
            <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredTenants.map((t: Tenant) => (
                <div key={t.id} className="glass-card p-10 rounded-[4rem] border-white/5 hover:border-[#D4AF37]/20 transition-all relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">{t.name}</h3>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{t.subdomain}.citaplanner.com</span>
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${t.planType === 'ELITE' ? 'border-[#D4AF37]/30 text-[#D4AF37]' : 'border-slate-700 text-slate-500'}`}>{t.planType}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                              onClick={() => impersonateMutation.mutate(t.id)}
                              className="p-4 bg-white/5 text-[#D4AF37] rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all border border-white/5"
                              title="Inyectar Identidad (Soporte)"
                            >
                                {impersonateMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        {[
                            { id: 'ai_scheduler', label: 'IA Scheduler', icon: Wand2 },
                            { id: 'marketing_pro', label: 'Marketing', icon: Megaphone },
                            { id: 'inventory_advanced', label: 'Inventario', icon: ShoppingBag },
                            { id: 'analytics_nexus', label: 'Analytics', icon: BarChart3 },
                        ].map(feat => (
                            <button 
                                key={feat.id}
                                onClick={() => {
                                    const newFeats = { ...t.features, [feat.id]: !t.features[feat.id as keyof TenantFeatures] };
                                    toggleFeatureMutation.mutate({ id: t.id, features: newFeats });
                                }}
                                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${t.features[feat.id as keyof TenantFeatures] ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-black/40 border-white/5 text-slate-600'}`}
                            >
                                <feat.icon size={20} />
                                <span className="text-[8px] font-black uppercase tracking-widest">{feat.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.status}</span>
                        </div>
                        <button className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center gap-2 hover:text-white transition-colors">
                            Gestionar Suscripción <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* MODAL CREACIÓN */}
      {isCreating && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[500] flex items-center justify-center p-6">
              <div className="glass-card w-full max-w-xl rounded-[4rem] border-red-500/20 overflow-hidden animate-scale-in">
                  <div className="p-10 border-b border-white/5 bg-white/5 flex justify-between items-center">
                      <h3 className="font-black text-xl text-white uppercase tracking-tighter flex items-center gap-4">
                          <Building2 size={24} className="text-[#D4AF37]"/> Aprovisionar Nodo
                      </h3>
                      <button onClick={() => setIsCreating(false)} className="p-2 text-slate-500 hover:text-white"><X size={24}/></button>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); createTenantMutation.mutate(newTenant); }} className="p-10 space-y-8">
                      <div className="space-y-6">
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Nombre Comercial (Ej: Shula Studio)</label>
                            <input required type="text" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-white font-bold" value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Subdominio de Acceso</label>
                            <div className="relative">
                                <input required type="text" className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-[#D4AF37] font-mono font-bold" value={newTenant.subdomain} onChange={e => setNewTenant({...newTenant, subdomain: e.target.value.toLowerCase().replace(/\s/g, '')})} />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700 font-mono">.citaplanner.com</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Plan de Operación</label>
                            <select className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none appearance-none" value={newTenant.planType} onChange={e => setNewTenant({...newTenant, planType: e.target.value})}>
                                <option value="TRIAL">TRIAL (15 Días)</option>
                                <option value="ELITE">ELITE (Suscripción Estándar)</option>
                                <option value="LEGACY">LEGACY (Socio Fundador)</option>
                            </select>
                        </div>
                      </div>
                      <button disabled={createTenantMutation.isPending} className="gold-btn w-full py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4">
                          {createTenantMutation.isPending ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18}/>} Confirmar y Activar
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
