
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
  const [view, setView] = useState<'NODES' | 'BILLING' | 'LOGS' | 'DIAGS' | 'PLANS'>('NODES');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [newTenant, setNewTenant] = useState({ name: '', subdomain: '', customDomain: '', planType: 'ELITE' });
  const [managingAdminsTenantId, setManagingAdminsTenantId] = useState<string | null>(null);
  const [manageSubsTenantId, setManageSubsTenantId] = useState<string | null>(null);
  const [subForm, setSubForm] = useState({ planId: '', status: '', trialDays: '' });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', role: '', password: '' });
  const [newAdmin, setNewAdmin] = useState({ name: '', phone: '', email: '', password: '', role: 'STUDIO_OWNER' });
  const [showNewAdminForm, setShowNewAdminForm] = useState(false);

  // New Plan State
  const [planForm, setPlanForm] = useState({ id: '', title: '', price: 0, description: '', currency: 'MXN' });

  const [logFilter, setLogFilter] = useState({ platform: '', organizationId: '', level: '' });

  // Real-time Clock
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch Global Stats
  const { data: stats } = useQuery({
    queryKey: ['saas-stats'],
    queryFn: async () => {
      const res = await fetch('/api/saas/stats', {
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      return res.json();
    },
    refetchInterval: 10000 // Real-time metrics every 10s
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

  // Fetch Plans
  const { data: plans = [], refetch: refetchPlans } = useQuery({
    queryKey: ['saas-plans'],
    queryFn: async () => {
      const res = await fetch('/api/saas/plans', {
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      return res.json();
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

  // 4. Fetch Real Audit Logs with Filtering
  const { data: clusterLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['saas-logs', logFilter],
    queryFn: async () => {
      const query = new URLSearchParams(logFilter as any).toString();
      const res = await fetch(`/api/saas/logs?${query}`, {
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

  const updateSubMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/saas/tenants/${manageSubsTenantId}/subscription`, {
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
      queryClient.invalidateQueries({ queryKey: ['saas-tenants'] });
      setManageSubsTenantId(null);
      toast.success("Suscripción actualizada.");
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/saas/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => { refetchPlans(); setIsPlanModalOpen(false); toast.success("Plan creado."); }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/saas/plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
    },
    onSuccess: () => { refetchPlans(); toast.success("Plan eliminado."); }
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
        // BACKUP ORIGINAL AUTH BEFORE INJECTING NEW ONE
        const originalAuth = localStorage.getItem('citaPlannerUser');
        if (originalAuth) {
          localStorage.setItem('citaPlannerOriginalAuth', originalAuth);
        }

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
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 animate-entrance font-sans relative overflow-hidden">
      {/* 🕸️ CYBER GRID BACKGROUND */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(212,175,55,0.1),_transparent_70%)] pointer-events-none" />

      {/* 🛡️ NEXUS COMMAND HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8 relative z-10">
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
              <span className="text-slate-400 font-mono text-[10px] uppercase font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">{now.toLocaleTimeString()}</span>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Uptime: {stats?.systemHealth?.uptime || '--'}</span>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-emerald-500 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                <Cpu size={10} /> {stats?.systemHealth?.memoryUsage || '--'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex bg-white/5 p-2 rounded-2xl border border-white/5">
          {[
            { id: 'NODES', label: 'Nodes', icon: Server },
            { id: 'PLANS', label: 'Plan Manager', icon: ShoppingBag },
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
                      <div className={`p-5 rounded-3xl ${t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} border border-current/20 relative`}>
                        <Building2 size={32} />
                        {(t as any).lastLoginAt && (new Date().getTime() - new Date((t as any).lastLoginAt).getTime() < 3600000) && (
                           <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050505] animate-pulse shadow-[0_0_10px_#10b981]" />
                        )}
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
                          {(t as any).lastLoginAt && (
                            <>
                              <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                              <span className="text-[9px] font-bold text-slate-600 uppercase">Last: {new Date((t as any).lastLoginAt).toLocaleTimeString()}</span>
                            </>
                          )}
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
                              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                                <input className="p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs" placeholder="Nombre" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                <input className="p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs" placeholder="Teléfono" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                <input className="p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs" placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                <input type="password" className="p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs" placeholder="Nueva Contraseña (opcional)" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} />
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
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSubForm({ planId: t.planType, status: t.status, trialDays: '' });
                          setManageSubsTenantId(t.id);
                        }}
                        className="flex items-center gap-3 bg-white/5 hover:bg-emerald-500 px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all border border-white/5"
                      >
                        <Zap size={14} /> Plan & Status
                      </button>
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
          <div className="bg-black/40 rounded-[3rem] border border-white/5 p-12 font-mono text-sm relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-white/5 gap-6">
              <div className="flex items-center gap-3">
                <Terminal size={24} className="text-[#D4AF37]" />
                <h2 className="text-white font-black uppercase text-xl leading-none">Global Infrastructure Audit Trail</h2>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select 
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none focus:border-[#D4AF37]/40"
                  value={logFilter.platform}
                  onChange={(e) => setLogFilter({ ...logFilter, platform: e.target.value })}
                >
                  <option value="">Todas las Plataformas</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                  <option value="OPENPAY">Openpay</option>
                  <option value="CORE">Nexus Core</option>
                </select>

                <select 
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-400 outline-none focus:border-[#D4AF37]/40"
                  value={logFilter.organizationId}
                  onChange={(e) => setLogFilter({ ...logFilter, organizationId: e.target.value })}
                >
                  <option value="">Todos los Nodos</option>
                  {tenants.map((t: any) => (
                    <option key={t.id} value={t.subdomain}>{t.name}</option>
                  ))}
                </select>

                <button 
                  onClick={() => setLogFilter({ platform: '', organizationId: '', level: '' })}
                  className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                >
                  Reset
                </button>
              </div>
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
        {view === 'PLANS' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Gestión de Planes SaaS</h2>
              <button
                onClick={() => { setPlanForm({ id: '', title: '', price: 0, description: '', currency: 'MXN' }); setIsPlanModalOpen(true); }}
                className="gold-btn px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-3"
              >
                <Plus size={16} /> Crear Nuevo Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p: any) => (
                <div key={p.id} className="glass-card p-8 rounded-[3rem] border-white/5 relative group hover:border-[#D4AF37]/30 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl">
                      <ShoppingBag size={24} />
                    </div>
                    <button onClick={() => { if (window.confirm('¿Eliminar plan?')) deletePlanMutation.mutate(p.id); }} className="text-red-500 hover:text-white"><X size={20} /></button>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase mb-2">{p.title}</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">{p.description}</p>
                  <div className="flex items-end gap-2 mb-6">
                    <span className="text-4xl font-black text-[#D4AF37]">${p.price}</span>
                    <span className="text-[10px] font-bold text-slate-600 mb-2 uppercase">{p.currency} / MES</span>
                  </div>
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Features Key</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(p.features || {}).map(([k, v]) => v && (
                        <span key={k} className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-bold text-slate-400 uppercase">{k.replace('_', ' ')}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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

      {/* 📦 CREATE PLAN MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[1000] flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-[#080808] rounded-[4rem] border border-[#D4AF37]/20 shadow-[0_0_80px_rgba(212,175,55,0.1)] overflow-hidden animate-scale-in">
            <div className="p-10 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-[#D4AF37]/10 rounded-2xl text-[#D4AF37]"><ShoppingBag size={28} /></div>
                <div>
                  <h3 className="font-black text-2xl text-white uppercase tracking-tighter">Nuevo Plan SaaS</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Definir estructura de precios</p>
                </div>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan ID (Único)</p>
                  <input className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white font-mono font-bold text-sm outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-slate-800 uppercase" placeholder="STARTER" value={planForm.id} onChange={e => setPlanForm({ ...planForm, id: e.target.value.toUpperCase().replace(/\s/g, '_') })} />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Precio (MXN/mes)</p>
                  <input type="number" className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-[#D4AF37] font-black text-sm outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-slate-800" placeholder="299" value={planForm.price || ''} onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título Comercial</p>
                <input className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white font-bold text-sm outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-slate-800" placeholder="Ej: Starter (Freelance)" value={planForm.title} onChange={e => setPlanForm({ ...planForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción</p>
                <input className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white text-sm outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-slate-800" placeholder="Ideal para independientes" value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} />
              </div>

              <button
                onClick={() => createPlanMutation.mutate({ ...planForm, features: { ai_scheduler: true, marketing_pro: false, inventory_advanced: false, analytics_nexus: false } })}
                disabled={!planForm.id || !planForm.title || !planForm.price || createPlanMutation.isPending}
                className="w-full gold-btn py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(212,175,55,0.2)] disabled:opacity-20 transition-all"
              >
                {createPlanMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />} Crear Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ SUBSCRIPTION MANAGEMENT MODAL */}
      {manageSubsTenantId && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[1000] flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-[#080808] rounded-[4rem] border border-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.1)] overflow-hidden animate-scale-in">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-600/5 to-transparent">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500"><Zap size={28} /></div>
                <div>
                  <h3 className="font-black text-2xl text-white uppercase tracking-tighter">
                    Gestionar Suscripción
                  </h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {tenants.find((t: any) => t.id === manageSubsTenantId)?.name || 'Nodo'}
                  </p>
                </div>
              </div>
              <button onClick={() => setManageSubsTenantId(null)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 space-y-8">
              {/* Plan Assignment */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asignar Plan</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {plans.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => setSubForm({ ...subForm, planId: p.id })}
                      className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${subForm.planId === p.id ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                    >
                      <span className="block">{p.title}</span>
                      <span className="block mt-1 text-[9px] opacity-70">${p.price}/mes</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Override */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Override de Estado</p>
                <div className="grid grid-cols-3 gap-3">
                  {['ACTIVE', 'TRIAL', 'SUSPENDED'].map(st => (
                    <button
                      key={st}
                      onClick={() => setSubForm({ ...subForm, status: st })}
                      className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${subForm.status === st
                        ? st === 'ACTIVE' ? 'bg-emerald-500 text-white border-emerald-500'
                          : st === 'TRIAL' ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-red-500 text-white border-red-500'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                    >
                      {st === 'ACTIVE' && <Unlock size={14} className="inline mr-2" />}
                      {st === 'TRIAL' && <Activity size={14} className="inline mr-2" />}
                      {st === 'SUSPENDED' && <Lock size={14} className="inline mr-2" />}
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trial Days */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Días de Prueba (Trial)</p>
                <div className="flex gap-3">
                  {[7, 14, 30, 60, 90].map(d => (
                    <button
                      key={d}
                      onClick={() => setSubForm({ ...subForm, trialDays: String(d), status: 'TRIAL' })}
                      className={`px-5 py-3 rounded-xl border text-[10px] font-black transition-all ${subForm.trialDays === String(d) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                    >
                      {d}d
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom"
                    className="w-24 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-xs font-bold outline-none focus:border-blue-500/40 placeholder:text-slate-700"
                    value={subForm.trialDays}
                    onChange={e => setSubForm({ ...subForm, trialDays: e.target.value, status: 'TRIAL' })}
                  />
                </div>
                <p className="text-[9px] text-slate-600 font-bold">
                  Asignar días de prueba activa el estado TRIAL automáticamente y permite acceso completo sin pago.
                </p>
              </div>

              {/* Summary */}
              <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resumen de Cambios</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  {subForm.planId && <span className="text-[10px] font-bold text-[#D4AF37]">📦 Plan: {subForm.planId}</span>}
                  {subForm.status && <span className="text-[10px] font-bold text-emerald-500">⚡ Status: {subForm.status}</span>}
                  {subForm.trialDays && <span className="text-[10px] font-bold text-blue-400">📅 Trial: {subForm.trialDays} días</span>}
                </div>
              </div>

              <button
                onClick={() => {
                  const payload: any = {};
                  if (subForm.planId) payload.planId = subForm.planId;
                  if (subForm.status) payload.status = subForm.status;
                  if (subForm.trialDays) payload.trialDays = parseInt(subForm.trialDays);
                  updateSubMutation.mutate(payload);
                }}
                disabled={updateSubMutation.isPending || (!subForm.planId && !subForm.status && !subForm.trialDays)}
                className="w-full py-5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-20 flex items-center justify-center gap-3"
              >
                {updateSubMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Aplicar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
      )}
    </div>
  );
};
