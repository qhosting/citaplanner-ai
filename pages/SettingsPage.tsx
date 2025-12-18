import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Globe, Zap, Building2, Loader2, 
  ImageIcon, Palette, Layout, Type as TypeIcon, Phone, 
  MapPin, Clock, ShieldCheck, Database, Key, BellRing, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LandingSettings, TemplateId } from '../types';
import { AIDesignCoach } from '../components/AIDesignCoach';

const TEMPLATES: {id: TemplateId, name: string, desc: string, color: string}[] = [
  { id: 'citaplanner', name: 'Citaplanner Elite', desc: 'Estética corporativa burdeos y oro.', color: '#630E14' },
  { id: 'beauty', name: 'Studio Secret Garden', desc: 'Lujo sutil en tonos rosa y oro.', color: '#8B5E66' },
  { id: 'dentist', name: 'Elite Dental Clinic', desc: 'Sofisticación clínica en azul marino.', color: '#0A192F' },
  { id: 'barber', name: 'Gentleman\'s Lounge', desc: 'Herencia masculina en verde bosque.', color: '#1B3022' },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'OPERATIONS' | 'LANDING' | 'INTEGRATION'>('OPERATIONS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [landingSettings, setLandingSettings] = useState<LandingSettings | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const landing = await api.getLandingSettings();
    setLandingSettings(landing);
    setLoading(false);
  };

  const handleSaveAll = async () => {
    if (!landingSettings) return;
    setSaving(true);
    const success = await api.updateLandingSettings(landingSettings);
    setSaving(false);
    if (success) toast.success("Infraestructura del sistema sincronizada correctamente.");
  };

  const handleTemplateChange = (tid: TemplateId) => {
    if (!landingSettings) return;
    const template = TEMPLATES.find(t => t.id === tid);
    setLandingSettings({
      ...landingSettings,
      templateId: tid,
      primaryColor: template?.color || landingSettings.primaryColor
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                Master <span className="gold-text-gradient font-light">Config</span>
             </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Núcleo del Sistema • Aurum Governance Platform</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="gold-btn text-black px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
          Sincronizar Cambios Globales
        </button>
      </div>

      <div className="glass-card rounded-[3.5rem] border-white/5 overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-80 bg-black/40 border-r border-white/5 p-8 space-y-3">
          {[
            { id: 'OPERATIONS', label: 'Operaciones', icon: Clock },
            { id: 'GENERAL', label: 'Perfil de Negocio', icon: Building2 },
            { id: 'LANDING', label: 'Constructor Web', icon: Layout },
            { id: 'INTEGRATION', label: 'Integraciones IA', icon: Zap },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group ${activeTab === tab.id ? 'bg-[#D4AF37]/10 text-[#D4AF37] shadow-xl border border-[#D4AF37]/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-[#D4AF37]' : 'text-slate-600 group-hover:text-slate-400'} /> 
              {tab.label}
            </button>
          ))}
          
          <div className="pt-10 mt-10 border-t border-white/5">
             <div className="bg-[#D4AF37]/5 p-6 rounded-3xl border border-[#D4AF37]/10">
                <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mb-2">Estado de Licencia</p>
                <p className="text-[11px] font-bold text-white uppercase mb-4">Aurum Enterprise V.4</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sistemas OK</span>
                </div>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-12 overflow-y-auto max-h-[800px] custom-scrollbar bg-black/20">
          
          {activeTab === 'OPERATIONS' && (
            <div className="space-y-12 animate-entrance">
               <section>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-4">
                    <Clock className="text-[#D4AF37]" size={28} /> Horarios Globales de Operación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['Lunes a Viernes', 'Sábado', 'Domingo'].map((day, i) => (
                      <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-center group hover:border-[#D4AF37]/30 transition-all">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{day}</p>
                          <p className="text-xl font-black text-white">09:00 AM - 08:00 PM</p>
                        </div>
                        <button className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest border border-[#D4AF37]/20 px-5 py-2 rounded-full hover:bg-[#D4AF37] hover:text-black transition-all">Editar</button>
                      </div>
                    ))}
                  </div>
               </section>

               <section>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-4">
                    <Settings className="text-[#D4AF37]" size={28} /> Reglas del Sistema
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Intervalo entre Citas', value: '30 Minutos' },
                      { label: 'Anticipación Mínima', value: '2 Horas' },
                      { label: 'Cancelación sin Penalización', value: '24 Horas' }
                    ].map((rule, i) => (
                      <div key={i} className="flex justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/5">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{rule.label}</span>
                        <span className="text-sm font-black text-[#D4AF37] uppercase">{rule.value}</span>
                      </div>
                    ))}
                  </div>
               </section>
            </div>
          )}

          {activeTab === 'GENERAL' && landingSettings && (
             <div className="space-y-10 animate-entrance">
                <section>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-4">
                    <Building2 className="text-[#D4AF37]" size={28} /> Identidad Corporativa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nombre Oficial</label>
                        <input 
                          type="text" 
                          value={landingSettings.businessName} 
                          onChange={e => setLandingSettings({...landingSettings, businessName: e.target.value})}
                          className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Línea de Contacto Principal</label>
                        <input 
                          type="text" 
                          value={landingSettings.contactPhone || ''} 
                          onChange={e => setLandingSettings({...landingSettings, contactPhone: e.target.value})}
                          className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Ubicación Master</label>
                      <textarea 
                        rows={5}
                        value={landingSettings.address || ''} 
                        onChange={e => setLandingSettings({...landingSettings, address: e.target.value})}
                        className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white transition-all resize-none"
                        placeholder="Dirección física completa..."
                      />
                    </div>
                  </div>
                </section>
             </div>
          )}

          {activeTab === 'LANDING' && landingSettings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-entrance">
              <div className="space-y-12">
                <section>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-4">
                    <Layout className="text-[#D4AF37]" size={28} /> Plantilla Elite
                  </h3>
                  <div className="space-y-4">
                    {TEMPLATES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => handleTemplateChange(t.id)}
                        className={`w-full p-6 rounded-[2rem] border-2 flex items-center gap-8 transition-all text-left group ${landingSettings.templateId === t.id ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-2xl' : 'border-white/5 hover:border-white/10'}`}
                      >
                        <div style={{ backgroundColor: t.color }} className="w-14 h-14 rounded-2xl shadow-2xl shrink-0 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className={`font-black text-xs uppercase tracking-widest ${landingSettings.templateId === t.id ? 'text-[#D4AF37]' : 'text-slate-400 group-hover:text-white'}`}>{t.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-10">
                <AIDesignCoach 
                  businessDesc={landingSettings.aboutText} 
                  onSuggest={(s) => setLandingSettings({
                    ...landingSettings, 
                    primaryColor: s.primary, 
                    slogan: s.slogan, 
                    aboutText: s.about
                  })} 
                />
                
                <section className="bg-white/5 p-8 rounded-[3rem] border border-white/5">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                      <TypeIcon size={20} className="text-[#D4AF37]" /> Narrativa de Marca
                   </h3>
                   <textarea 
                    value={landingSettings.aboutText} 
                    onChange={e => setLandingSettings({...landingSettings, aboutText: e.target.value})}
                    rows={8}
                    className="w-full p-6 bg-black/40 border border-white/5 rounded-3xl focus:border-[#D4AF37] outline-none resize-none font-medium text-slate-400 leading-relaxed"
                  />
                </section>
              </div>
            </div>
          )}

          {activeTab === 'INTEGRATION' && (
            <div className="space-y-12 animate-entrance">
               <section>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-4">
                    <Zap className="text-[#D4AF37]" size={28} /> Ecosistema Digital
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {[
                       { name: 'WAHA (WhatsApp API)', status: 'Connected', icon: BellRing },
                       { name: 'Odoo ERP (Inventory)', status: 'Standby', icon: Database },
                       { name: 'LabsMobile (SMS)', status: 'Active', icon: Key },
                       { name: 'Aurum AI Core', status: 'Optimal', icon: Sparkles }
                     ].map((int, i) => (
                       <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 hover:bg-white/10 transition-all">
                          <div className="flex justify-between items-start">
                             <div className="p-4 bg-black/40 rounded-2xl text-[#D4AF37] border border-[#D4AF37]/10"><int.icon size={24} /></div>
                             <span className="text-[8px] font-black uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{int.status}</span>
                          </div>
                          <div>
                            <h4 className="font-black text-white text-lg uppercase tracking-tight">{int.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">v.2.4.0 Stable Build</p>
                          </div>
                          <button className="w-full py-4 text-[9px] font-black uppercase text-slate-400 border border-white/5 rounded-2xl hover:text-white hover:bg-white/5 transition-all">Configurar Token</button>
                       </div>
                     ))}
                  </div>
               </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
