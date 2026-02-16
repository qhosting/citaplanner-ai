
import React, { useState, useEffect } from 'react';
import {
    Globe, Layout, Sparkles, Save, Image as ImageIcon,
    Type, Palette, MousePointer2, Loader2, Check,
    Eye, Monitor, Smartphone, Tablet, RefreshCw,
    MessageSquare, Phone, MapPin, Share2, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LandingSettings } from '../types';

export const WebBuilderPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'DESKTOP' | 'TABLET' | 'MOBILE'>('DESKTOP');
    const [activePanel, setActivePanel] = useState<'CONTENT' | 'DESIGN' | 'PAGES'>('CONTENT');

    const [settings, setSettings] = useState<LandingSettings>({
        businessName: '',
        primaryColor: '#630E14',
        secondaryColor: '#C5A028',
        templateId: 'citaplanner',
        slogan: '',
        aboutText: '',
        address: '',
        contactPhone: '',
        heroImageUrl: '',
        organizationId: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await api.getLandingSettings();
            setSettings(data);
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
                toast.success("Ecosistema web sincronizado.");
            } else {
                toast.error("Falla en el despliegue.");
            }
        } catch (e) {
            toast.error("Error de conexión con el nodo servidor.");
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast.info("Subiendo imagen editorial...");
        const url = await api.uploadImage(file);
        if (url) {
            setSettings({ ...settings, heroImageUrl: url });
            toast.success("Imagen sincronizada.");
        } else {
            toast.error("Falla al subir imagen.");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={48} /></div>;

    return (
        <div className="h-[calc(100vh-80px)] flex bg-black overflow-hidden font-inter">
            {/* Sidebar Control Panel */}
            <div className="w-[450px] border-r border-white/5 flex flex-col bg-zinc-950">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none mb-1">Web <span className="gold-text-gradient">Architect</span></h1>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.4em]">Aurum Builder v1.0</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="gold-btn px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Cloud size={14} />}
                        Publicar
                    </button>
                </div>

                {/* Tab Selection */}
                <div className="flex p-4 gap-2 bg-black/20">
                    {[
                        { id: 'CONTENT', label: 'Estructura', icon: Layers },
                        { id: 'DESIGN', label: 'Estética', icon: Palette },
                        { id: 'PAGES', label: 'Dominios', icon: Globe },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActivePanel(tab.id as any)}
                            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${activePanel === tab.id ? 'bg-white/5 text-[#D4AF37] border border-[#D4AF37]/20' : 'text-zinc-600 hover:text-white'}`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                    {activePanel === 'CONTENT' && (
                        <div className="space-y-10 animate-entrance">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-3">
                                    <Layout size={16} /> Identidad Hero
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Título de Bienvenida</label>
                                        <input
                                            type="text"
                                            value={settings.businessName}
                                            onChange={e => setSettings({ ...settings, businessName: e.target.value })}
                                            className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-xs outline-none focus:border-[#D4AF37]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Slogan Maestro</label>
                                        <input
                                            type="text"
                                            value={settings.slogan || ''}
                                            onChange={e => setSettings({ ...settings, slogan: e.target.value })}
                                            className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-3">
                                    <ImageIcon size={16} /> Imagen Editorial Hero
                                </h3>
                                <div
                                    className="group relative w-full h-48 rounded-[2.5rem] bg-black border border-dashed border-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#D4AF37]/40 transition-all"
                                    onClick={() => document.getElementById('hero-upload')?.click()}
                                >
                                    {settings.heroImageUrl ? (
                                        <>
                                            <img src={settings.heroImageUrl} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-all duration-1000" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/60 px-6 py-2 rounded-full border border-white/20">Cambiar Imagen</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="text-zinc-800 mx-auto mb-3" size={32} />
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sincronizar Background</p>
                                        </div>
                                    )}
                                    <input type="file" id="hero-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-3">
                                    <Type size={16} /> Narrativa About
                                </h3>
                                <textarea
                                    rows={5}
                                    value={settings.aboutText || ''}
                                    onChange={e => setSettings({ ...settings, aboutText: e.target.value })}
                                    className="w-full p-6 bg-black/40 border border-white/5 rounded-[2rem] text-zinc-400 text-xs font-medium leading-relaxed outline-none focus:border-[#D4AF37] resize-none"
                                    placeholder="Cuéntanos la historia de tu negocio..."
                                />
                            </section>
                        </div>
                    )}

                    {activePanel === 'DESIGN' && (
                        <div className="space-y-12 animate-entrance">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Paleta de Identidad</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Color Maestro</label>
                                        <div className="flex gap-3">
                                            <input type="color" value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer" />
                                            <div className="flex-1 bg-black/40 rounded-xl border border-white/5 flex items-center px-4 font-mono text-[10px] text-zinc-400 uppercase">{settings.primaryColor}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Acento Gold</label>
                                        <div className="flex gap-3">
                                            <input type="color" value={settings.secondaryColor} onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })} className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer" />
                                            <div className="flex-1 bg-black/40 rounded-xl border border-white/5 flex items-center px-4 font-mono text-[10px] text-zinc-400 uppercase">{settings.secondaryColor}</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Layout & Estructura</h3>
                                <div className="space-y-3">
                                    {['citaplanner', 'aurum_minimal', 'luxury_white'].map(template => (
                                        <button
                                            key={template}
                                            onClick={() => setSettings({ ...settings, templateId: template })}
                                            className={`w-full p-5 rounded-2xl border flex items-center justify-between group transition-all ${settings.templateId === template ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-xl shadow-[#D4AF37]/10' : 'bg-black/40 border-white/5 text-zinc-500 hover:text-white'}`}
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
                                <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Configuración de Dominio</h3>
                                <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Check size={12} /> SSL Activo
                                    </p>
                                    <p className="text-xs font-bold text-white font-mono">{settings.subdomain}.citaplanner.com</p>
                                </div>
                                <button className="w-full py-4 rounded-xl bg-white/5 text-[9px] font-black uppercase text-zinc-400 border border-dashed border-white/10 hover:border-[#D4AF37]/40 hover:text-white transition-all">
                                    Vincular Dominio Propio (Pro)
                                </button>
                            </section>

                            <section className="space-y-6 pt-10 border-t border-white/5">
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Información de Contacto</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">WhatsApp / Teléfono</label>
                                        <input type="text" value={settings.contactPhone || ''} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Dirección Física</label>
                                        <input type="text" value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs" />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden">
                {/* Preview Header */}
                <div className="h-20 bg-black border-b border-white/5 flex items-center justify-between px-10">
                    <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setPreviewMode('DESKTOP')}
                            className={`p-2.5 rounded-xl transition-all ${previewMode === 'DESKTOP' ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            <Monitor size={16} />
                        </button>
                        <button
                            onClick={() => setPreviewMode('TABLET')}
                            className={`p-2.5 rounded-xl transition-all ${previewMode === 'TABLET' ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            <Tablet size={16} />
                        </button>
                        <button
                            onClick={() => setPreviewMode('MOBILE')}
                            className={`p-2.5 rounded-xl transition-all ${previewMode === 'MOBILE' ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            <Smartphone size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Simulación Real-Time</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                    </div>
                </div>

                {/* Device Frame */}
                <div className="flex-1 overflow-hidden p-12 flex justify-center bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                    <div className={`shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all duration-700 bg-white overflow-y-auto custom-scrollbar relative ${previewMode === 'DESKTOP' ? 'w-full' :
                            previewMode === 'TABLET' ? 'w-[768px] rounded-[3rem] border-[12px] border-zinc-950' :
                                'w-[375px] rounded-[4rem] border-[16px] border-zinc-950'
                        }`}>
                        {/* Actual Preview Content */}
                        <div className="flex flex-col min-h-full font-inter bg-white text-black">
                            {/* Preview Nav */}
                            <nav className="p-10 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-zinc-100">
                                <span className="font-black text-2xl tracking-tighter uppercase" style={{ color: settings.primaryColor }}>{settings.businessName || 'MY BRAND'}</span>
                                <button className="px-10 py-4 font-black text-[10px] uppercase tracking-widest text-white rounded-full shadow-2xl transition-all" style={{ backgroundColor: settings.primaryColor }}>Reservar</button>
                            </nav>

                            {/* Preview Hero */}
                            <section className="h-[600px] relative flex items-center justify-center text-center px-10 overflow-hidden bg-black">
                                {settings.heroImageUrl && (
                                    <img src={settings.heroImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
                                <div className="relative z-10 space-y-8 animate-entrance">
                                    <p className="text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.5em]">{settings.slogan || 'TU EXPERIENCIA DE LUJO'}</p>
                                    <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.9] max-w-4xl">{settings.businessName || 'Elite Beauty'}</h2>
                                    <div className="pt-10 flex gap-6 justify-center">
                                        <button className="px-12 py-5 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-widest rounded-full shadow-2xl hover:scale-105 transition-all">Ver Servicios</button>
                                        <button className="px-12 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 font-black text-xs uppercase tracking-widest rounded-full hover:bg-white/20 transition-all">Contactar</button>
                                    </div>
                                </div>
                            </section>

                            {/* Preview Footer */}
                            <div className="mt-auto p-20 bg-zinc-50 border-t border-zinc-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                                    <div className="space-y-6">
                                        <h4 className="font-black text-sm uppercase tracking-tighter">About Us</h4>
                                        <p className="text-zinc-500 text-sm leading-relaxed">{settings.aboutText || 'Nuestra esencia define la calidad...'}</p>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="font-black text-sm uppercase tracking-tighter">Contact</h4>
                                        <div className="space-y-4">
                                            <p className="flex items-center gap-4 text-zinc-500 text-sm"><Phone size={14} /> {settings.contactPhone || '+52 55...'}</p>
                                            <p className="flex items-center gap-4 text-zinc-500 text-sm"><MapPin size={14} /> {settings.address || 'Ubicación Premium'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="font-black text-sm uppercase tracking-tighter">Social</h4>
                                        <div className="flex gap-6">
                                            <span className="p-3 bg-white rounded-2xl shadow-lg border border-zinc-100 text-zinc-400 hover:text-black cursor-pointer"><Share2 size={20} /></span>
                                            <span className="p-3 bg-white rounded-2xl shadow-lg border border-zinc-100 text-zinc-400 hover:text-black cursor-pointer"><MessageSquare size={20} /></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
