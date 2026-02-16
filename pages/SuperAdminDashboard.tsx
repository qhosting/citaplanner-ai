
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, Globe, Activity, Zap, Building2, Users,
  Search, Power, Database, Cpu, Server, ExternalLink,
  Loader2, TrendingUp, BarChart3, Lock, Unlock, AlertTriangle, Plus,
  ShieldCheck, Wand2, ShoppingBag, Megaphone, Eye, ChevronRight, X,
  CreditCard, History, Terminal, HardDrive, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Tenant, TenantFeatures } from '../types';

export const SuperAdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: godUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [view, setView] = useState<'NODES' | 'BILLING' | 'LOGS'>('NODES');

  const [newTenant, setNewTenant] = useState({ name: '', subdomain: '', planType: 'ELITE' });

  // 1. Fetch Global Stats
  const { data: stats } = useQuery({
    queryKey: ['saas-stats'],
    queryFn: async () => {
      const res = await fetch('/api/saas/stats', {
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      return res.json();
    }
  });

  // 2. Fetch Tenants
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['saas-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/saas/tenants', {
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  // 3. Fetch Billing Logs
  const { data: billingLogs = [] } = useQuery({
    queryKey: ['billing-logs'],
    queryFn: async () => {
      const res = await fetch('/api/saas/billing/logs', {
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
      toast.success("Nodo maestro aprovisionado con éxito.");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await fetch(`/api/saas/tenants/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}`
        },
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants'] });
      toast.success("Estado de nodo actualizado.");
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
        toast.success("Identidad inyectada. Entrando en modo soporte...");
      } else {
        toast.error("Falla en el bypass de identidad.");
      }
    }
  });

  const filteredTenants = tenants.filter((t: any) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 animate-entrance font-sans">
      {/* 🛡️ NEXUS COMMAND HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="p-4 rounded-[2rem] bg-red-600/10 text-red-500 border border-red-500/20 shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-pulse">
              <ShieldAlert size={40} />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#050505] flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
              Nexus <span className="gold-text-gradient font-light italic">Infrastructure</span>
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-red-500 font-bold uppercase tracking-[0.4em] text-[10px]">God Mode Authority (ROOT)</span>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Latency: {stats?.systemHealth?.latency || '--'}</span>
            </div>
          </div>
        </div>

        <nav className="flex bg-white/5 p-2 rounded-2xl border border-white/5">
          {[
            { id: 'NODES', label: 'Nodes', icon: Server },
            { id: 'BILLING', label: 'Master Billing', icon: CreditCard },
            { id: 'LOGS', label: 'Audit Logs', icon: Terminal }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setView(btn.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === btn.id ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'text-slate-500 hover:text-white'}`}
            >
              <btn.icon size={16} /> {btn.label}
            </button>
          ))}
        </nav>
      </header>

      {/* 📊 GLOBAL COMMAND METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        {[
          { label: 'Ingresos MRR Est.', value: `$${stats?.mrr || 0}`, icon: TrendingUp, color: 'text-emerald-500', sub: 'Revenue Global' },
          { label: 'Nodos Activos', value: stats?.activeSubscriptions || 0, icon: Globe, color: 'text-blue-500', sub: `de ${stats?.totalTenants || 0} totales` },
          { label: 'Uptime Global', value: stats?.systemHealth?.uptime || '99.9%', icon: Activity, color: 'text-[#D4AF37]', sub: 'SLA Status' },
          { label: 'CPU Cluster', value: '18%', icon: Cpu, color: 'text-red-500', sub: 'Balanced Load' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-10 rounded-[3.5rem] border-white/5 relative overflow-hidden group hover:border-red-500/20 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all text-white"><s.icon size={64} /></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${s.color.replace('text-', 'bg-')}`} /> {s.label}
            </p>
            <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-tight">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 🖥️ MAIN VIEW AREA */}
      <main className="space-y-12">
        {view === 'NODES' && (
          <>
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
              <div className="relative w-full md:w-[600px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
                <input
                  type="text" placeholder="Filtro de búsqueda avanzada (Empresa, Subdominio, Estatus)..."
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl text-white outline-none focus:border-red-500/30 transition-all font-medium placeholder:text-slate-700"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="gold-btn text-black h-[60px] px-10 rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
              >
                <Plus size={20} /> Provisionar Nuevo Nodo
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {filteredTenants.map((t: Tenant) => (
                <div key={t.id} className="glass-card p-12 rounded-[5rem] border-white/5 hover:border-red-500/20 transition-all relative overflow-hidden group bg-gradient-to-br from-white/[0.02] to-transparent">
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-start gap-6">
                      <div className={`p-5 rounded-3xl ${t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} border border-current/20`}>
                        <Building2 size={32} />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                          {t.name}
                          {t.status === 'SUSPENDED' && <Lock className="text-red-500" size={24} />}
                        </h3>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-[11px] font-mono text-slate-500 font-bold">{t.subdomain}.{ROOT_DOMAIN}</span>
                          <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 border ${t.planType === 'ELITE' ? 'border-[#D4AF37]/30 text-[#D4AF37]' : 'border-slate-800 text-slate-600'}`}>
                            {t.planType}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => impersonateMutation.mutate(t.id)}
                        className="w-14 h-14 bg-white/5 text-[#D4AF37] rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all border border-white/5 flex items-center justify-center shadow-xl"
                        title="Master Impersonation (Soporte)"
                      >
                        {impersonateMutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <Eye size={24} />}
                      </button>
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: t.id, status: t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                        className={`w-14 h-14 rounded-2xl transition-all border border-white/5 flex items-center justify-center shadow-xl ${t.status === 'ACTIVE' ? 'bg-white/5 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-500 text-white'}`}
                      >
                        {t.status === 'ACTIVE' ? <Power size={24} /> : <RefreshCw size={24} />}
                      </button>
                    </div>
                  </div>

                  {/* 🔧 FEATURE GATING MINI PANEL */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {[
                      { id: 'ai_scheduler', label: 'Nexus AI', icon: Wand2 },
                      { id: 'marketing_pro', label: 'E-Marketing', icon: Megaphone },
                      { id: 'inventory_advanced', label: 'Inventory X', icon: ShoppingBag },
                      { id: 'analytics_nexus', label: 'Global BI', icon: BarChart3 },
                    ].map(feat => (
                      <div
                        key={feat.id}
                        className={`flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all ${t.features[feat.id as keyof TenantFeatures] ? 'bg-white/5 border-[#D4AF37]/20 text-[#D4AF37]' : 'bg-black/40 border-white/5 text-slate-800'}`}
                      >
                        <feat.icon size={22} className={t.features[feat.id as keyof TenantFeatures] ? 'animate-pulse' : ''} />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{feat.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Estatus Cuenta</p>
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-600'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${t.status === 'ACTIVE' ? 'text-emerald-500' : 'text-red-600'}`}>{t.status}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Vencimiento</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">En suscripción</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all border border-white/5">
                      <History size={14} /> Facturación & Pagos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'BILLING' && (
          <div className="glass-card rounded-[4rem] border-white/5 overflow-hidden p-12">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                <CreditCard size={32} className="text-[#D4AF37]" /> Global Revenue Master
              </h2>
              <div className="flex gap-4">
                <div className="bg-white/5 border border-white/5 px-6 py-3 rounded-xl">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Procesado</p>
                  <p className="text-xl font-black text-emerald-500">${stats?.totalRevenue || 0} MXN</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto text-left">
              <table className="w-full">
                <thead className="border-b border-white/5">
                  <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <th className="pb-6 pl-4">Transacción</th>
                    <th className="pb-6">Estudio</th>
                    <th className="pb-6">Monto</th>
                    <th className="pb-6">Pasarela</th>
                    <th className="pb-6 text-right pr-4">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {billingLogs.map((log: any) => (
                    <tr key={log.id} className="group hover:bg-white/[0.01] transition-all">
                      <td className="py-6 pl-4">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{log.id.slice(0, 8)}...</span>
                      </td>
                      <td className="py-6">
                        <div className="font-bold text-white text-[12px] uppercase">{log.tenant?.name || 'Sistema'}</div>
                      </td>
                      <td className="py-6">
                        <span className={`font-black text-[12px] ${log.status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}`}>
                          ${log.amount} {log.currency}
                        </span>
                      </td>
                      <td className="py-6">
                        <span className="text-[9px] font-black bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400">
                          {log.provider}
                        </span>
                      </td>
                      <td className="py-6 text-right pr-4 text-slate-500 text-[10px] font-bold">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {billingLogs.length === 0 && (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">Sin transacciones recientes</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'LOGS' && (
          <div className="bg-black/40 rounded-[3rem] border border-white/5 p-12 font-mono text-sm">
            <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
              <Terminal size={24} className="text-emerald-500" />
              <h2 className="text-white font-black uppercase text-xl leading-none">Cluster Global Event Stream</h2>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-custom">
              {/* Simulate some system logs if needed */}
              <div className="flex gap-6 text-emerald-500/80">
                <span className="shrink-0 opacity-50">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span>
                <span className="text-white font-bold">[SYS] Cluster Nexus v5.1 is stable.</span>
              </div>
              <div className="flex gap-6 text-emerald-500/80">
                <span className="shrink-0 opacity-50">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span>
                <span>[AUTH] Master SuperAdmin authenticated successfully.</span>
              </div>
              {tenants.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex gap-6 text-blue-400/80">
                  <span className="shrink-0 opacity-50">[{new Date(t.createdAt).toLocaleTimeString()}]</span>
                  <span>[NODO] Aprovisionamiento detectado: <span className="text-white font-bold">{t.subdomain}</span> (Status: {t.status})</span>
                </div>
              ))}
              <div className="flex gap-6 text-emerald-300">
                <span className="shrink-0 opacity-50">[{new Date().toLocaleTimeString()}]</span>
                <span>[LOG] Real-time session monitoring active in room [global_master]</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 🏗️ CREATION MODAL REDESIGN */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[1000] flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#080808] rounded-[5rem] border border-red-500/20 shadow-[0_0_100px_rgba(220,38,38,0.15)] overflow-hidden animate-scale-in">
            <div className="p-12 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-red-600/5 to-transparent">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-red-600/10 rounded-3xl text-red-500">
                  <Server size={32} />
                </div>
                <div>
                  <h3 className="font-black text-3xl text-white uppercase tracking-tighter">
                    Aprovisionamiento de <span className="gold-text-gradient">Nodo Maestro</span>
                  </h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Despliegue de infraestructura instanciada v5.1</p>
                </div>
              </div>
              <button onClick={() => setIsCreating(false)} className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-all"><X size={32} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-12 border-r border-white/5 space-y-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Identidad Corporativa</p>
                  <input
                    type="text" placeholder="Ej: Shula Studio Global"
                    className="w-full p-6 bg-white/5 border border-white/5 rounded-3xl text-white font-black text-xl placeholder:text-slate-800 focus:border-[#D4AF37]/40 outline-none transition-all"
                    value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Dirección de Red / Subdominio</p>
                  <div className="relative group">
                    <input
                      type="text" placeholder="identificador-red"
                      className="w-full p-6 bg-white/5 border border-white/5 rounded-3xl text-[#D4AF37] font-mono font-bold text-xl outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-slate-800"
                      value={newTenant.subdomain} onChange={e => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 font-mono font-black">.{ROOT_DOMAIN}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Tier de Infraestructura</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['ELITE', 'LEGACY', 'BASIC', 'PRO'].map(plan => (
                      <button
                        key={plan}
                        onClick={() => setNewTenant({ ...newTenant, planType: plan })}
                        className={`p-6 rounded-3xl border text-[10px] font-black uppercase tracking-widest transition-all ${newTenant.planType === plan ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-12 bg-white/[0.01] flex flex-col justify-between">
                <div className="space-y-8">
                  <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-6">Review de Operación</h4>
                  <ul className="space-y-6">
                    {[
                      { label: 'Aislamiento de DB', icon: Database, text: 'Instancia lógica dedicada' },
                      { label: 'Red de Distribución', icon: Globe, text: `Global via ${newTenant.subdomain || '...'}` },
                      { label: 'God Mode Bypass', icon: ShieldCheck, text: 'Soporte maestro habilitado' },
                    ].map((item, i) => (
                      <li key={i} className="flex gap-5">
                        <div className="p-3 bg-white/5 rounded-xl text-slate-400"><item.icon size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-tight">{item.label}</p>
                          <p className="text-[9px] font-bold text-slate-600 uppercase">{item.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => createTenantMutation.mutate(newTenant)}
                  disabled={createTenantMutation.isPending || !newTenant.name || !newTenant.subdomain}
                  className="w-full gold-btn py-6 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(212,175,55,0.2)] disabled:opacity-20 animate-pulse-slow"
                >
                  {createTenantMutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />} Autorizar Despliegue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
