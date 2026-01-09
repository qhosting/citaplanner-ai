
import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Save, Globe, Zap, Building2, Loader2, 
  ImageIcon, Palette, Layout, Type as TypeIcon, Phone, 
  MapPin, Clock, ShieldCheck, Database, Key, BellRing, Sparkles, X, Check, Power, Eye, EyeOff, Terminal, Cpu, Cloud, Plus, Trash2, ArrowUpRight, ShieldAlert,
  Upload, Wand2, MessageCircle, Instagram, Facebook, Search, Navigation, Target, BarChart, Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LandingSettings, TemplateId, OperatingHours, HeroSlide, SocialLinks } from '../types';
import { AIDesignCoach } from '../components/AIDesignCoach';
import { GoogleGenAI, Type } from '@google/genai';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'OPERATIONS' | 'LANDING' | 'INTEGRATION' | 'SECURITY'>('OPERATIONS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAiSeoLoading, setIsAiSeoLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  
  const [landingSettings, setLandingSettings] = useState<LandingSettings | null>(null);
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const currentUploadTarget = useRef<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const landing = await api.getLandingSettings();
      setLandingSettings({
        ...landing,
        showWhatsappButton: landing.showWhatsappButton ?? true
      });
    } catch (e) {
      toast.error("Error al conectar con el servidor de configuración.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!landingSettings) return;
    setSaving(true);
    const success = await api.updateLandingSettings(landingSettings);
    setSaving(false);
    if (success) toast.success("Infraestructura del sistema sincronizada correctamente.");
    else toast.error("Error al guardar cambios en el servidor.");
  };

  const handleAddDomain = async () => {
    if (!newCustomDomain) return;
    setIsAddingDomain(true);
    const success = await api.addCustomDomain(newCustomDomain);
    setIsAddingDomain(false);
    if (success) {
      setLandingSettings(prev => prev ? { ...prev, customDomain: newCustomDomain } : null);
      toast.success("Dominio vinculado. Configura tu DNS.");
    } else {
      toast.error("Error al vincular el dominio.");
    }
  };

  const handleRemoveDomain = async () => {
    if (!window.confirm("¿Seguro que deseas desvincular el dominio? Tu sitio dejará de ser accesible desde esa URL.")) return;
    setIsAddingDomain(true);
    const success = await api.removeCustomDomain();
    setIsAddingDomain(false);
    if (success) {
      setLandingSettings(prev => prev ? { ...prev, customDomain: undefined } : null);
      toast.success("Dominio desvinculado.");
    } else {
      toast.error("Error al desvincular.");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !landingSettings) return;
    setIsLogoUploading(true);
    const url = await api.uploadImage(file);
    if (url) {
      setLandingSettings({ ...landingSettings, logoUrl: url });
      toast.success("Logo institucional actualizado.");
    }
    setIsLogoUploading(false);
  };

  const handleAiSeo = async () => {
    if (!landingSettings || !process.env.API_KEY) return;
    setIsAiSeoLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const prompt = `Actúa como un experto en SEO para negocios de lujo. 
      Negocio: ${landingSettings.businessName}
      Descripción: ${landingSettings.aboutText}
      Ubicación: ${landingSettings.address}
      
      Genera:
      1. Un Meta Título (máximo 60 caracteres) altamente atractivo.
      2. Una Meta Descripción (máximo 160 caracteres) que invite al clic.
      3. Una lista de 10 palabras clave separadas por comas que incluyan términos locales basados en la ubicación.
      
      Formato de salida: JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              keywords: { type: Type.STRING }
            },
            required: ["title", "description", "keywords"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setLandingSettings({
        ...landingSettings,
        seoTitle: data.title,
        seoDescription: data.description,
        seoKeywords: data.keywords
      });
      toast.success("Estrategia SEO generada por IA aplicada.");
    } catch (e) {
      toast.error("Error al consultar el núcleo de indexación IA.");
    } finally {
      setIsAiSeoLoading(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !landingSettings || !landingSettings.heroSlides) return;

    setUploadingIndex(index);
    try {
      const url = await api.uploadImage(file);
      if (url) {
        const newSlides = [...landingSettings.heroSlides];
        newSlides[index] = { ...newSlides[index], image: url };
        setLandingSettings({ ...landingSettings, heroSlides: newSlides });
        toast.success("Imagen de slider actualizada.");
      }
    } catch (err) {
      toast.error("Error al subir imagen.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const triggerUpload = (index: number) => {
    currentUploadTarget.current = index;
    fileInputRef.current?.click();
  };

  const addSlide = () => {
    if (!landingSettings) return;
    const newSlides = [...(landingSettings.heroSlides || []), {
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035',
      title: 'NUEVA EXPERIENCIA',
      subtitle: 'AURUM',
      text: 'Describe aquí el valor diferencial de este servicio.'
    }];
    setLandingSettings({ ...landingSettings, heroSlides: newSlides });
  };

  const removeSlide = (index: number) => {
    if (!landingSettings || !landingSettings.heroSlides) return;
    const newSlides = landingSettings.heroSlides.filter((_, i) => i !== index);
    setLandingSettings({ ...landingSettings, heroSlides: newSlides });
  };

  const updateSlide = (index: number, field: keyof HeroSlide, value: string) => {
    if (!landingSettings || !landingSettings.heroSlides) return;
    const newSlides = [...landingSettings.heroSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setLandingSettings({ ...landingSettings, heroSlides: newSlides });
  };

  const updateSocial = (field: keyof SocialLinks, value: string) => {
    if (!landingSettings) return;
    setLandingSettings({ 
      ...landingSettings, 
      socialLinks: { ...(landingSettings.socialLinks || {}), [field]: value } 
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => currentUploadTarget.current !== null && handleHeroImageUpload(e, currentUploadTarget.current)} />
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Master <span className="gold-text-gradient font-light">Config</span></h1>
          </div>
          <p className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Aurum Governance Platform</p>
        </div>
        <button onClick={handleSaveAll} disabled={saving} className="gold-btn text-black px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} Sincronizar Cambios Globales
        </button>
      </div>

      <div className="glass-card rounded-[3.5rem] border-white/5 overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        <div className="w-full md:w-80 bg-black/40 border-r border-white/5 p-8 space-y-3">
          {[
            { id: 'OPERATIONS', label: 'Operaciones', icon: Clock },
            { id: 'GENERAL', label: 'Perfil & Dominios', icon: Globe },
            { id: 'LANDING', label: 'Constructor Web', icon: Layout },
            { id: 'INTEGRATION', label: 'Ecosistema', icon: Zap },
            { id: 'SECURITY', label: 'Bóveda IA', icon: Key },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-12 overflow-y-auto max-h-[850px] custom-scrollbar bg-black/20">
          
          {/* ... (Existing Tabs) ... */}

          {activeTab === 'GENERAL' && landingSettings && (
             <div className="space-y-10 animate-entrance">
                <section>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-4"><Building2 className="text-[#D4AF37]" size={28} /> Perfil Corporativo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <input type="text" value={landingSettings.businessName} onChange={e => setLandingSettings({...landingSettings, businessName: e.target.value})} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white" placeholder="Nombre" />
                      <input type="text" value={landingSettings.contactPhone || ''} onChange={e => setLandingSettings({...landingSettings, contactPhone: e.target.value})} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white" placeholder="WhatsApp Concierge" />
                    </div>
                    <textarea rows={6} value={landingSettings.address || ''} onChange={e => setLandingSettings({...landingSettings, address: e.target.value})} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white resize-none" placeholder="Ubicación" />
                  </div>
                </section>

                <section className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3"><LinkIcon size={20} className="text-[#D4AF37]" /> Gestión de Dominio</h3>
                   
                   <div className="mb-8">
                      <p className="text-xs text-zinc-400 mb-2">Subdominio Automático:</p>
                      <div className="flex items-center gap-2 p-4 bg-black/40 rounded-2xl border border-white/5">
                         <Globe size={16} className="text-emerald-500" />
                         <span className="font-mono text-sm text-white">{landingSettings.subdomain || '...'}</span><span className="text-zinc-600">.citaplanner.com</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-xs text-zinc-400">Dominio Personalizado (Marca Blanca):</p>
                      {landingSettings.customDomain ? (
                         <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                  <ShieldCheck size={18} className="text-[#D4AF37]" />
                                  <span className="font-bold text-white">{landingSettings.customDomain}</span>
                               </div>
                               <button onClick={handleRemoveDomain} disabled={isAddingDomain} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-white transition-colors">Desvincular</button>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl text-[10px] text-zinc-400 font-mono">
                               Status DNS: <span className="text-emerald-500">Activo (Cloudflare SSL)</span>
                            </div>
                         </div>
                      ) : (
                         <div className="space-y-4">
                            <div className="flex gap-4">
                               <input 
                                 type="text" 
                                 placeholder="Ej: agenda.tustudio.com" 
                                 value={newCustomDomain}
                                 onChange={e => setNewCustomDomain(e.target.value)}
                                 className="flex-1 p-4 bg-black/40 border border-white/5 rounded-2xl text-white text-sm outline-none focus:border-[#D4AF37]" 
                               />
                               <button 
                                 onClick={handleAddDomain}
                                 disabled={isAddingDomain || !newCustomDomain}
                                 className="px-6 bg-[#D4AF37] text-black rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                               >
                                 {isAddingDomain ? <Loader2 className="animate-spin" size={16}/> : 'Vincular'}
                               </button>
                            </div>
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[10px] text-blue-300 leading-relaxed">
                               <p className="font-bold mb-1">Instrucciones DNS:</p>
                               1. Entra a tu proveedor de dominio (GoDaddy, Namecheap, etc).<br/>
                               2. Crea un registro <b>CNAME</b>.<br/>
                               3. Apunta a: <b>citaplanner.com</b> (o el dominio raíz del sistema).
                            </div>
                         </div>
                      )}
                   </div>
                </section>
             </div>
          )}

          {/* ... (Rest of Tabs) ... */}
          {activeTab === 'LANDING' && landingSettings && (
            <div className="space-y-16 animate-entrance">
              {/* BRANDING SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <section className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><Sparkles size={20} className="text-[#D4AF37]" /> Identidad Visual</h3>
                   <div className="flex flex-col items-center gap-8">
                      <div onClick={() => logoInputRef.current?.click()} className="w-48 h-48 rounded-[3rem] bg-black border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-[#D4AF37]/50 transition-all overflow-hidden group relative">
                         {landingSettings.logoUrl ? <img src={landingSettings.logoUrl} className="w-full h-full object-contain p-4" alt="Logo" /> : <Upload size={32} className="text-zinc-700" />}
                         {isLogoUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" /></div>}
                      </div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">Logo Maestro (PNG/SVG Transparente)</p>
                   </div>
                </section>

                <div className="space-y-10">
                   <AIDesignCoach businessDesc={landingSettings.aboutText} onSuggest={(s) => setLandingSettings({...landingSettings, primaryColor: s.primary, slogan: s.slogan, aboutText: s.about})} />
                   <section className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3"><MessageCircle size={20} className="text-[#D4AF37]" /> Canales de Conversión</h3>
                      <div className="flex items-center justify-between bg-black/40 p-6 rounded-3xl border border-white/5">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#25D366]/10 text-[#25D366] rounded-xl"><MessageCircle size={20} /></div>
                            <div>
                               <h4 className="text-xs font-black text-white uppercase tracking-widest">Concierge Flotante</h4>
                               <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Botón de WhatsApp en Landing</p>
                            </div>
                         </div>
                         <button 
                            type="button"
                            onClick={() => setLandingSettings(prev => prev ? ({ ...prev, showWhatsappButton: !prev.showWhatsappButton }) : null)} 
                            className={`w-14 h-7 rounded-full transition-all relative ${landingSettings.showWhatsappButton ? 'bg-[#C5A028]' : 'bg-zinc-800'}`}
                         >
                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${landingSettings.showWhatsappButton ? 'left-8' : 'left-1'}`} />
                         </button>
                      </div>
                   </section>
                </div>
              </div>

              {/* SEO & GEO ENGINE */}
              <section className="pt-10 border-t border-white/5">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                       <BarChart size={28} className="text-[#D4AF37]" />
                       <div>
                          <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Motor de Indexación & GEO</h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Visibilidad Orgánica & Presencia en Google Maps</p>
                       </div>
                    </div>
                    <button 
                      onClick={handleAiSeo}
                      disabled={isAiSeoLoading}
                      className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 hover:bg-[#D4AF37] hover:text-black transition-all"
                    >
                       {isAiSeoLoading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />} Optimizar SEO con IA
                    </button>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* SEO Fields */}
                    <div className="lg:col-span-7 space-y-6">
                       <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                          <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-2 mb-4"><Search size={14} className="text-[#D4AF37]" /> Meta Tags Maestros</h4>
                          <div>
                            <div className="flex justify-between mb-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Meta Título (SEO)</label>
                               <span className="text-[8px] text-slate-600 font-bold">{(landingSettings.seoTitle || '').length}/60</span>
                            </div>
                            <input 
                              type="text" 
                              value={landingSettings.seoTitle || ''} 
                              onChange={e => setLandingSettings({...landingSettings, seoTitle: e.target.value})}
                              className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-white outline-none focus:border-[#D4AF37]" 
                              placeholder="Ej: Aurum Beauty | Micropigmentación de Lujo en Polanco"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Meta Descripción</label>
                               <span className="text-[8px] text-slate-600 font-bold">{(landingSettings.seoDescription || '').length}/160</span>
                            </div>
                            <textarea 
                              rows={3}
                              value={landingSettings.seoDescription || ''} 
                              onChange={e => setLandingSettings({...landingSettings, seoDescription: e.target.value})}
                              className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-slate-300 outline-none focus:border-[#D4AF37] resize-none" 
                              placeholder="Describe el valor diferencial para aparecer en los resultados de búsqueda..."
                            />
                          </div>
                          <div>
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Keywords Estratégicas</label>
                             <input 
                              type="text" 
                              value={landingSettings.seoKeywords || ''} 
                              onChange={e => setLandingSettings({...landingSettings, seoKeywords: e.target.value})}
                              className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-slate-400 outline-none focus:border-[#D4AF37]" 
                              placeholder="belleza, micropigmentación, lujo, polanco, spa..."
                            />
                          </div>
                       </div>
                    </div>

                    {/* GEO Fields */}
                    <div className="lg:col-span-5 space-y-6">
                       <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-6 h-full">
                          <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-2 mb-4"><Navigation size={14} className="text-[#D4AF37]" /> Geolocalización Elite</h4>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Latitud</label>
                                <input 
                                  type="text" 
                                  value={landingSettings.latitude || ''} 
                                  onChange={e => setLandingSettings({...landingSettings, latitude: e.target.value})}
                                  className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-white outline-none focus:border-[#D4AF37]" 
                                  placeholder="19.4326"
                                />
                             </div>
                             <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Longitud</label>
                                <input 
                                  type="text" 
                                  value={landingSettings.longitude || ''} 
                                  onChange={e => setLandingSettings({...landingSettings, longitude: e.target.value})}
                                  className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-white outline-none focus:border-[#D4AF37]" 
                                  placeholder="-99.1332"
                                />
                             </div>
                          </div>
                          <div>
                             <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Google Maps Master URL</label>
                             <div className="relative">
                                <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                                <input 
                                  type="url" 
                                  value={landingSettings.googleMapsUrl || ''} 
                                  onChange={e => setLandingSettings({...landingSettings, googleMapsUrl: e.target.value})}
                                  className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] text-blue-400 outline-none focus:border-[#D4AF37]" 
                                  placeholder="https://maps.app.goo.gl/..."
                                />
                             </div>
                          </div>
                          <div className="pt-4 border-t border-white/5">
                             <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <ShieldCheck className="text-emerald-500" size={18} />
                                <p className="text-[8px] text-slate-500 font-bold uppercase leading-relaxed">Schema.org JSON-LD LocalBusiness activo. Tu negocio será priorizado en búsquedas locales.</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              {/* SLIDERS SECTION */}
              <section className="pt-10 border-t border-white/5">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-4"><ImageIcon className="text-[#D4AF37]" size={28} /> Sliders Maestros</h3>
                    <button onClick={addSlide} className="gold-btn px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><Plus size={14} /> Añadir Slider</button>
                 </div>
                 <div className="grid grid-cols-1 gap-8">
                    {landingSettings.heroSlides?.map((slide, i) => (
                      <div key={i} className="glass-card p-10 rounded-[3.5rem] border-white/5 flex flex-col lg:flex-row gap-10 group relative hover:border-[#D4AF37]/30 transition-all">
                         <button onClick={() => removeSlide(i)} className="absolute top-8 right-8 p-3 text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                         <div className="w-full lg:w-80 h-64 rounded-[2.5rem] overflow-hidden border border-white/10 shrink-0 relative group/img">
                            <img src={slide.image} className="w-full h-full object-cover group-hover/img:scale-110 transition-all opacity-60" alt="Slide" />
                            <button onClick={() => triggerUpload(i)} className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity">
                               {uploadingIndex === i ? <Loader2 className="animate-spin text-[#D4AF37]" size={32} /> : <Upload className="text-white" size={32} />}
                               <span className="text-[8px] font-black text-white uppercase tracking-widest mt-2">Cargar Media</span>
                            </button>
                         </div>
                         <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Imagen URL</label><input type="text" value={slide.image} onChange={e => updateSlide(i, 'image', e.target.value)} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] text-zinc-400 outline-none focus:border-[#D4AF37]" /></div>
                            <div><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Cabecera</label><input type="text" value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-white outline-none focus:border-[#D4AF37] font-black uppercase" /></div>
                            <div><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Subtítulo</label><input type="text" value={slide.subtitle} onChange={e => updateSlide(i, 'subtitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-[#D4AF37] outline-none focus:border-[#D4AF37] font-black uppercase" /></div>
                            <div className="md:col-span-2"><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Descripción</label><textarea rows={2} value={slide.text} onChange={e => updateSlide(i, 'text', e.target.value)} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-zinc-400 outline-none focus:border-[#D4AF37] resize-none" /></div>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="pt-10 border-t border-white/5">
                 <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-10 flex items-center gap-4"><Globe className="text-[#D4AF37]" size={28} /> Redes Sociales</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[{ id: 'instagram', icon: Instagram, label: 'Instagram' }, { id: 'facebook', icon: Facebook, label: 'Facebook' }].map(link => (
                      <div key={link.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                         <div className="flex items-center gap-3"><link.icon size={18} className="text-[#D4AF37]" /><label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{link.label}</label></div>
                         <input type="url" placeholder="https://..." value={landingSettings.socialLinks?.[link.id as keyof SocialLinks] || ''} onChange={e => updateSocial(link.id as keyof SocialLinks, e.target.value)} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] text-white outline-none focus:border-[#D4AF37]" />
                      </div>
                    ))}
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'OPERATIONS' && landingSettings && (
            <div className="space-y-12 animate-entrance">
               <section className="bg-red-500/5 border border-red-500/20 p-10 rounded-[3rem]">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                     <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-3xl ${landingSettings.maintenanceMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-zinc-600'}`}><ShieldAlert size={32} /></div>
                        <div><h4 className="text-xl font-black text-white uppercase tracking-tighter">Modo Mantenimiento</h4><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Bloquea el acceso a clientes y agenda pública</p></div>
                     </div>
                     <button onClick={() => setLandingSettings({...landingSettings, maintenanceMode: !landingSettings.maintenanceMode})} className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${landingSettings.maintenanceMode ? 'bg-red-500 border-red-400 text-white' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}>
                        {landingSettings.maintenanceMode ? 'DESACTIVAR' : 'ACTIVAR'}
                     </button>
                  </div>
               </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
