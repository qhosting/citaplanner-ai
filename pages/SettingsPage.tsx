
import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Save, Globe, Zap, Building2, Loader2, 
  ImageIcon, Palette, Layout, Type as TypeIcon, Phone, 
  MapPin, Clock, ShieldCheck, Database, Key, BellRing, Sparkles, X, Check, Power, Eye, EyeOff, Terminal, Cpu, Cloud, Plus, Trash2, ArrowUpRight, ShieldAlert,
  Upload, Wand2, Instagram, Facebook, MessageSquare, Quote, Star, Camera, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LandingSettings, TemplateId, OperatingHours, BusinessRule, HeroSlide, LandingStat, Testimonial, SocialLinks } from '../types';
import { AIDesignCoach } from '../components/AIDesignCoach';

const TEMPLATES: {id: TemplateId, name: string, desc: string, color: string}[] = [
  { id: 'citaplanner', name: 'Citaplanner Elite', desc: 'Estética corporativa burdeos y oro.', color: '#630E14' },
  { id: 'beauty', name: 'Studio Secret Garden', desc: 'Lujo sutil en tonos rosa y oro.', color: '#8B5E66' },
  { id: 'dentist', name: 'Elite Dental Clinic', desc: 'Sofisticación clínica en azul marino.', color: '#0A192F' },
  { id: 'barber', name: 'Gentleman\'s Lounge', desc: 'Herencia masculina en verde bosque.', color: '#1B3022' },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'OPERATIONS' | 'LANDING' | 'INTEGRATION' | 'SECURITY'>('OPERATIONS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  
  const [landingSettings, setLandingSettings] = useState<LandingSettings | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const currentUploadTarget = useRef<number | null>(null);

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
      text: 'Describe aquí el valor diferencial de este servicio o concepto.'
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

  const addTestimonial = () => {
    if (!landingSettings) return;
    const newT = [...(landingSettings.testimonials || []), {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Cliente VIP',
      role: 'Partner Gold',
      quote: 'Increíble experiencia y resultados.'
    }];
    setLandingSettings({ ...landingSettings, testimonials: newT });
  };

  const updateTestimonial = (index: number, field: keyof Testimonial, value: string) => {
    if (!landingSettings || !landingSettings.testimonials) return;
    const newT = [...landingSettings.testimonials];
    newT[index] = { ...newT[index], [field]: value };
    setLandingSettings({ ...landingSettings, testimonials: newT });
  };

  const updateSocial = (field: keyof SocialLinks, value: string) => {
    if (!landingSettings) return;
    setLandingSettings({ 
      ...landingSettings, 
      socialLinks: { ...(landingSettings.socialLinks || {}), [field]: value } 
    });
  };

  const updateHours = (index: number, field: keyof OperatingHours, value: any) => {
    if (!landingSettings?.operatingHours) return;
    const newHours = [...landingSettings.operatingHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setLandingSettings({ ...landingSettings, operatingHours: newHours });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => currentUploadTarget.current !== null && handleHeroImageUpload(e, currentUploadTarget.current)} 
      />
      <input 
        type="file" 
        ref={logoInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleLogoUpload} 
      />

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
        <div className="w-full md:w-80 bg-black/40 border-r border-white/5 p-8 space-y-3">
          {[
            { id: 'OPERATIONS', label: 'Operaciones', icon: Clock },
            { id: 'GENERAL', label: 'Perfil de Negocio', icon: Building2 },
            { id: 'LANDING', label: 'Constructor Web', icon: Layout },
            { id: 'INTEGRATION', label: 'Ecosistema', icon: Zap },
            { id: 'SECURITY', label: 'Bóveda IA', icon: Key },
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
        </div>

        <div className="flex-1 p-12 overflow-y-auto max-h-[850px] custom-scrollbar bg-black/20">
          
          {activeTab === 'OPERATIONS' && landingSettings && (
            <div className="space-y-12 animate-entrance">
               <section className="bg-red-500/5 border border-red-500/20 p-10 rounded-[3rem]">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                     <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-3xl ${landingSettings.maintenanceMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-slate-600'}`}>
                           <ShieldAlert size={32} />
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-white uppercase tracking-tighter">Modo Mantenimiento Global</h4>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Desconecta el acceso a clientes y agenda pública</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setLandingSettings({...landingSettings, maintenanceMode: !landingSettings.maintenanceMode})}
                        className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${landingSettings.maintenanceMode ? 'bg-red-500 border-red-400 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                     >
                        {landingSettings.maintenanceMode ? 'DESACTIVAR PROTOCOLO' : 'ACTIVAR MANTENIMIENTO'}
                     </button>
                  </div>
               </section>

               <section>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-4">
                    <Clock className="text-[#D4AF37]" size={28} /> Horarios de Producción
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    {landingSettings?.operatingHours?.map((oh, i) => (
                      <div key={i} className={`bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-[#D4AF37]/30 transition-all ${oh.closed ? 'opacity-40' : ''}`}>
                        <div className="flex items-center gap-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${oh.closed ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              <Power size={20} className="cursor-pointer" onClick={() => updateHours(i, 'closed', !oh.closed)} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{oh.day}</p>
                              <p className="text-xl font-black text-white">{oh.closed ? 'ESTUDIO CERRADO' : `${oh.open} — ${oh.close}`}</p>
                           </div>
                        </div>
                        {!oh.closed && (
                          <div className="flex gap-4 items-center">
                             <input type="time" value={oh.open} onChange={(e) => updateHours(i, 'open', e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#D4AF37]" />
                             <span className="text-slate-700 font-black">—</span>
                             <input type="time" value={oh.close} onChange={(e) => updateHours(i, 'close', e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#D4AF37]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
               </section>
            </div>
          )}

          {activeTab === 'LANDING' && landingSettings && (
            <div className="space-y-16 animate-entrance">
              {/* BRANDING & LOGO */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <section className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                      <Sparkles size={20} className="text-[#D4AF37]" /> Identidad Visual Elite
                   </h3>
                   <div className="flex flex-col items-center gap-8">
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-48 h-48 rounded-[3rem] bg-black border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37]/50 transition-all overflow-hidden group relative"
                      >
                         {landingSettings.logoUrl ? (
                           <img src={landingSettings.logoUrl} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
                         ) : (
                           <Upload size={32} className="text-slate-700 mb-2" />
                         )}
                         {isLogoUploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" /></div>}
                      </div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Cargue su Logotipo Maestro (PNG/SVG Transparente)</p>
                   </div>
                </section>

                <div className="space-y-10">
                   <AIDesignCoach businessDesc={landingSettings.aboutText} onSuggest={(s) => setLandingSettings({...landingSettings, primaryColor: s.primary, slogan: s.slogan, aboutText: s.about})} />
                   <section className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                         <TypeIcon size={20} className="text-[#D4AF37]" /> Canales de Conversión
                      </h3>
                      <div className="space-y-8">
                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Slogan Institucional</label>
                          <input 
                            type="text" 
                            value={landingSettings.slogan} 
                            onChange={e => setLandingSettings({...landingSettings, slogan: e.target.value})}
                            className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-between bg-black/40 p-6 rounded-3xl border border-white/5">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-[#25D366]/10 text-[#25D366] rounded-xl border border-[#25D366]/20">
                                 <MessageCircle size={20} />
                              </div>
                              <div>
                                 <h4 className="text-xs font-black text-white uppercase tracking-widest">Concierge Flotante</h4>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Botón de WhatsApp directo en Landing</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => setLandingSettings({...landingSettings, showWhatsappButton: !landingSettings.showWhatsappButton})}
                             className={`w-14 h-7 rounded-full transition-all relative ${landingSettings.showWhatsappButton ? 'bg-[#D4AF37]' : 'bg-slate-800'}`}
                           >
                              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-xl ${landingSettings.showWhatsappButton ? 'left-8' : 'left-1'}`} />
                           </button>
                        </div>
                      </div>
                   </section>
                </div>
              </div>

              {/* SLIDERS */}
              <section className="pt-10 border-t border-white/5">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                       <ImageIcon className="text-[#D4AF37]" size={28} /> Hero Sliders Master
                    </h3>
                    <button onClick={addSlide} className="gold-btn px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                       <Plus size={14} /> Añadir Nodo Visual
                    </button>
                 </div>
                 <div className="grid grid-cols-1 gap-8">
                    {landingSettings.heroSlides?.map((slide, i) => (
                      <div key={i} className="glass-card p-10 rounded-[3.5rem] border-white/5 flex flex-col lg:flex-row gap-10 group relative hover:border-[#D4AF37]/30 transition-all">
                         <button onClick={() => removeSlide(i)} className="absolute top-8 right-8 p-3 text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                         <div className="w-full lg:w-80 h-64 rounded-[2.5rem] overflow-hidden border border-white/10 shrink-0 relative group/img">
                            <img src={slide.image} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700 opacity-60" alt="Preview" />
                            <button onClick={() => triggerUpload(i)} className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity">
                               {uploadingIndex === i ? <Loader2 className="animate-spin text-[#D4AF37]" size={32} /> : <Upload className="text-white mb-2" size={32} />}
                               <span className="text-[8px] font-black text-white uppercase tracking-widest">Cargar Media</span>
                            </button>
                         </div>
                         <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">URL / Ruta</label><input type="text" value={slide.image} onChange={e => updateSlide(i, 'image', e.target.value)} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] text-slate-400 outline-none focus:border-[#D4AF37] font-mono" /></div>
                            <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Cabecera</label><input type="text" value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-white outline-none focus:border-[#D4AF37] font-black uppercase" /></div>
                            <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Subtítulo</label><input type="text" value={slide.subtitle} onChange={e => updateSlide(i, 'subtitle', e.target.value)} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-[#D4AF37] outline-none focus:border-[#D4AF37] font-black uppercase" /></div>
                            <div className="md:col-span-2"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Descripción</label><textarea rows={2} value={slide.text} onChange={e => updateSlide(i, 'text', e.target.value)} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-slate-400 outline-none focus:border-[#D4AF37] resize-none" /></div>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>

              {/* SOCIAL LINKS */}
              <section className="pt-10 border-t border-white/5">
                 <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-10 flex items-center gap-4">
                    <Globe className="text-[#D4AF37]" size={28} /> Nodo de Conectividad Social
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { id: 'instagram', icon: Instagram, label: 'Instagram URL' },
                      { id: 'facebook', icon: Facebook, label: 'Facebook URL' },
                      { id: 'tiktok', icon: MessageSquare, label: 'TikTok URL' }
                    ].map(link => (
                      <div key={link.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                         <div className="flex items-center gap-3">
                            <link.icon size={18} className="text-[#D4AF37]" />
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{link.label}</label>
                         </div>
                         <input 
                           type="url" 
                           placeholder="https://..."
                           value={landingSettings.socialLinks?.[link.id as keyof SocialLinks] || ''}
                           onChange={e => updateSocial(link.id as keyof SocialLinks, e.target.value)}
                           className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-[10px] text-white outline-none focus:border-[#D4AF37]" 
                         />
                      </div>
                    ))}
                 </div>
              </section>

              {/* TESTIMONIALS */}
              <section className="pt-10 border-t border-white/5">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
                       <Quote className="text-[#D4AF37]" size={28} /> Reseñas VIP (Social Proof)
                    </h3>
                    <button onClick={addTestimonial} className="px-6 py-3 bg-white/5 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest border border-white/5 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                       <Plus size={14} /> Añadir Testimonio
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {landingSettings.testimonials?.map((t, i) => (
                      <div key={t.id} className="glass-card p-8 rounded-[3rem] border-white/5 relative group">
                         <button onClick={() => setLandingSettings({...landingSettings, testimonials: landingSettings.testimonials?.filter(item => item.id !== t.id)})} className="absolute top-6 right-6 text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                         <div className="flex gap-6 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-[#D4AF37] font-black text-xl">{t.name.charAt(0)}</div>
                            <div className="flex-grow space-y-4">
                               <input type="text" value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} className="w-full bg-transparent border-b border-white/5 text-white font-black text-sm outline-none focus:border-[#D4AF37] pb-2" placeholder="Nombre del Cliente" />
                               <input type="text" value={t.role} onChange={e => updateTestimonial(i, 'role', e.target.value)} className="w-full bg-transparent text-[9px] font-black text-[#D4AF37] uppercase tracking-widest outline-none" placeholder="Rol (Ej: Partner Gold)" />
                            </div>
                         </div>
                         <textarea 
                           rows={3} 
                           value={t.quote} 
                           onChange={e => updateTestimonial(i, 'quote', e.target.value)}
                           className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-slate-400 outline-none focus:border-[#D4AF37] resize-none leading-relaxed italic"
                           placeholder="Cita del testimonio..."
                         />
                         <div className="mt-4 flex gap-1 text-[#D4AF37]/40"><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/></div>
                      </div>
                    ))}
                 </div>
              </section>

              {/* PORTFOLIO GALLERY */}
              <section className="pt-10 border-t border-white/5 pb-20">
                 <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-10 flex items-center gap-4">
                    <Camera className="text-[#D4AF37]" size={28} /> Galería de Resultados Master
                 </h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {landingSettings.gallery?.map((img, i) => (
                      <div key={i} className="group relative aspect-square rounded-[2rem] overflow-hidden border border-white/5">
                         <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                         <button onClick={() => setLandingSettings({...landingSettings, gallery: landingSettings.gallery?.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"><Trash2 size={24}/></button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const url = window.prompt("URL de la imagen del portafolio:");
                        if (url) setLandingSettings({...landingSettings, gallery: [...(landingSettings.gallery || []), url]});
                      }}
                      className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-all"
                    >
                       <Plus size={32} />
                       <span className="text-[8px] font-black uppercase tracking-widest">Añadir Obra</span>
                    </button>
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'INTEGRATION' && landingSettings && (
            <div className="space-y-12 animate-entrance">
              <section>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-8 flex items-center gap-4">
                  <Zap className="text-[#D4AF37]" size={28} /> Nodos del Ecosistema
                </h3>
                <div className="grid grid-cols-1 gap-10">
                  <div className="bg-white/5 border border-white/5 p-10 rounded-[3.5rem] space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl"><BellRing size={24}/></div>
                        <div>
                          <h4 className="font-black text-white text-xl uppercase tracking-tighter">WAHA (WhatsApp API)</h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Motor de Notificaciones Proactivas</p>
                        </div>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="url" value={landingSettings.waha?.serverUrl} onChange={e => setLandingSettings({...landingSettings, waha: {...landingSettings.waha!, serverUrl: e.target.value}})} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-white outline-none focus:border-[#D4AF37]" placeholder="Servidor URL" />
                      <input type="text" value={landingSettings.waha?.sessionId} onChange={e => setLandingSettings({...landingSettings, waha: {...landingSettings.waha!, sessionId: e.target.value}})} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-xs text-white outline-none focus:border-[#D4AF37]" placeholder="Session ID" />
                    </div>
                  </div>
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
                      <input type="text" value={landingSettings.businessName} onChange={e => setLandingSettings({...landingSettings, businessName: e.target.value})} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white" placeholder="Nombre de Negocio" />
                      <input type="text" value={landingSettings.contactPhone || ''} onChange={e => setLandingSettings({...landingSettings, contactPhone: e.target.value})} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white" placeholder="WhatsApp Concierge" />
                    </div>
                    <textarea rows={6} value={landingSettings.address || ''} onChange={e => setLandingSettings({...landingSettings, address: e.target.value})} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl focus:border-[#D4AF37] outline-none font-bold text-white resize-none" placeholder="Ubicación" />
                  </div>
                </section>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
