import React, { useState, useEffect } from 'react';
import {
   Settings, Save, Globe, Zap, Building2, Loader2,
   ShieldCheck, Database, Key, BellRing, Sparkles, X, Check, Power, Eye, EyeOff, Terminal, Link as LinkIcon, RefreshCw, Server, ShieldAlert, Activity, Wifi, MapPin,
   Calendar, Copy, ExternalLink, Send, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LandingSettings, BridgeSettings } from '../types';

export const SettingsPage: React.FC = () => {
   const [activeTab, setActiveTab] = useState<'GENERAL' | 'BRIDGE' | 'SECURITY' | 'BILLING' | 'INTEGRATIONS'>('GENERAL');
   const [loading, setLoading] = useState(true);
   const [testing, setTesting] = useState(false);
   const [showKey, setShowKey] = useState(false);

   const [landingSettings, setLandingSettings] = useState<LandingSettings | null>(null);
   const [integrationLogs, setIntegrationLogs] = useState<any[]>([]);
   const [masterIcalToken, setMasterIcalToken] = useState<string>('');
   const [generatingToken, setGeneratingToken] = useState(false);
   const [wahaStatus, setWahaStatus] = useState<any>(null);
   const [testPhone, setTestPhone] = useState('');
   const [testingWaha, setTestingWaha] = useState(false);

   // WhatsApp Flows States
   const [integrationSubTab, setIntegrationSubTab] = useState<'CHANNELS' | 'FLOWS'>('CHANNELS');
   const [flowsEnabled, setFlowsEnabled] = useState(false);
   const [flowId, setFlowId] = useState('');
   const [privateKey, setPrivateKey] = useState('');
   const [publicKey, setPublicKey] = useState('');
   const [generatingKeys, setGeneratingKeys] = useState(false);
   const [savingFlows, setSavingFlows] = useState(false);
   const [showPrivateKey, setShowPrivateKey] = useState(false);

   // WhatsApp Flows Simulator States
   const [simScreen, setSimScreen] = useState<'SELECT_BRANCH' | 'SELECT_SERVICE' | 'SELECT_PROFESSIONAL' | 'SELECT_DATE_TIME' | 'CONFIRM_BOOKING' | 'SUCCESS_SCREEN'>('SELECT_BRANCH');
   const [simBranchId, setSimBranchId] = useState('');
   const [simServiceId, setSimServiceId] = useState('');
   const [simProfessionalId, setSimProfessionalId] = useState('');
   const [simDate, setSimDate] = useState('');
   const [simTimeSlot, setSimTimeSlot] = useState('');
   const [simClientName, setSimClientName] = useState('');
   const [simClientPhone, setSimClientPhone] = useState('');
   const [simLoading, setSimLoading] = useState(false);
   const [simBranches, setSimBranches] = useState<any[]>([]);
   const [simServices, setSimServices] = useState<any[]>([]);
   const [simProfessionals, setSimProfessionals] = useState<any[]>([]);
   const [simTimeSlots, setSimTimeSlots] = useState<any[]>([]);
   const [simSuccessMessage, setSimSuccessMessage] = useState('');

   useEffect(() => {
      loadData();
   }, []);

   const handleTestWaha = async () => {
      if (!testPhone) return toast.error("Ingresa un número para la prueba");
      setTestingWaha(true);
      try {
         const res = await api.testWahaMessage(testPhone);
         if (res.success) {
            toast.success("Mensaje de diagnóstico enviado!");
         } else {
            toast.error(res.error || "Falla en el envío");
         }
      } catch (e) {
         toast.error("Error en comunicación con el nodo");
      } finally {
         setTestingWaha(false);
      }
   };

   const handleSaveFlowsSettings = async () => {
      setSavingFlows(true);
      try {
         const res = await api.updateWhatsappFlowsSettings({
            enabled: flowsEnabled,
            flowId,
            privateKey,
            publicKey
         });
         if (res.success) {
            toast.success("Configuración de WhatsApp Flows guardada.");
         } else {
            toast.error("Error al guardar la configuración.");
         }
      } catch (e) {
         toast.error("Error al conectar con el servidor.");
      } finally {
         setSavingFlows(false);
      }
   };

   const handleGenerateFlowsKeys = async () => {
      if (privateKey && !window.confirm("¿Reemplazar llaves existentes? Esto invalidará la clave pública anterior en el portal de Meta.")) return;
      setGeneratingKeys(true);
      try {
         const res = await api.generateWhatsappFlowsKeys();
         if (res.success && res.privateKey && res.publicKey) {
            setPrivateKey(res.privateKey);
            setPublicKey(res.publicKey);
            toast.success("Nuevas llaves RSA generadas. No olvides guardar los cambios.");
         } else {
            toast.error("Error al generar las llaves.");
         }
      } catch (e) {
         toast.error("Falla de red en generación.");
      } finally {
         setGeneratingKeys(false);
      }
   };

   const handleStartSimulator = async () => {
      setSimBranchId('');
      setSimServiceId('');
      setSimProfessionalId('');
      setSimDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]); // Tomorrow
      setSimTimeSlot('');
      setSimClientName('');
      setSimClientPhone('');
      setSimScreen('SELECT_BRANCH');
      setSimSuccessMessage('');
      
      setSimLoading(true);
      try {
         const response = await fetch('/api/webhooks/whatsapp-flows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               decrypted_body_test: {
                  action: 'data_exchange',
                  screen: 'SELECT_BRANCH',
                  flow_token: 'SimToken',
                  data: {}
               }
            })
         });
         const data = await response.json();
         if (data.success && data.payload) {
            setSimBranches(data.payload.data.branches || []);
            setSimScreen('SELECT_BRANCH');
         }
      } catch (e) {
         toast.error("Error al iniciar simulador.");
      } finally {
         setSimLoading(false);
      }
   };

   const handleSimulatorAction = async (nextScreen: string, customPayload: any = {}) => {
      setSimLoading(true);
      try {
         const response = await fetch('/api/webhooks/whatsapp-flows', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({
               decrypted_body_test: {
                  action: nextScreen === 'SUCCESS_SCREEN' ? 'complete' : 'data_exchange',
                  screen: simScreen,
                  flow_token: 'SimulatorMasterToken',
                  data: {
                     branch_id: simBranchId,
                     service_id: simServiceId,
                     professional_id: simProfessionalId,
                     date: simDate,
                     time_slot: simTimeSlot,
                     client_name: simClientName,
                     client_phone: simClientPhone,
                     ...customPayload
                  }
               }
            })
         });
         const data = await response.json();
         if (data.success && data.payload) {
            const payload = data.payload;
            if (payload.screen === 'SELECT_BRANCH') {
               setSimBranches(payload.data.branches || []);
               setSimScreen('SELECT_BRANCH');
            } else if (payload.screen === 'SELECT_SERVICE') {
               setSimServices(payload.data.services || []);
               setSimScreen('SELECT_SERVICE');
            } else if (payload.screen === 'SELECT_PROFESSIONAL') {
               setSimProfessionals(payload.data.professionals || []);
               setSimScreen('SELECT_PROFESSIONAL');
            } else if (payload.screen === 'SELECT_DATE_TIME') {
               setSimTimeSlots(payload.data.time_slots || []);
               setSimScreen('SELECT_DATE_TIME');
               if (payload.data.date) setSimDate(payload.data.date);
            } else if (payload.screen === 'CONFIRM_BOOKING') {
               setSimScreen('CONFIRM_BOOKING');
            } else if (payload.screen === 'SUCCESS_SCREEN') {
               setSimSuccessMessage(payload.data.message || 'Cita reservada con éxito.');
               setSimScreen('SUCCESS_SCREEN');
               toast.success("¡Cita reservada en vivo desde el simulador!");
            }
         } else {
            toast.error("Error al procesar flujo dinámico en el servidor");
         }
      } catch (e) {
         toast.error("Error de conexión con el webhook");
      } finally {
         setSimLoading(false);
      }
   };

   const loadData = async () => {
      setLoading(true);
      try {
         const landing = await api.getLandingSettings();
         setLandingSettings(landing);

         const logs = await api.getIntegrationLogs();
         setIntegrationLogs(logs);

         const { icalToken } = await api.getTenantCalendarLink();
         setMasterIcalToken(icalToken);

         const wStatus = await api.getWahaStatus();
         setWahaStatus(wStatus);

         const flowsRes = await api.getWhatsappFlowsSettings();
         if (flowsRes.success && flowsRes.settings) {
            setFlowsEnabled(flowsRes.settings.enabled || false);
            setFlowId(flowsRes.settings.flowId || '');
            setPrivateKey(flowsRes.settings.privateKey || '');
            setPublicKey(flowsRes.settings.publicKey || '');
         }
      } catch (e) {
         toast.error("Falla en sincronización de consola.");
      } finally {
         setLoading(false);
      }
   };

   const handleActivateMasterIcal = async () => {
      setGeneratingToken(true);
      try {
         const { icalToken } = await api.getTenantCalendarLink();
         setMasterIcalToken(icalToken);
         toast.success("Calendario Maestro Activado");
      } catch (e) {
         toast.error("Error al activar feed maestro");
      } finally {
         setGeneratingToken(false);
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
                  { id: 'INTEGRATIONS', label: 'Integraciones', icon: LinkIcon },
                  { id: 'BILLING', label: 'Facturación', icon: Zap },
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
                                       onChange={(e) => setLandingSettings({ ...landingSettings, bridge: { ...landingSettings.bridge!, webhookUrl: e.target.value } })}
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
                                 <button onClick={() => setShowKey(!showKey)} className="text-zinc-600 hover:text-white transition-colors">{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                              </div>
                              <div className="flex gap-4 items-center">
                                 <div className="flex-1 bg-black/60 p-4 rounded-xl border border-white/5 font-mono text-xs text-white truncate select-all">
                                    {showKey ? landingSettings.bridge?.apiKey : '••••••••-••••-••••-••••-••••••••••••'}
                                 </div>
                                 <button onClick={rotateBridgeKey} className="p-4 bg-white/5 hover:bg-[#D4AF37] hover:text-black rounded-xl text-zinc-500 transition-all" title="Rotar Llave"><RefreshCw size={18} /></button>
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

               {activeTab === 'INTEGRATIONS' && (
                  <div className="space-y-12 animate-entrance">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-8 gap-6">
                        <div>
                           <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Nexus <span className="gold-text-gradient italic">Integrations</span></h3>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Gestión de Enlaces y Protocolos de Comunicación</p>
                        </div>
                        <div className="flex bg-black/60 p-2 rounded-2xl border border-white/5 shrink-0">
                           <button onClick={() => setIntegrationSubTab('CHANNELS')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${integrationSubTab === 'CHANNELS' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/10' : 'text-zinc-500 hover:text-white'}`}>Canales de Salida</button>
                           <button onClick={() => { setIntegrationSubTab('FLOWS'); handleStartSimulator(); }} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${integrationSubTab === 'FLOWS' ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/10' : 'text-zinc-500 hover:text-white'}`}>WhatsApp Flows (Meta)</button>
                        </div>
                     </div>

                     {integrationSubTab === 'CHANNELS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-entrance">
                           <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-black/40 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                 <Wifi size={120} />
                              </div>
                              <div className="flex items-center gap-6 mb-10">
                                 <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-3xl border border-emerald-500/20">
                                    <LinkIcon size={32} />
                                 </div>
                                 <div>
                                    <h4 className="text-xl font-black text-white uppercase tracking-tight">WhatsApp Node (WAHA)</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Motor de Mensajería y OTPs</p>
                                 </div>
                              </div>

                              <div className="space-y-6">
                                 <div className="flex justify-between items-center p-6 bg-black/40 rounded-2xl border border-white/5">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sesión Activa</span>
                                    <span className="text-sm font-mono font-black text-white">{wahaStatus?.sessionName || '---'}</span>
                                 </div>
                                 <div className="flex justify-between items-center p-6 bg-black/40 rounded-2xl border border-white/5">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Estado del Nodo</span>
                                    <div className="flex items-center gap-3">
                                       <div className={`w-2 h-2 rounded-full ${wahaStatus?.status === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : 'bg-rose-500 shadow-[0_0_10px_#F43F5E]'}`} />
                                       <span className={`text-[10px] font-black uppercase tracking-widest ${wahaStatus?.status === 'CONNECTED' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                          {wahaStatus?.status || 'OFFLINE'}
                                       </span>
                                    </div>
                                 </div>
                                 {wahaStatus?.details && (
                                    <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                       <p className="text-[9px] text-emerald-500/70 font-bold uppercase leading-relaxed">
                                          El nodo está operando correctamente bajo la sesión maestra. Todos los triggers de agenda están vinculados.
                                       </p>
                                    </div>
                                 )}
                                 <button 
                                    onClick={loadData}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                                 >
                                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar Estado
                                 </button>

                                 <div className="pt-6 border-t border-white/5 space-y-4">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Prueba de Envío (Diagnóstico)</p>
                                    <div className="flex gap-3">
                                       <input 
                                          type="text" 
                                          placeholder="521..." 
                                          value={testPhone}
                                          onChange={e => setTestPhone(e.target.value)}
                                          className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50"
                                       />
                                       <button 
                                          onClick={handleTestWaha}
                                          disabled={testingWaha}
                                          className="bg-emerald-500 text-black px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                                       >
                                          {testingWaha ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Probar
                                       </button>
                                    </div>
                                    <p className="text-[8px] text-zinc-600 font-bold uppercase leading-relaxed">
                                       Asegúrate de incluir código de país (ej. 521 para México).
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-black/40 opacity-40 grayscale pointer-events-none">
                              <div className="flex items-center gap-6 mb-10">
                                 <div className="p-4 bg-zinc-800 text-zinc-500 rounded-3xl">
                                    <Building2 size={32} />
                                 </div>
                                 <div>
                                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Email SMTP (Direct)</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Próximamente</p>
                                 </div>
                              </div>
                              <p className="text-[10px] text-zinc-600 font-bold uppercase leading-relaxed">
                                 La integración nativa de SMTP permitirá el envío de newsletters y recibos digitales sin dependencias externas.
                              </p>
                           </div>
                        </div>
                     )}

                     {integrationSubTab === 'FLOWS' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start animate-entrance">
                           <div className="lg:col-span-2 space-y-8">
                              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-8">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                       <div className="p-4 bg-[#D4AF37]/10 text-[#D4AF37] rounded-3xl border border-[#D4AF37]/20"><Power size={24} /></div>
                                       <div>
                                          <h4 className="text-lg font-black text-white uppercase tracking-tight">Estado de WhatsApp Flows</h4>
                                          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Activa formularios interactivos nativos en WhatsApp</p>
                                       </div>
                                    </div>
                                    <button onClick={() => setFlowsEnabled(!flowsEnabled)} className={`w-16 h-8 rounded-full transition-all relative ${flowsEnabled ? 'bg-[#D4AF37]' : 'bg-zinc-800'}`}>
                                       <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${flowsEnabled ? 'left-9' : 'left-1'}`} />
                                    </button>
                                 </div>

                                 <div className="h-px bg-white/5" />

                                 <div className="space-y-6">
                                    <div>
                                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 block ml-2">Meta Flow ID</label>
                                       <input type="text" placeholder="Ingresa el ID del Flow provisto por Facebook" value={flowId} onChange={e => setFlowId(e.target.value)} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs focus:border-[#D4AF37] outline-none" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                       <div className="space-y-3">
                                          <div className="flex justify-between items-center px-2">
                                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Clave Privada RSA (PEM)</label>
                                             <button onClick={() => setShowPrivateKey(!showPrivateKey)} className="text-zinc-500 hover:text-white transition-colors">{showPrivateKey ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                          </div>
                                          <textarea rows={6} readOnly={generatingKeys} value={privateKey} onChange={e => setPrivateKey(e.target.value)} placeholder="-----BEGIN PRIVATE KEY-----..." className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-mono text-[9px] focus:border-[#D4AF37] outline-none resize-none" style={{WebkitTextSecurity: showPrivateKey ? 'none' : 'disc'} as any} />
                                       </div>
                                       <div className="space-y-3">
                                          <div className="flex justify-between items-center px-2">
                                             <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Clave Pública RSA (PEM)</label>
                                             <button onClick={() => { navigator.clipboard.writeText(publicKey); toast.success("Clave Pública copiada."); }} className="text-[#D4AF37] hover:underline text-[9px] font-black uppercase tracking-widest">Copiar PEM</button>
                                          </div>
                                          <textarea rows={6} readOnly value={publicKey} placeholder="-----BEGIN PUBLIC KEY-----..." className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-zinc-500 font-mono text-[9px] outline-none resize-none" />
                                       </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4">
                                       <button onClick={handleGenerateFlowsKeys} disabled={generatingKeys} className="bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                          {generatingKeys ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Generar Par de Llaves RSA
                                       </button>
                                       <button onClick={handleSaveFlowsSettings} disabled={savingFlows} className="bg-[#D4AF37] hover:scale-[1.02] text-black px-10 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/10">
                                          {savingFlows ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar Configuración
                                       </button>
                                    </div>
                                 </div>
                              </div>

                              <div className="bg-black/40 p-10 rounded-[3rem] border border-white/5 space-y-6">
                                 <div>
                                    <h4 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest mb-1 flex items-center gap-2"><Globe size={16} /> Configuración de Meta Webhook</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Pasos para registrar en Meta App Dashboard</p>
                                 </div>
                                 <div className="space-y-4 text-xs text-zinc-400 font-semibold leading-relaxed">
                                    <div className="flex gap-4 items-start">
                                       <div className="w-6 h-6 rounded-full bg-white/5 text-white flex items-center justify-center shrink-0 font-bold">1</div>
                                       <p className="pt-0.5">Establece la **URL de Endpoint** en: <code className="text-white font-mono text-[10px] bg-black px-2 py-1 rounded select-all">{window.location.origin}/api/webhooks/whatsapp-flows</code></p>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                       <div className="w-6 h-6 rounded-full bg-white/5 text-white flex items-center justify-center shrink-0 font-bold">2</div>
                                       <p className="pt-0.5">Usa el **Verify Token**: <code className="text-[#D4AF37] font-mono text-[10px] bg-black px-2 py-1 rounded">citaplanner_flow_token</code></p>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                       <div className="w-6 h-6 rounded-full bg-white/5 text-white flex items-center justify-center shrink-0 font-bold">3</div>
                                       <p className="pt-0.5">Copia la **Clave Pública RSA PEM** y pégala en los ajustes de encriptación del Flow en Meta.</p>
                                    </div>
                                 </div>
                              </div>

                              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 space-y-6">
                                 <div className="flex justify-between items-center">
                                    <div>
                                       <h4 className="text-sm font-black text-white uppercase tracking-widest">WhatsApp Flow JSON Schema</h4>
                                       <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Copia y pega este JSON en el editor oficial de Meta</p>
                                    </div>
                                    <button onClick={() => {
                                       const json = `{
  "version": "2.1",
  "screens": [
    {
      "id": "SELECT_BRANCH",
      "title": "Sucursal",
      "terminal": false,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Agenda tu Cita"
          },
          {
            "type": "Dropdown",
            "label": "Sucursal",
            "name": "branch_id",
            "required": true,
            "data-source": "branches"
          },
          {
            "type": "Footer",
            "label": "Ver Servicios",
            "on-click-action": {
              "name": "data_exchange",
              "payload": {
                "branch_id": "\\\${form.branch_id}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "SELECT_SERVICE",
      "title": "Servicio",
      "terminal": false,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Elige tu Servicio"
          },
          {
            "type": "Dropdown",
            "label": "Servicio",
            "name": "service_id",
            "required": true,
            "data-source": "services"
          },
          {
            "type": "Footer",
            "label": "Ver Especialistas",
            "on-click-action": {
              "name": "data_exchange",
              "payload": {
                "branch_id": "\\\${data.branch_id}",
                "service_id": "\\\${form.service_id}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "SELECT_PROFESSIONAL",
      "title": "Especialista",
      "terminal": false,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Elige tu Especialista"
          },
          {
            "type": "Dropdown",
            "label": "Atendido por",
            "name": "professional_id",
            "required": true,
            "data-source": "professionals"
          },
          {
            "type": "Footer",
            "label": "Ver Horarios",
            "on-click-action": {
              "name": "data_exchange",
              "payload": {
                "branch_id": "\\\${data.branch_id}",
                "service_id": "\\\${data.service_id}",
                "professional_id": "\\\${form.professional_id}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "SELECT_DATE_TIME",
      "title": "Fecha y Hora",
      "terminal": false,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Elige la Fecha"
          },
          {
            "type": "DatePicker",
            "label": "Fecha de tu cita",
            "name": "date",
            "required": true
          },
          {
            "type": "Dropdown",
            "label": "Horarios Disponibles",
            "name": "time_slot",
            "required": true,
            "data-source": "time_slots"
          },
          {
            "type": "Footer",
            "label": "Revisar Cita",
            "on-click-action": {
              "name": "data_exchange",
              "payload": {
                "branch_id": "\\\${data.branch_id}",
                "service_id": "\\\${data.service_id}",
                "professional_id": "\\\${data.professional_id}",
                "date": "\\\${form.date}",
                "time_slot": "\\\${form.time_slot}"
              }
            }
          }
        ]
      }
    },
    {
      "id": "CONFIRM_BOOKING",
      "title": "Confirmación",
      "terminal": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Confirmación de Reservación"
          },
          {
            "type": "TextBody",
            "text": "• Sucursal: \\\${data.branch_name}\\\\n• Servicio: \\\${data.service_name}\\\\n• Especialista: \\\${data.professional_name}\\\\n• Fecha: \\\${data.date}\\\\n• Hora: \\\${data.time_slot}"
          },
          {
            "type": "TextInput",
            "label": "Tu Nombre Completo",
            "name": "client_name",
            "required": true
          },
          {
            "type": "TextInput",
            "label": "Tu Teléfono de Contacto",
            "name": "client_phone",
            "required": true
          },
          {
            "type": "Footer",
            "label": "Confirmar Agendamiento",
            "on-click-action": {
              "name": "complete",
              "payload": {
                "branch_id": "\\\${data.branch_id}",
                "service_id": "\\\${data.service_id}",
                "professional_id": "\\\${data.professional_id}",
                "date": "\\\${data.date}",
                "time_slot": "\\\${data.time_slot}",
                "client_name": "\\\${form.client_name}",
                "client_phone": "\\\${form.client_phone}"
              }
            }
          }
        ]
      }
    }
  ]
}`;
                                       navigator.clipboard.writeText(json);
                                       toast.success("Flow JSON Schema copiado.");
                                    }} className="text-[#D4AF37] hover:underline text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><Copy size={12} /> Copiar Schema</button>
                                 </div>
                                 <div className="bg-black/50 p-6 rounded-2xl border border-white/5 text-[9px] font-mono text-zinc-500 overflow-x-auto max-h-60 custom-scrollbar select-all">
                                    <pre>{`{
  "version": "2.1",
  "screens": [
    {
      "id": "SELECT_BRANCH",
      "title": "Sucursal",
      "terminal": false,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Agenda tu Cita" },
          { "type": "Dropdown", "label": "Sucursal", "name": "branch_id", "required": true, "data-source": "branches" }
        ]
      }
    },
    ...
  ]
}`}</pre>
                                 </div>
                              </div>
                           </div>

                           <div className="sticky top-12 space-y-6">
                              <div className="text-center">
                                 <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center justify-center gap-2"><Smartphone size={16} className="text-[#D4AF37]" /> Live Simulator</h4>
                                 <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Valida tu Flow dinámico de extremo a extremo</p>
                              </div>

                              <div className="w-full max-w-[340px] mx-auto bg-black rounded-[3rem] p-4 border border-zinc-800/80 shadow-2xl shadow-black relative overflow-hidden group">
                                 <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-zinc-900 rounded-full mr-2" />
                                    <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
                                 </div>

                                 <div className="relative w-full h-[580px] bg-[#0b141a] rounded-[2.5rem] overflow-hidden flex flex-col border border-zinc-900">
                                    <div className="bg-[#075e54] p-4 text-white flex items-center gap-3 border-b border-[#128c7e]/10 pt-8 shrink-0">
                                       <div className="w-8 h-8 rounded-full bg-[#128c7e] text-white flex items-center justify-center text-xs font-black select-none shadow">CP</div>
                                       <div>
                                          <span className="font-black text-[11px] block select-none">CitaPlanner Flows</span>
                                          <span className="text-[8px] text-emerald-300 font-bold block mt-0.5 select-none flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En línea</span>
                                       </div>
                                    </div>

                                    <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#0b141a] relative custom-scrollbar">
                                       {simLoading && (
                                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                                             <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
                                          </div>
                                       )}

                                       {simScreen === 'SELECT_BRANCH' && simBranches.length === 0 ? (
                                          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                             <div className="p-4 bg-white/5 rounded-full border border-white/5 text-[#D4AF37]"><Sparkles size={36} /></div>
                                             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed font-medium">No se ha iniciado la conexión dinámica</p>
                                             <button onClick={handleStartSimulator} className="px-6 py-3 bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all">Iniciar Simulador</button>
                                          </div>
                                       ) : (
                                          <div className="space-y-4 animate-entrance">
                                             <div className="bg-[#202c33] text-zinc-100 p-4 rounded-3xl rounded-tl-none max-w-[85%] text-[10.5px] font-medium leading-relaxed shadow border border-white/5">
                                                ¡Hola! 🌸 Bienvenido al asistente de reservas nativo en WhatsApp de CitaPlanner AI.
                                                <div className="mt-3 pt-3 border-t border-white/5 text-[9px] text-[#D4AF37] font-black uppercase tracking-wider">
                                                   📲 WhatsApp Flow Iniciado
                                                </div>
                                             </div>

                                             <div className="bg-[#1f2c34] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl mt-4">
                                                <div className="bg-[#2a3942] px-4 py-3 flex justify-between items-center border-b border-white/5">
                                                   <span className="text-[9px] font-black text-white uppercase tracking-widest select-none">
                                                      {simScreen === 'SELECT_BRANCH' && 'Elija Sucursal'}
                                                      {simScreen === 'SELECT_SERVICE' && 'Elija Servicio'}
                                                      {simScreen === 'SELECT_PROFESSIONAL' && 'Elija Especialista'}
                                                      {simScreen === 'SELECT_DATE_TIME' && 'Fecha y Hora'}
                                                      {simScreen === 'CONFIRM_BOOKING' && 'Confirmar Reservación'}
                                                      {simScreen === 'SUCCESS_SCREEN' && 'Éxito'}
                                                   </span>
                                                   <button onClick={handleStartSimulator} className="text-zinc-500 hover:text-white"><X size={12} /></button>
                                                </div>

                                                <div className="p-4 space-y-4">
                                                   {simScreen === 'SELECT_BRANCH' && (
                                                      <div className="space-y-4">
                                                         <div>
                                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1 select-none">Selecciona Sucursal:</label>
                                                            <select value={simBranchId} onChange={e => setSimBranchId(e.target.value)} className="w-full bg-[#111b21] border border-white/5 text-white font-bold py-3.5 px-4 rounded-xl text-[10px] outline-none">
                                                               <option value="">-- Sucursal --</option>
                                                               {simBranches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                                                            </select>
                                                         </div>
                                                         <button onClick={() => handleSimulatorAction('SELECT_SERVICE')} disabled={!simBranchId} className="w-full py-3.5 bg-[#D4AF37] text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-102 transition-all disabled:opacity-30">Ver Servicios</button>
                                                      </div>
                                                   )}

                                                   {simScreen === 'SELECT_SERVICE' && (
                                                      <div className="space-y-4">
                                                         <div>
                                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1 select-none">Selecciona Servicio:</label>
                                                            <select value={simServiceId} onChange={e => setSimServiceId(e.target.value)} className="w-full bg-[#111b21] border border-white/5 text-white font-bold py-3.5 px-4 rounded-xl text-[10px] outline-none">
                                                               <option value="">-- Servicio --</option>
                                                               {simServices.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                                            </select>
                                                         </div>
                                                         <button onClick={() => handleSimulatorAction('SELECT_PROFESSIONAL')} disabled={!simServiceId} className="w-full py-3.5 bg-[#D4AF37] text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-102 transition-all disabled:opacity-30">Ver Especialistas</button>
                                                      </div>
                                                   )}

                                                   {simScreen === 'SELECT_PROFESSIONAL' && (
                                                      <div className="space-y-4">
                                                         <div>
                                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1 select-none">Selecciona Atiende:</label>
                                                            <select value={simProfessionalId} onChange={e => setSimProfessionalId(e.target.value)} className="w-full bg-[#111b21] border border-white/5 text-white font-bold py-3.5 px-4 rounded-xl text-[10px] outline-none">
                                                               <option value="">-- Especialista --</option>
                                                               {simProfessionals.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                                            </select>
                                                         </div>
                                                         <button onClick={() => handleSimulatorAction('SELECT_DATE_TIME')} disabled={!simProfessionalId} className="w-full py-3.5 bg-[#D4AF37] text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-102 transition-all disabled:opacity-30">Ver Horarios</button>
                                                      </div>
                                                   )}

                                                   {simScreen === 'SELECT_DATE_TIME' && (
                                                      <div className="space-y-4">
                                                         <div>
                                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1 select-none">Fecha de cita:</label>
                                                            <input type="date" value={simDate} onChange={e => { setSimDate(e.target.value); handleSimulatorAction('SELECT_DATE_TIME', { date: e.target.value, time_slot: '' }); }} className="w-full bg-[#111b21] border border-white/5 text-white font-bold py-3 px-4 rounded-xl text-[10px] outline-none" />
                                                         </div>
                                                         <div>
                                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 block ml-1 select-none">Horarios en Vivo:</label>
                                                            <select value={simTimeSlot} onChange={e => setSimTimeSlot(e.target.value)} className="w-full bg-[#111b21] border border-white/5 text-white font-bold py-3.5 px-4 rounded-xl text-[10px] outline-none">
                                                               <option value="">-- Horario --</option>
                                                               {simTimeSlots.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                                            </select>
                                                         </div>
                                                         <button onClick={() => handleSimulatorAction('CONFIRM_BOOKING')} disabled={!simTimeSlot} className="w-full py-3.5 bg-[#D4AF37] text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-102 transition-all disabled:opacity-30">Revisar Cita</button>
                                                      </div>
                                                   )}

                                                   {simScreen === 'CONFIRM_BOOKING' && (
                                                      <div className="space-y-4 text-white text-[10px] font-semibold leading-relaxed">
                                                         <div className="bg-[#111b21] p-4 rounded-2xl border border-white/5 space-y-1.5">
                                                            <p>• Sucursal: <span className="text-[#D4AF37]">
                                                               {simBranches.find(b => b.id === simBranchId)?.title || 'Cargando...'}
                                                            </span></p>
                                                            <p>• Servicio: <span className="text-[#D4AF37]">
                                                               {simServices.find(s => s.id === simServiceId)?.title || 'Cargando...'}
                                                            </span></p>
                                                            <p>• Atiende: <span className="text-[#D4AF37]">
                                                               {simProfessionals.find(p => p.id === simProfessionalId)?.title || 'Cargando...'}
                                                            </span></p>
                                                            <p>• Fecha: <span className="text-[#D4AF37]">{simDate}</span></p>
                                                            <p>• Hora: <span className="text-[#D4AF37]">{simTimeSlot} hrs</span></p>
                                                         </div>

                                                         <div className="space-y-2">
                                                            <input type="text" placeholder="Tu Nombre" value={simClientName} onChange={e => setSimClientName(e.target.value)} className="w-full bg-[#111b21] border border-white/5 text-white font-bold py-3 px-4 rounded-xl text-[10px] outline-none" />
                                                            <input type="text" placeholder="Tu Teléfono" value={simClientPhone} onChange={e => setSimClientPhone(e.target.value)} className="w-full bg-[#111b21] border border-white/5 text-white font-bold py-3 px-4 rounded-xl text-[10px] outline-none" />
                                                         </div>

                                                         <button onClick={() => handleSimulatorAction('SUCCESS_SCREEN')} disabled={!simClientName || !simClientPhone} className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-102 transition-all disabled:opacity-30 shadow-lg shadow-[#D4AF37]/20">Confirmar Cita Real</button>
                                                      </div>
                                                   )}

                                                   {simScreen === 'SUCCESS_SCREEN' && (
                                                      <div className="text-center py-6 space-y-4 animate-entrance">
                                                         <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow"><Check size={28} /></div>
                                                         <div>
                                                            <h5 className="text-[11px] font-black text-white uppercase tracking-widest">Reserva Exitosa</h5>
                                                            <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 leading-relaxed">{simSuccessMessage}</p>
                                                         </div>
                                                         <button onClick={handleStartSimulator} className="w-full py-3.5 bg-white/5 text-white border border-white/10 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">Agendar Otra Cita</button>
                                                      </div>
                                                   )}
                                                </div>
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                    <div className="bg-[#050505] p-3 text-center text-[7px] text-zinc-700 font-mono select-none">
                                       SMARTPHONE SIMULATOR • POWERED BY CITAPLANNER
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'GENERAL' && landingSettings && (
                  <div className="space-y-12 animate-entrance">
                     <section>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8">Identidad del Nodo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Nombre Comercial</label>
                              <input
                                 type="text"
                                 value={landingSettings.businessName}
                                 onChange={(e) => setLandingSettings({ ...landingSettings, businessName: e.target.value })}
                                 onBlur={() => api.updateLandingSettings(landingSettings)}
                                 className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-xs outline-none focus:border-[#D4AF37]"
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Subdominio Operativo</label>
                              <div className="relative">
                                 <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                                 <input type="text" value={landingSettings.subdomain} className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl text-[#D4AF37] font-mono font-bold text-xs" disabled />
                              </div>
                           </div>
                        </div>
                     </section>

                     <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
                        <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-8 flex items-center gap-3"><MapPin size={16} /> Contact Hub</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">WhatsApp de Enlace</label>
                              <input
                                 type="text"
                                 value={landingSettings.contactPhone || ''}
                                 onChange={(e) => setLandingSettings({ ...landingSettings, contactPhone: e.target.value })}
                                 onBlur={() => api.updateLandingSettings(landingSettings)}
                                 className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs"
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Dirección de Matriz</label>
                              <input
                                 type="text"
                                 value={landingSettings.address || ''}
                                 onChange={(e) => setLandingSettings({ ...landingSettings, address: e.target.value })}
                                 onBlur={() => api.updateLandingSettings(landingSettings)}
                                 className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs"
                              />
                           </div>
                        </div>
                     </section>

                     <section className="bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 space-y-8">
                        <div>
                           <h4 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                              <Calendar className="text-[#D4AF37]" size={24} /> Sincronización Maestra (iCal)
                           </h4>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2 max-w-2xl">
                              Genera un feed único que consolida todas las agendas de tus especialistas. Ideal para que tú como Admin visualices la operación completa en tu Apple Calendar u Outlook.
                           </p>
                        </div>

                        {!masterIcalToken ? (
                           <button
                              onClick={handleActivateMasterIcal}
                              disabled={generatingToken}
                              className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black hover:scale-[1.02] transition-all shadow-lg shadow-[#D4AF37]/20 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"
                           >
                              {generatingToken ? <Loader2 size={18} className="animate-spin text-black" /> : <Sparkles size={18} />}
                              Activar Calendario Maestro
                           </button>
                        ) : (
                           <div className="space-y-6 animate-entrance">
                              <div className="bg-black/60 p-6 rounded-[2.5rem] border border-[#D4AF37]/20">
                                 <label className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-4 block ml-2">Feed URL de suscripción (Público Seguro)</label>
                                 <div className="flex gap-4">
                                    <input
                                       type="text"
                                       readOnly
                                       className="flex-1 bg-white/5 border border-white/5 p-4 rounded-xl text-[10px] font-mono text-zinc-400 outline-none"
                                       value={`${window.location.origin}/api/calendar/tenant/feed/${masterIcalToken}.ics`}
                                    />
                                    <button
                                       onClick={() => {
                                          navigator.clipboard.writeText(`${window.location.origin}/api/calendar/tenant/feed/${masterIcalToken}.ics`);
                                          toast.success("Enlace maestro copiado.");
                                       }}
                                       className="p-4 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black rounded-xl hover:scale-105 transition-transform"
                                    >
                                       <Copy size={18} />
                                    </button>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4 px-6 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                 <Check className="text-emerald-500" size={14} /> Sincronización activa en tiempo real
                                 <span className="mx-2 opacity-20">|</span>
                                 <ExternalLink size={14} /> Actualización automática cada 15 min
                              </div>
                           </div>
                        )}
                     </section>

                     <section className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-8 rounded-[3.5rem] flex items-center gap-6">
                        <div className="p-4 bg-[#D4AF37] text-black rounded-2xl shadow-2xl"><ShieldCheck size={24} /></div>
                        <div>
                           <h4 className="text-white font-black uppercase text-sm mb-1">Sincronización Hub Maestro</h4>
                           <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Su identidad de negocio está vinculada al Ecosistema Global de Aurum Capital.</p>
                        </div>
                     </section>
                  </div>
               )}

               {activeTab === 'SECURITY' && (
                  <div className="space-y-12 animate-entrance">
                     <div className="flex justify-between items-center bg-white/5 p-8 rounded-[3rem] border border-white/5 mb-10">
                        <div className="flex items-center gap-6">
                           <div className="p-4 bg-zinc-900 rounded-2xl text-[#D4AF37]"><ShieldAlert size={24} /></div>
                           <div>
                              <h4 className="text-white font-black uppercase text-lg tracking-tight">Protocolos de Seguridad</h4>
                              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Gestión de Credenciales e Integridad de Sesión</p>
                           </div>
                        </div>
                        <button className="gold-btn px-8 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest">Auditar Accesos</button>
                     </div>

                     <section className="space-y-10">
                        <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-black/40">
                           <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-8">Actualizar Credenciales Maestras</h5>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-3">
                                 <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                 <input type="password" placeholder="••••••••" className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37]" />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                                 <input type="password" placeholder="••••••••" className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37]" />
                              </div>
                           </div>
                           <div className="mt-10 flex justify-end">
                              <button className="bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Sincronizar Password</button>
                           </div>
                        </div>

                        <div className="bg-rose-500/5 border border-rose-500/10 p-10 rounded-[3rem]">
                           <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-6">Zona de Riesgo</h5>
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                              <div>
                                 <h6 className="text-white font-black uppercase text-sm mb-1">Cerrar Sesión en Todos los Dispositivos</h6>
                                 <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest max-w-md">Invalidará todos los tokens de acceso activos en cualquier nodo cliente vinculado a este perfil.</p>
                              </div>
                              <button className="px-8 py-4 bg-rose-500/10 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">Invalidar Sesiones</button>
                           </div>
                        </div>
                     </section>
                  </div>
               )}

               {activeTab === 'BILLING' && (
                  <div className="space-y-8 animate-entrance">
                     <div className="flex justify-between items-center">
                        <div>
                           <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Suscripción & Facturación</h3>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">Gestión de Planes y Métodos de Pago</p>
                        </div>
                        <a href="/plans-billing" className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-white transition-all">
                           Ver Planes Disponibles
                        </a>
                     </div>

                     <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-zinc-900 rounded-full text-zinc-500"><ShieldCheck size={32} /></div>
                        <h4 className="text-white font-bold uppercase tracking-widest text-sm">Estado de Suscripción</h4>
                        <p className="text-zinc-500 text-xs max-w-md">
                           Actualmente no hay una suscripción activa detectada en este nodo. Para activar todas las funcionalidades de Inteligencia Artificial y Marketing, seleccione un plan.
                        </p>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

