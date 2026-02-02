
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Globe, UserCheck, Activity, Search, Server } from 'lucide-react';
import { toast } from 'sonner';

export const SuperAdminPage: React.FC = () => {
  const [key, setKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authenticate (Simple Key Check for Demo)
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === 'godmode123') { // Hardcoded for demo simplicity
      setIsAuthenticated(true);
      toast.success("God Mode Activated");
    } else {
      toast.error("Access Denied");
    }
  };

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'tenants'],
    queryFn: async () => {
      const res = await fetch('/api/superadmin/tenants', {
        headers: { 'x-superadmin-key': process.env.SUPERADMIN_KEY || 'godmode123' } // Frontend mock env
      });
      return res.json();
    },
    enabled: isAuthenticated
  });

  const handleMasquerade = async (tenantId: string) => {
    // In a real app, this would get a token and redirect
    toast.success(`Simulating login as owner of ${tenantId}...`);
    // Logic to set token would go here
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass-card p-10 rounded-3xl w-full max-w-md border-red-900/30 border">
          <div className="text-center mb-8">
            <ShieldAlert size={48} className="text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-white uppercase tracking-widest">Restricted Area</h1>
            <p className="text-red-500 text-xs font-bold uppercase mt-2">Classified Clearance Required</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              placeholder="Enter God Key"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-center tracking-[0.5em] font-mono focus:border-red-600 focus:outline-none"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <button type="submit" className="w-full bg-red-900/50 text-red-200 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-900 hover:text-white transition-all">
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 animate-entrance">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              <Server className="text-red-600" /> Master Console
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs mt-2">Aurum Infrastructure Control</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/5 flex items-center gap-3">
                <Activity size={16} className="text-green-500" />
                <span className="text-xs font-black text-white uppercase">System Status: Nominal</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Stats Overview */}
           <div className="glass-card p-8 rounded-3xl border-white/5 lg:col-span-3 flex gap-8">
              <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5">
                 <p className="text-slate-500 text-xs font-bold uppercase mb-2">Active Tenants</p>
                 <p className="text-4xl font-black text-white">{tenants.length || 0}</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5">
                 <p className="text-slate-500 text-xs font-bold uppercase mb-2">Total MRR (Est)</p>
                 <p className="text-4xl font-black text-white">$0.00</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5">
                 <p className="text-slate-500 text-xs font-bold uppercase mb-2">Global Users</p>
                 <p className="text-4xl font-black text-white">-</p>
              </div>
           </div>

           {/* Tenants List */}
           <div className="glass-card p-8 rounded-3xl border-white/5 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-white uppercase tracking-widest">Active Tenants</h2>
                 <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input placeholder="Search Tenant..." className="bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/30" />
                 </div>
              </div>

              <div className="space-y-3">
                 {tenants.map((tenant: any) => (
                   <div key={tenant.organization_id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                      <div>
                         <p className="font-black text-white uppercase tracking-wider">{tenant.organization_id}</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{tenant.branches_count} Branch(es) • PRO Plan</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white" title="DNS Settings">
                            <Globe size={16} />
                         </button>
                         <button
                           onClick={() => handleMasquerade(tenant.organization_id)}
                           className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white"
                           title="Masquerade (Log in as)"
                         >
                            <UserCheck size={16} />
                         </button>
                      </div>
                   </div>
                 ))}
                 {tenants.length === 0 && <p className="text-slate-600 text-center py-8 italic">No tenants found.</p>}
              </div>
           </div>

           {/* Actions */}
           <div className="space-y-6">
              <div className="glass-card p-8 rounded-3xl border-white/5">
                 <h2 className="text-lg font-black text-white uppercase tracking-widest mb-4">Quick Actions</h2>
                 <button className="w-full py-4 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 mb-3">
                    <Globe size={14} /> Provision New DNS
                 </button>
                 <button className="w-full py-4 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Activity size={14} /> System Diagnostics
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
