
import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Globe, Zap, Building2, Loader2, 
  ShieldCheck, Database, Key, BellRing, Sparkles, X, Check, Power, Eye, EyeOff, Terminal, Link as LinkIcon, RefreshCw, Server, ShieldAlert, Activity, Wifi
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LandingSettings, BridgeSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'BRIDGE' | 'SECURITY'>('GENERAL');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const [landingSettings, setLandingSettings] = useState<LandingSettings | null>(null);
  const [integrationLogs, setIntegrationLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const landing = await api.getLandingSettings();
      setLandingSettings(landing);
      
      const logsRes = await fetch('/api/integrations/status', {
          headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
      });
      if (logsRes.ok) setIntegrationLogs(await logsRes.json());
    } catch (e) {
      toast.error("Falla en sincronización de consola.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBridge = async (updated: Partial<BridgeSettings>) => {
    if (!landingSettings || !landingSettings.bridge) return;
    const newBridge = { ...landingSettings.bridge, ...updated };
    
    try {
        const res = await fetch('/api/settings/bridge', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}`
            },
            body: JSON.stringify(newBridge)
        });
        if (res.ok) {
            setLandingSettings({ ...landingSettings, bridge: newBridge });
            toast.success("Protocolo Bridge actualizado.");
        }
    } catch (e) { toast.error("Error de enlace."); }
  };

  const testHandshake = async () => {
    setTesting(true);
    try {
        const res = await fetch('/api/settings/bridge/test', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
        });
        const data = await res.json();
        if (data.success) {
            toast.success(data.message, { icon: <Wifi className="text-emerald-500" /> });
            loadData(); // Recargar logs
        } else {
            toast.error("Handshake Fallido: Aurum Holding Offline");
        }
    } catch (e) { toast.error("Falla crítica de red."); }
    finally { setTesting(false); }
  };

  const rotateBridgeKey = async () => {
    if (!window.confirm("¿Rotar Llave Maestra? Las auditorías externas perderán el acceso inmediatamente.")) return;
    try {
        const res = await fetch('/api/settings/bridge/rotate-key', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('citaPlannerUser') || '{}').token}` }
        });
        const data = await res.json();
        if (data.success && landingSettings?.bridge) {
            setLandingSettings({ ...landingSettings, bridge: { ...landingSettings.bridge, apiKey: data.key } });
            toast.success("Nueva Llave Maestra generada.");
        }
    } catch (e) { toast.error("Error en rotación."); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Console <span className="gold-text-gradient font-light">Master</span></h1>
          </div>
          <p className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Governance & Connectivity Hub</p>
        </div>
      </div>

      <div className="glass-card rounded-[3.5rem] border-white/5 overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        <div className="w-full md:w-80 bg-black/40 border-r border-white/5 p-8 space-y-3">
          {[
            { id: 'GENERAL', label: 'General', icon: Globe },
            { id: 'BRIDGE', label: 'Aurum Bridge', icon: Server },
            { id: 'SECURITY', label: 'Seguridad', icon: Key },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-12 overflow-y-auto bg-black/20 custom-scrollbar">
          
          {activeTab === 'BRIDGE' && landingSettings && (
            <div className="space-y-12 animate-entrance">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Aurum Bridge <span className="gold-text-gradient italic">Protocol</span></h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Enlace Operativo con Centro de Control Aurum</p>
                  </div>
                  <div className="flex gap-4">
                     <button 
                        disabled={testing || !landingSettings.bridge?.enabled}
                        onClick={testHandshake}
                        className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 disabled:opacity-30"
                     >
                        {testing ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />} Test Handshake
                     </button>
                  </div>
               </div>

               <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-10">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="p-4 bg-[#D4AF37]/10 text-[#D4AF37] rounded-3xl border border-[#D4AF37]/20"><Power size={32} /></div>
                        <div>
                           <h4 className="text-xl font-black text-white uppercase tracking-tight">Estado del Enlace Operativo</h4>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Activa el envío de Ventas y Alertas de Stock</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => handleUpdateBridge({ enabled: !landingSettings.bridge?.enabled })}
                        className={`w-16 h-8 rounded-full transition-all relative ${landingSettings.bridge?.enabled ? 'bg-[#D4AF37]' : 'bg-zinc-800'}`}
                     >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${landingSettings.bridge?.enabled ? 'left-9' : 'left-1'}`} />
                     </button>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <div>
                           <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block ml-2">URL de Ingesta (Aurum Holding)</label>
                           <div className="relative">
                              <Terminal className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                              <input 
                                 type="text" 
                                 placeholder="https://holding.aurum.mx/api/v1/ingest"
                                 value={landingSettings.bridge?.webhookUrl || ''}
                                 onChange={(e) => setLandingSettings({...landingSettings, bridge: { ...landingSettings.bridge!, webhookUrl: e.target.value }})}
                                 onBlur={() => handleUpdateBridge({ webhookUrl: landingSettings.bridge?.webhookUrl })}
                                 className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/5 rounded-[2rem] text-white font-mono text-sm outline-none focus:border-[#D4AF37] transition-all"
                              />
                           </div>
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block ml-2">Satellite Node ID (Holding ID)</label>
                           <input 
                              type="number" 
                              value={landingSettings.bridge?.satelliteId || 3}
                              onChange={(e) => handleUpdateBridge({ satelliteId: parseInt(e.target.value) })}
                              className="w-full p-5 bg-black/40 border border-white/5 rounded-[1.5rem] text-white font-bold outline-none focus:border-[#D4AF37]"
                           />
                        </div>
                     </div>

                     <div className="glass-card p-8 rounded-[2.5rem] border-[#D4AF37]/10 bg-gradient-to-tr from-black to-zinc-900/50">
                        <div className="flex justify-between items-center mb-6">
                           <h5 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-3"><Key size={16} /> Llave Maestra de Auditoría</h5>
                           <button onClick={() => setShowKey(!showKey)} className="text-zinc-600 hover:text-white transition-colors">{showKey ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                        </div>
                        <div className="flex gap-4 items-center">
                           <div className="flex-1 bg-black/60 p-4 rounded-xl border border-white/5 font-mono text-xs text-white truncate select-all">
                              {showKey ? landingSettings.bridge?.apiKey : '••••••••-••••-••••-••••-••••••••••••'}
                           </div>
                           <button onClick={rotateBridgeKey} className="p-4 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded-xl text-zinc-500 transition-all" title="Rotar Llave"><RefreshCw size={18}/></button>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-3 text-[9px] text-zinc-600 font-bold uppercase">
                              <ShieldCheck className="text-emerald-500" size={14} /> Protocolo AES-256
                           </div>
                           <span className="text-[8px] text-zinc-700 font-mono">HASH: AUM-SEC-BR-7</span>
                        </div>
                     </div>
                  </div>
               </div>

               <section>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-8 flex items-center gap-3">
                     <Activity size={18} className="text-[#D4AF37]" /> Monitor de Sincronización
                  </h4>
                  <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5">
                     <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/5">
                           <tr>
                              <th className="px-8 py-4 text-[9px] font-black text-zinc-500 uppercase">Evento</th>
                              <th className="px-8 py-4 text-[9px] font-black text-zinc-500 uppercase">Status</th>
                              <th className="px-8 py-4 text-[9px] font-black text-zinc-500 uppercase">Respuesta Holding</th>
                              <th className="px-8 py-4 text-[9px] font-black text-zinc-500 uppercase text-right">Timestamp</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {integrationLogs.length === 0 ? (
                              <tr><td colSpan={4} className="px-8 py-12 text-center text-zinc-600 text-[10px] font-black uppercase">Esperando actividad de red...</td></tr>
                           ) : (
                              integrationLogs.map((log, i) => (
                                 <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-5">
                                       <span className="text-[10px] font-bold text-white uppercase tracking-tight">{log.event_type}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                       <span className={`px-3 py-1 rounded-full text-[8px] font-black border ${log.status === 'SUCCESS' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/30 text-rose-500 bg-rose-500/5'}`}>
                                          {log.status}
                                       </span>
                                    </td>
                                    <td className="px-8 py-5">
                                       <p className="text-[10px] text-zinc-500 italic truncate max-w-[200px]">{log.response}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                       <span className="text-[10px] text-zinc-600 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </section>
            </div>
          )}

          {activeTab === 'GENERAL' && landingSettings && (
             <div className="space-y-12 animate-entrance">
                <section>
                   <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8">Información del Nodo</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Nombre del Negocio</label>
                         <input type="text" value={landingSettings.businessName} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl text-white font-bold" disabled />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Subdominio de Red</label>
                         <input type="text" value={landingSettings.subdomain} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl text-[#D4AF37] font-mono font-bold" disabled />
                      </div>
                   </div>
                </section>
                
                <section className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-8 rounded-[3rem] flex items-center gap-6">
                   <div className="p-4 bg-[#D4AF37] text-black rounded-2xl shadow-2xl"><Globe size={24} /></div>
                   <div>
                      <h4 className="text-white font-black uppercase text-sm mb-1">Sincronización Hub Maestro</h4>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Su identidad de negocio está vinculada al Ecosistema Global de Aurum Capital.</p>
                   </div>
                </section>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
