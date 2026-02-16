
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, Globe, Activity, Zap, Building2, Users,
  Search, Power, Database, Cpu, Server, ExternalLink,
  Loader2, TrendingUp, BarChart3, Lock, Unlock, AlertTriangle, Plus,
  ShieldCheck, Wand2, ShoppingBag, Megaphone, Eye, ChevronRight, X,
  CreditCard, History, Terminal, HardDrive, RefreshCw,
  Trash2, Edit3, UserPlus, Save, Phone, Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Tenant, TenantFeatures } from '../types';

export const SuperAdminDashboard: React.FC = () => {
  const ROOT_DOMAIN = window.location.hostname.split('.').slice(-2).join('.');
  const queryClient = useQueryClient();
  const { user: godUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [view, setView] = useState<'NODES' | 'BILLING' | 'LOGS'>('NODES');

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [newTenant, setNewTenant] = useState({ name: '', subdomain: '', customDomain: '', planType: 'ELITE' });
  const [managingAdminsTenantId, setManagingAdminsTenantId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', role: '', password: '' });
  const [newAdmin, setNewAdmin] = useState({ name: '', phone: '', email: '', password: '', role: 'STUDIO_OWNER' });
  const [showNewAdminForm, setShowNewAdminForm] = useState(false);

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

  // 4. Fetch Real Audit Logs
  const { data: clusterLogs = [] } = useQuery({
    queryKey: ['saas-logs'],
    queryFn: async () => {
      const res = await fetch('/api/saas/logs', {
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      return res.json();
    },
    enabled: view === 'LOGS'
  });

  // 5. Deep Diagnostics Check
  const { data: healthCheck, refetch: runDiagnostic } = useQuery({
    queryKey: ['saas-health'],
    queryFn: async () => {
      const res = await fetch('/api/saas/health/deep', {
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      return res.json();
    },
    enabled: view === 'DIAGS'
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

  // FEATURE GATING MUTATION
  const updateFeaturesMutation = useMutation({
    mutationFn: async ({ id, features }: { id: string, features: any }) => {
      const res = await fetch(`/api/saas/tenants/${id}/features`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}`
        },
        body: JSON.stringify({ features })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants'] });
      toast.success("Permisos de infraestructura actualizados.");
    }
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/saas/tenants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants'] });
      toast.success("Nodo destruido permanentemente.");
    },
    onError: (e) => toast.error(`Falla en des-aprovisionamiento: ${e.message}`)
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de impersonación');
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem('citaPlannerUser', JSON.stringify({ ...data.user, token: data.token, isImpersonated: true }));
        window.location.href = '/admin';
        toast.success("Identidad inyectada. Entrando en modo soporte...");
      } else {
        toast.error("Falla en el bypass de identidad.");
      }
    },
    onError: (e) => toast.error(e.message)
  });

  // ADMIN MANAGEMENT
  const { data: tenantAdmins = [], refetch: refetchAdmins } = useQuery({
    queryKey: ['tenant-admins', managingAdminsTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/saas/tenants/${managingAdminsTenantId}/admins`, {
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      return res.json();
    },
    enabled: !!managingAdminsTenantId
  });

  const createAdminMutation = useMutation({
    mutationFn: async ({ tenantId, data }: { tenantId: string, data: any }) => {
      const res = await fetch(`/api/saas/tenants/${tenantId}/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      refetchAdmins();
      setShowNewAdminForm(false);
      setNewAdmin({ name: '', phone: '', email: '', password: '', role: 'STUDIO_OWNER' });
      toast.success('Administrador creado con éxito.');
    },
    onError: (e) => toast.error(e.message)
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ tenantId, userId, data }: { tenantId: string, userId: string, data: any }) => {
      const res = await fetch(`/api/saas/tenants/${tenantId}/admins/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      refetchAdmins();
      setEditingUserId(null);
      toast.success('Administrador actualizado.');
    }
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async ({ tenantId, userId }: { tenantId: string, userId: string }) => {
      const res = await fetch(`/api/saas/tenants/${tenantId}/admins/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      return res.json();
    },
    onSuccess: () => {
      refetchAdmins();
      toast.success('Administrador eliminado.');
    }
  });

  const filteredTenants = tenants.filter((t: any) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBillingLogs = selectedTenantId
    ? billingLogs.filter((log: any) => log.tenantId === selectedTenantId)
    : billingLogs;

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
            { id: 'LOGS', label: 'Cluster Logs', icon: Terminal },
            { id: 'DIAGS', label: 'Diagnostics', icon: Zap }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => {
                setView(btn.id as any);
                if (btn.id !== 'BILLING') setSelectedTenantId(null);
              }}
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
          { label: 'Cloud Latency', value: stats?.systemHealth?.latency || '--', icon: Cpu, color: 'text-red-500', sub: 'DC Performance' },
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
        {view === 'DIAGS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="glass-card p-12 rounded-[4rem] border-white/5">
              <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-4 text-[#D4AF37]">
                <CreditCard size={28} /> Openpay Infrastructure
              </h2>
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endpoint Status</p>
                  <div className="flex justify-between items-center text-emerald-500 font-bold">
                    <span>API Production</span>
                    <span className="flex items-center gap-2 animate-pulse"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Verified</span>
                  </div>
                </div>
                <button
                  onClick={() => toast.promise(fetch('/api/saas/openpay/plans', {
                    headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
                  }).then(r => r.json()), {
                    loading: 'Fetching Openpay Plans...',
                    success: (data) => `Found ${data.length || 0} plans in Openpay`,
                    error: 'Openpay sync error'
                  })}
                  className="w-full py-4 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
                >
                  Sync Operation Plans
                </button>
              </div>
            </div>

            <div className="glass-card p-12 rounded-[4rem] border-white/5">
              <h2 className="text-2xl font-black uppercase mb-8 flex items-center gap-4 text-red-500">
                <Database size={28} /> Database Integrity
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Engine Connectivity', status: healthCheck?.database?.connected ? 'HEALHY' : 'CHECKING...' },
                  { label: 'DB Latency (Disk)', status: healthCheck?.database?.latency || 'Verifying...' },
                  { label: 'Active Node Count', status: healthCheck?.database?.tenants || '--' },
                  { label: 'Cluster Engine', status: healthCheck?.engine?.version || 'NEXUS CORE' }
                ].map((idx, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border-b border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{idx.label}</span>
                    <span className="text-[10px] font-black text-white">{idx.status}</span>
                  </div>
                ))}
                <button
                  onClick={() => runDiagnostic()}
                  className="w-full mt-4 py-4 bg-white/5 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                >
                  Run Deep Diagnostic
                </button>
              </div>
            </div>
          </div>
        )}
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
                        onClick={() => {
                          setManagingAdminsTenantId(managingAdminsTenantId === t.id ? null : t.id);
                          setShowNewAdminForm(false);
                          setEditingUserId(null);
                        }}
                        className={`w-14 h-14 rounded-2xl transition-all border flex items-center justify-center shadow-xl ${managingAdminsTenantId === t.id ? 'bg-blue-500 text-white border-blue-500/30' : 'bg-white/5 text-blue-400 border-white/5 hover:bg-blue-500/20'}`}
                        title="Administrar Usuarios"
                      >
                        <Users size={24} />
                      </button>
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
                      {t.subdomain !== 'master' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`⚠️ ADVERTENCIA CRÍTICA: ¿Destruir permanentemente el nodo ${t.name}? Esta acción es irreversible.`)) {
                              deleteTenantMutation.mutate(t.id);
                            }
                          }}
                          className="w-14 h-14 bg-red-600/10 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-600/20 flex items-center justify-center shadow-xl"
                          title="Purge Node (Destruction)"
                        >
                          <X size={24} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 🔧 FEATURE GATING PANEL (LIVE) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {[
                      { id: 'ai_scheduler', label: 'Nexus AI', icon: Wand2 },
                      { id: 'marketing_pro', label: 'E-Marketing', icon: Megaphone },
                      { id: 'inventory_advanced', label: 'Inventory X', icon: ShoppingBag },
                      { id: 'analytics_nexus', label: 'Global BI', icon: BarChart3 },
                    ].map(feat => (
                      <button
                        key={feat.id}
                        onClick={() => {
                          const updated = { ...t.features, [feat.id]: !t.features[feat.id as keyof TenantFeatures] };
                          updateFeaturesMutation.mutate({ id: t.id, features: updated });
                        }}
                        className={`flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all active:scale-95 ${t.features[feat.id as keyof TenantFeatures] ? 'bg-[#D4AF37]/5 border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-black/40 border-white/5 text-slate-800'}`}
                      >
                        <feat.icon size={22} className={t.features[feat.id as keyof TenantFeatures] ? 'animate-pulse' : ''} />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{feat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* 👥 ADMIN MANAGEMENT PANEL */}
                  {managingAdminsTenantId === t.id && (
                    <div className="mb-8 p-8 bg-black/40 rounded-3xl border border-blue-500/20">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                          <Users size={16} /> Administradores del Nodo
                        </h4>
                        <button
                          onClick={() => { setShowNewAdminForm(!showNewAdminForm); setEditingUserId(null); }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all"
                        >
                          <UserPlus size={14} /> Nuevo Admin
                        </button>
                      </div>

                      {/* Existing Users */}
                      <div className="space-y-3 mb-6">
                        {tenantAdmins.length === 0 && (
                          <p className="text-slate-600 text-[10px] font-bold uppercase text-center py-6">Sin usuarios en este nodo.</p>
                        )}
                        {tenantAdmins.map((u: any) => (
                          <div key={u.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                            {editingUserId === u.id ? (
                              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                                <input className="p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs" placeholder="Nombre" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                <input className="p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs" placeholder="Teléfono" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                <input className="p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs" placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                <select className="p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                                  <option value="STUDIO_OWNER">STUDIO_OWNER</option>
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="GOD_MODE">GOD_MODE</option>
                                </select>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 flex-1">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Users size={16} /></div>
                                <div>
                                  <p className="text-white text-xs font-bold">{u.name}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-slate-500 text-[9px] flex items-center gap-1"><Phone size={10} /> {u.phone}</span>
                                    {u.email && <span className="text-slate-500 text-[9px] flex items-center gap-1"><Mail size={10} /> {u.email}</span>}
                                  </div>
                                </div>
                                <span className="ml-auto mr-4 px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase text-slate-400 border border-white/10">{u.role}</span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              {editingUserId === u.id ? (
                                <button onClick={() => updateAdminMutation.mutate({ tenantId: t.id, userId: u.id, data: editForm })} className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all" title="Guardar">
                                  <Save size={14} />
                                </button>
                              ) : (
                                <button onClick={() => { setEditingUserId(u.id); setEditForm({ name: u.name || '', phone: u.phone || '', email: u.email || '', role: u.role || '', password: '' }); }} className="p-2 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 transition-all" title="Editar">
                                  <Edit3 size={14} />
                                </button>
                              )}
                              <button onClick={() => { if (window.confirm(`¿Eliminar a ${u.name}?`)) deleteAdminMutation.mutate({ tenantId: t.id, userId: u.id }); }} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Eliminar">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* New Admin Form */}
                      {showNewAdminForm && (
                        <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                          <h5 className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-4">Crear Nuevo Administrador</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <input className="p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-700" placeholder="Nombre completo" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} />
                            <input className="p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-700" placeholder="Teléfono" value={newAdmin.phone} onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })} />
                            <input className="p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-700" placeholder="Email (opcional)" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
                            <input type="password" className="p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-700" placeholder="Contraseña" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                            <select className="p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs" value={newAdmin.role} onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}>
                              <option value="STUDIO_OWNER">STUDIO_OWNER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </div>
                          <button
                            onClick={() => createAdminMutation.mutate({ tenantId: t.id, data: newAdmin })}
                            disabled={!newAdmin.name || !newAdmin.phone || !newAdmin.password}
                            className="w-full py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all disabled:opacity-30"
                          >
                            {createAdminMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Crear Administrador'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

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
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Suscripción</p>
                        <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">{t.planType} TIER</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTenantId(t.id);
                        setView('BILLING');
                      }}
                      className="flex items-center gap-3 bg-white/5 hover:bg-[#D4AF37] px-8 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-black transition-all border border-white/5"
                    >
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
              <div className="flex items-center gap-8">
                <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                  <CreditCard size={32} className="text-[#D4AF37]" /> Global Revenue Master
                </h2>
                {selectedTenantId && (
                  <div className="px-6 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center gap-4">
                    <span className="text-[10px] font-black text-[#D4AF37] uppercase">Filtrando Nodo: {tenants.find((t: any) => t.id === selectedTenantId)?.name}</span>
                    <button onClick={() => setSelectedTenantId(null)} className="text-[#D4AF37] hover:text-white"><X size={14} /></button>
                  </div>
                )}
              </div>
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
                  {filteredBillingLogs.map((log: any) => (
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
                  {filteredBillingLogs.length === 0 && (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">Sin transacciones registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'LOGS' && (
          <div className="bg-black/40 rounded-[3rem] border border-white/5 p-12 font-mono text-sm">
            <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
              <Terminal size={24} className="text-[#D4AF37]" />
              <h2 className="text-white font-black uppercase text-xl leading-none">Global Infrastructure Audit Trail</h2>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-custom">
              {clusterLogs.length > 0 ? clusterLogs.map((log: any) => (
                <div key={log.id} className="flex gap-6 border-b border-white/[0.03] pb-3 text-xs">
                  <span className="shrink-0 text-[#D4AF37] opacity-60">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-emerald-500 font-black uppercase">[{log.platform || 'CORE'}] {log.eventType}</span>
                    <span className="text-slate-500 text-[10px]">{log.response?.slice(0, 100) || 'Evento de sistema procesado.'}</span>
                  </div>
                </div>
              )) : (
                <p className="text-slate-700 uppercase font-black text-[10px] text-center py-20">No system events recorded in current cluster.</p>
              )}
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
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Propriedad de Marca / Custom Domain (Opcional)</p>
                  <input
                    type="text" placeholder="Ej: shulastudio.com"
                    className="w-full p-6 bg-white/5 border border-white/5 rounded-3xl text-white font-mono font-bold text-xl outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-slate-800"
                    value={newTenant.customDomain} onChange={e => setNewTenant({ ...newTenant, customDomain: e.target.value.toLowerCase() })}
                  />
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
