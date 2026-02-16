
import React, { useState, useEffect } from 'react';
import {
    Globe, Layout, Sparkles, Save, Image as ImageIcon,
    Type, Palette, MousePointer2, Loader2, Check,
    Eye, Monitor, Smartphone, Tablet, RefreshCw,
    MessageSquare, Phone, MapPin, Share2, Layers, Search, Compass, Cloud, Instagram, Facebook, Twitter, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LandingSettings } from '../types';

export const WebBuilderPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'DESKTOP' | 'TABLET' | 'MOBILE'>('DESKTOP');
    const [activePanel, setActivePanel] = useState<'CONTENT' | 'DESIGN' | 'PAGES' | 'SEO'>('CONTENT');

    const [settings, setSettings] = useState<LandingSettings>({
        businessName: '',
        primaryColor: '#630E14',
        secondaryColor: '#C5A028',
        templateId: 'citaplanner' as any,
        slogan: '',
        aboutText: '',
        address: '',
        contactPhone: '',
        heroImageUrl: '',
        organizationId: '',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        whatsappPhone: '',
        footerText: '',
        latitude: undefined,
        longitude: undefined,
        socialInstagram: '',
        socialFacebook: '',
        socialTwitter: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await api.getLandingSettings();
            setSettings({
                ...data,
                seoTitle: data.seoTitle || '',
                seoDescription: data.seoDescription || '',
                seoKeywords: data.seoKeywords || '',
                whatsappPhone: data.whatsappPhone || data.contactPhone || '',
                footerText: data.footerText || '',
                socialInstagram: data.socialInstagram || '',
                socialFacebook: data.socialFacebook || '',
                socialTwitter: data.socialTwitter || ''
            });
        } catch (e) {
            toast.error("Error al cargar configuración web.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const success = await api.updateLandingSettings(settings);
            if (success) {
                toast.success("Ecosistema web sincronizado y publicado.");
            } else {
                toast.error("Falla en el despliegue del nodo web.");
            }
        } catch (e) {
            toast.error("Error de conexión con el nodo servidor.");
        } finally {
            setSaving(false);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImageUrl' | 'logoUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast.info("Transfiriendo activo digital...");
        const url = await api.uploadImage(file);
        if (url) {
            setSettings({ ...settings, [field]: url });
            toast.success("Activo sincronizado.");
        } else {
            toast.error("Falla al subir imagen.");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-main"><Loader2 className="animate-spin text-[#CE4676]" size={48} /></div>;

    return (
        <div className="h-[calc(100vh-80px)] flex bg-main overflow-hidden font-inter">
            {/* Sidebar Control Panel */}
            <div className="w-[480px] border-r border-theme flex flex-col bg-card-theme">
                <div className="p-10 border-b border-theme flex justify-between items-center bg-input-theme">
                    <div>
                        <h1 className="text-2xl font-black text-main tracking-tighter uppercase leading-none mb-1">Web <span className="bugambilia-text-gradient">Architect</span></h1>
                        <p className="text-[9px] text-muted font-bold uppercase tracking-[0.4em]">Aurum Builder v1.2 • Pro Edition</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bugambilia-btn px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Cloud size={14} />}
                        Publicar
                    </button>
                </div>

                {/* Tab Selection */}
                <div className="grid grid-cols-4 p-4 gap-2 bg-input-theme">
                    {[
                        { id: 'CONTENT', label: 'Estructura', icon: Layers },
                        { id: 'DESIGN', label: 'Estética', icon: Palette },
                        { id: 'PAGES', label: 'Global', icon: Globe },
                        { id: 'SEO', label: 'SEO', icon: Search },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActivePanel(tab.id as any)}
                            className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${activePanel === tab.id ? 'bg-card text-[#CE4676] border border-[#CE4676]/20 shadow-lg' : 'text-muted hover:text-main'}`}
                        >
                            <tab.icon size={14} />
                            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                    {activePanel === 'CONTENT' && (
                        <div className="space-y-10 animate-entrance">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Layout size={16} /> Identidad Hero
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Título de Bienvenida</label>
                                        <input
                                            type="text"
                                            value={settings.businessName}
                                            onChange={e => setSettings({ ...settings, businessName: e.target.value })}
                                            className="w-full p-5 bg-input-theme text-main font-black text-xs outline-none focus:ring-1 ring-[#CE4676]/30 border border-theme rounded-2xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Slogan Maestro</label>
                                        <input
                                            type="text"
                                            value={settings.slogan || ''}
                                            onChange={e => setSettings({ ...settings, slogan: e.target.value })}
                                            className="w-full p-5 bg-input-theme text-main font-bold text-xs outline-none focus:ring-1 ring-[#CE4676]/30 border border-theme rounded-2xl"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Sparkles size={16} /> Identidad Gráfica (Logo)
                                </h3>
                                <div
                                    className="group relative w-32 h-32 rounded-full bg-input-theme border border-dashed border-theme overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#CE4676]/40 transition-all mx-auto"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                >
                                    {settings.logoUrl ? (
                                        <>
                                            <img src={settings.logoUrl} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-all duration-300" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <RefreshCw className="text-white" size={16} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <Sparkles className="text-muted mx-auto" size={20} />
                                        </div>
                                    )}
                                    <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={(e) => handleMediaUpload(e, 'logoUrl')} />
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <ImageIcon size={16} /> Imagen Editorial
                                </h3>
                                <div
                                    className="group relative w-full h-48 rounded-[2.5rem] bg-input-theme border border-dashed border-theme overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#CE4676]/40 transition-all"
                                    onClick={() => document.getElementById('hero-upload')?.click()}
                                >
                                    {settings.heroImageUrl ? (
                                        <>
                                            <img src={settings.heroImageUrl} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-all duration-1000" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/60 px-6 py-2 rounded-full border border-white/20">Sustituir Activo</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="text-muted mx-auto mb-3" size={32} />
                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest">Cargar Multimedia</p>
                                        </div>
                                    )}
                                    <input type="file" id="hero-upload" className="hidden" accept="image/*" onChange={(e) => handleMediaUpload(e, 'heroImageUrl')} />
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Type size={16} /> Narrativa 'About'
                                </h3>
                                <textarea
                                    rows={5}
                                    value={settings.aboutText || ''}
                                    onChange={e => setSettings({ ...settings, aboutText: e.target.value })}
                                    className="w-full p-6 bg-input-theme text-main text-xs font-medium leading-relaxed outline-none focus:ring-1 ring-[#CE4676]/30 border border-theme rounded-[2rem] resize-none"
                                />
                            </section>
                        </div>
                    )}

                    {activePanel === 'DESIGN' && (
                        <div className="space-y-12 animate-entrance">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest">Branding Visual</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[8px] font-black text-muted uppercase tracking-widest block ml-1">Color Maestro</label>
                                        <div className="flex gap-3">
                                            <input type="color" value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer" />
                                            <div className="flex-1 bg-input-theme rounded-xl border border-theme flex items-center px-4 font-mono text-[10px] text-muted uppercase">{settings.primaryColor}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[8px] font-black text-muted uppercase tracking-widest block ml-1">Color Acento</label>
                                        <div className="flex gap-3">
                                            <input type="color" value={settings.secondaryColor} onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })} className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer" />
                                            <div className="flex-1 bg-input-theme rounded-xl border border-theme flex items-center px-4 font-mono text-[10px] text-muted uppercase">{settings.secondaryColor}</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest">Layout de Red</h3>
                                <div className="space-y-3">
                                    {['citaplanner', 'aurum_minimal', 'luxury_white', 'shula_dark'].map(template => (
                                        <button
                                            key={template}
                                            onClick={() => setSettings({ ...settings, templateId: template as any })}
                                            className={`w-full p-5 rounded-2xl border flex items-center justify-between group transition-all ${settings.templateId === template ? 'bg-[#CE4676] border-[#CE4676] text-white shadow-xl' : 'bg-input-theme border-theme text-muted hover:text-main'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{template.replace('_', ' ')}</span>
                                            {settings.templateId === template && <CheckCircle2 size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activePanel === 'PAGES' && (
                        <div className="space-y-10 animate-entrance">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest">Punto de Acceso (URL)</h3>
                                <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[2rem]">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Check size={12} /> Certificado SSL/TLS Operativo
                                    </p>
                                    <p className="text-xs font-bold text-main font-mono break-all">{settings.subdomain || 'demo'}.citaplanner.com</p>
                                </div>
                            </section>

                            <section className="space-y-6 pt-10 border-t border-theme">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Phone size={16} /> Contact Hub
                                </h3>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1 mb-2 block">WhatsApp Flotante</label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                            <input type="tel" placeholder="+52..." value={settings.whatsappPhone || ''} onChange={e => setSettings({ ...settings, whatsappPhone: e.target.value })} className="w-full pl-14 pr-5 py-5 bg-input-theme border border-theme rounded-2xl text-main font-bold text-xs focus:ring-1 ring-emerald-500/30" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1 mb-2 block">Dirección Matriz</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                            <input type="text" value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} className="w-full pl-14 pr-5 py-5 bg-input-theme border border-theme rounded-2xl text-main font-bold text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6 pt-10 border-t border-theme">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Share2 size={16} /> Footer & Redes
                                </h3>
                                <div className="space-y-4">
                                    <textarea placeholder="Texto legal o créditos del footer..." rows={3} value={settings.footerText || ''} onChange={e => setSettings({ ...settings, footerText: e.target.value })} className="w-full p-5 bg-input-theme border border-theme rounded-2xl text-main text-xs font-medium resize-none" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                            <input placeholder="Instagram" type="text" value={settings.socialInstagram || ''} onChange={e => setSettings({ ...settings, socialInstagram: e.target.value })} className="w-full pl-11 pr-4 py-4 bg-input-theme border border-theme rounded-xl text-main text-[10px]" />
                                        </div>
                                        <div className="relative">
                                            <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                            <input placeholder="Facebook" type="text" value={settings.socialFacebook || ''} onChange={e => setSettings({ ...settings, socialFacebook: e.target.value })} className="w-full pl-11 pr-4 py-4 bg-input-theme border border-theme rounded-xl text-main text-[10px]" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activePanel === 'SEO' && (
                        <div className="space-y-10 animate-entrance">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Search size={16} /> Meta-Inteligencia (SEO)
                                </h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Meta-Título (Navegador)</label>
                                        <input type="text" placeholder="Ej: Beauty Studio • El Mejor Servicio en México" value={settings.seoTitle || ''} onChange={e => setSettings({ ...settings, seoTitle: e.target.value })} className="w-full p-5 bg-input-theme border border-theme rounded-2xl text-main font-black text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Meta-Descripción (Google)</label>
                                        <textarea rows={4} placeholder="Descripción que aparece en resultados de búsqueda..." value={settings.seoDescription || ''} onChange={e => setSettings({ ...settings, seoDescription: e.target.value })} className="w-full p-5 bg-input-theme border border-theme rounded-2xl text-main text-xs font-medium resize-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Keywords (SEO Keywords)</label>
                                        <input type="text" placeholder="belleza, studio, citas, polanco, lujo..." value={settings.seoKeywords || ''} onChange={e => setSettings({ ...settings, seoKeywords: e.target.value })} className="w-full p-5 bg-input-theme border border-theme rounded-2xl text-main text-xs" />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6 pt-10 border-t border-theme">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Compass size={16} /> Geolocalización (Mapas)
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Latitud</label>
                                        <input type="number" step="any" placeholder="19.4326" value={settings.latitude || ''} onChange={e => setSettings({ ...settings, latitude: parseFloat(e.target.value) })} className="w-full p-5 bg-input-theme border border-theme rounded-2xl text-main text-xs font-mono" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Longitud</label>
                                        <input type="number" step="any" placeholder="-99.1332" value={settings.longitude || ''} onChange={e => setSettings({ ...settings, longitude: parseFloat(e.target.value) })} className="w-full p-5 bg-input-theme border border-theme rounded-2xl text-main text-xs font-mono" />
                                    </div>
                                </div>
                                <p className="text-[8px] text-muted font-bold uppercase tracking-widest">Utilizado para posicionamiento en Google Maps y SEO local.</p>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex flex-col bg-main overflow-hidden">
                {/* Preview Header */}
                <div className="h-20 bg-card-theme border-b border-theme flex items-center justify-between px-10">
                    <div className="flex bg-input-theme p-1.5 rounded-2xl border border-theme">
                        <button onClick={() => setPreviewMode('DESKTOP')} className={`p-2.5 rounded-xl transition-all ${previewMode === 'DESKTOP' ? 'bg-card text-main' : 'text-muted hover:text-main'}`}><Monitor size={16} /></button>
                        <button onClick={() => setPreviewMode('TABLET')} className={`p-2.5 rounded-xl transition-all ${previewMode === 'TABLET' ? 'bg-card text-main' : 'text-muted hover:text-main'}`}><Tablet size={16} /></button>
                        <button onClick={() => setPreviewMode('MOBILE')} className={`p-2.5 rounded-xl transition-all ${previewMode === 'MOBILE' ? 'bg-card text-main' : 'text-muted hover:text-main'}`}><Smartphone size={16} /></button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">Vista Previa Proyectada</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>

                {/* Device Frame */}
                <div className="flex-1 overflow-hidden p-12 flex justify-center bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                    <div className={`shadow-2xl transition-all duration-700 bg-white overflow-y-auto custom-scrollbar relative ${previewMode === 'DESKTOP' ? 'w-full' :
                        previewMode === 'TABLET' ? 'w-[768px] rounded-[3rem] border-[12px] border-zinc-950' :
                            'w-[375px] rounded-[4rem] border-[16px] border-zinc-950'
                        }`}>

                        {/* Mock Website Content */}
                        <div className={`flex flex-col min-h-full ${settings.templateId === 'shula_dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
                            <nav className={`p-8 flex justify-between items-center backdrop-blur-md sticky top-0 z-10 border-b ${settings.templateId === 'shula_dark' ? 'bg-zinc-950/80 border-white/10' : 'bg-white/80 border-zinc-100'}`}>
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} className="h-10 object-contain" alt="Logo" />
                                ) : (
                                    <span className="font-black text-2xl tracking-tighter uppercase" style={{ color: settings.primaryColor }}>{settings.businessName || 'BRAND'}</span>
                                )}
                                <div className={`hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest ${settings.templateId === 'shula_dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    <span>Home</span>
                                    <span>Servicios</span>
                                    <span>Nosotros</span>
                                </div>
                                <button className="px-8 py-3 font-black text-[9px] uppercase tracking-widest text-white rounded-full shadow-lg" style={{ backgroundColor: settings.primaryColor }}>Reservar</button>
                            </nav>

                            <section className="h-[550px] relative flex items-center justify-center text-center px-10 overflow-hidden bg-black">
                                {settings.heroImageUrl && <img src={settings.heroImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                <div className="relative z-10 space-y-6 max-w-3xl">
                                    <p className="text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.5em]">{settings.slogan || 'TU EXPERIENCIA DE LUJO'}</p>
                                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">{settings.businessName || 'Elite Beauty'}</h2>
                                    <div className="pt-8 flex gap-5 justify-center">
                                        <button className="px-10 py-4 bg-[#D4AF37] text-black font-black text-[10px] uppercase tracking-widest rounded-full shadow-xl">Agendar Cita</button>
                                        <button className="px-10 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-black text-[10px] uppercase tracking-widest rounded-full">Contactar</button>
                                    </div>
                                </div>
                            </section>

                            <section className="p-20 space-y-12">
                                <div className="flex flex-col items-center text-center space-y-6">
                                    <div className="w-12 h-1 bg-[#D4AF37]" />
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">Nuestra Esencia</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl">{settings.aboutText || 'Expertos en realzar tu belleza natural con técnicas de vanguardia y atención personalizada.'}</p>
                                </div>
                            </section>

                            <footer className={`mt-auto p-16 ${settings.templateId === 'shula_dark' ? 'bg-black border-t border-white/10' : 'bg-zinc-950 text-white'}`}>
                                <div className={`grid grid-cols-1 md:grid-cols-3 gap-12 border-b pb-16 ${settings.templateId === 'shula_dark' ? 'border-white/10' : 'border-white/5'}`}>
                                    <div className="space-y-6">
                                        <h4 className="font-black text-xs uppercase tracking-widest text-[#D4AF37]">{settings.businessName}</h4>
                                        <p className="text-zinc-500 text-xs leading-relaxed">{settings.footerText || 'Experimenta el estándar de oro en gestión de servicios y belleza.'}</p>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="font-black text-xs uppercase tracking-widest text-[#D4AF37]">Ubicación</h4>
                                        <p className="text-zinc-400 text-xs flex gap-3 items-start"><MapPin size={14} className="mt-1" /> {settings.address || 'Ubicación Central'}</p>
                                        <p className="text-zinc-400 text-xs flex gap-3 items-center"><Phone size={14} /> {settings.contactPhone || '+52...'}</p>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="font-black text-xs uppercase tracking-widest text-[#D4AF37]">Redes</h4>
                                        <div className="flex gap-4">
                                            {settings.socialInstagram && <Instagram size={18} className="text-zinc-500 hover:text-[#D4AF37] cursor-pointer" />}
                                            {settings.socialFacebook && <Facebook size={18} className="text-zinc-500 hover:text-[#D4AF37] cursor-pointer" />}
                                            {settings.socialTwitter && <Twitter size={18} className="text-zinc-500 hover:text-[#D4AF37] cursor-pointer" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 flex justify-between items-center">
                                    <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">© 2026 {settings.businessName} • Powered by Aurum</p>
                                    <div className="flex gap-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                        <span>Privacidad</span>
                                        <span>Términos</span>
                                    </div>
                                </div>
                            </footer>

                            {/* Floating WhatsApp Button Mockup */}
                            <div className="fixed bottom-10 right-10 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 cursor-pointer hover:scale-110 transition-all z-50">
                                <MessageSquare size={24} />
                                <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
