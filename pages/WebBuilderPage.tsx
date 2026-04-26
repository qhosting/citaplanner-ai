
import React, { useState, useEffect } from 'react';
import {
    Globe, Layout, Sparkles, Save, Image as ImageIcon,
    Type, Palette, MousePointer2, Loader2, Check,
    Eye, Monitor, Smartphone, Tablet, RefreshCw,
    MessageSquare, Phone, MapPin, Share2, Layers, Search, Compass, Cloud, Instagram, Facebook, Twitter, CheckCircle2,
    ArrowRight, Star, Plus, Trash2, GripVertical, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LandingSettings } from '../types';

export const WebBuilderPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'DESKTOP' | 'TABLET' | 'MOBILE'>('DESKTOP');
    const [activePanel, setActivePanel] = useState<'CONTENT' | 'DESIGN' | 'PAGES' | 'SEO'>('CONTENT');
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

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
        socialTwitter: '',
        serviceIds: [],
        productIds: []
    });

    const [productionServices, setProductionServices] = useState<any[]>([]);
    const [productionProducts, setProductionProducts] = useState<any[]>([]);

    // Sync preview with settings in real-time
    useEffect(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'LANDING_PREVIEW_UPDATE',
                settings: settings
            }, '*');
        }
    }, [settings]);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const [data, servicesList, productsList] = await Promise.all([
                api.getLandingSettings(),
                api.getServices(),
                api.getProducts()
            ]);
            
            setSettings({
                ...data,
                businessName: data.businessName || '',
                primaryColor: data.primaryColor || '#630E14',
                secondaryColor: data.secondaryColor || '#C5A028',
                templateId: data.templateId || 'citaplanner',
                seoTitle: data.seoTitle || '',
                seoDescription: data.seoDescription || '',
                seoKeywords: data.seoKeywords || '',
                whatsappPhone: data.whatsappPhone || '',
                contactPhone: data.contactPhone || '',
                footerText: data.footerText || '',
                socialInstagram: data.socialInstagram || '',
                socialFacebook: data.socialFacebook || '',
                socialTwitter: data.socialTwitter || '',
                serviceIds: data.serviceIds || [],
                productIds: data.productIds || []
            });
            setProductionServices(servicesList);
            setProductionProducts(productsList);
        } catch (e) {
            toast.error("Error al cargar configuración web.");
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateChange = (tid: string) => {
        const presets: Record<string, { primary: string; secondary: string }> = {
            citaplanner: { primary: '#4f46e5', secondary: '#f472b6' }, // Space Indigo/Pink
            master: { primary: '#0f172a', secondary: '#10b981' }, // Corporate Slate/Emerald
            shulastudio: { primary: '#D4AF37', secondary: '#050505' }, // Luxury Gold/Black
            aurum_minimal: { primary: '#18181b', secondary: '#f4f4f5' },
            luxury_white: { primary: '#C5A028', secondary: '#ffffff' },
            shula_dark: { primary: '#D4AF37', secondary: '#09090b' }
        };

        const theme = presets[tid];
        if (theme) {
            setSettings(prev => ({
                ...prev,
                templateId: tid as any,
                primaryColor: theme.primary,
                secondaryColor: theme.secondary
            }));
            toast.info(`Estructura visual de ${tid} aplicada.`);
        } else {
            setSettings(prev => ({ ...prev, templateId: tid as any }));
        }
    };

    const loadDemoData = () => {
        const tid = settings.templateId;
        const demoData: Record<string, Partial<LandingSettings>> = {
            citaplanner: {
                slogan: 'Tu negocio, en piloto automático.',
                aboutText: 'La plataforma más avanzada para la gestión de citas, clientes y operaciones. Diseñada para centros de belleza que buscan escalar con Inteligencia Artificial.',
                address: 'Silicon Valley Innovation Hub, CA',
                footerText: '© 2024 CitaPlanner AI. Redefiniendo la gestión de belleza.',
                socialInstagram: 'citaplanner_ai',
                stats: [
                    { label: 'Uptime', value: '99.9%' },
                    { label: 'Estudios', value: '1.2k+' },
                    { label: 'Citas Hoy', value: '8.5k+' }
                ]
            },
            master: {
                slogan: 'Excelencia Operativa Centralizada.',
                aboutText: 'Lideramos la red de salones más prestigiosa del país. Ofrecemos una experiencia consistente, profesional y de alta calidad en cada una de nuestras 12 sucursales.',
                address: 'Av. Corporativa 500, Distrito Financiero',
                footerText: '© 2024 Master Beauty Group. Calidad certificada.',
                stats: [
                    { label: 'Sucursales', value: '12' },
                    { label: 'Especialistas', value: '150+' },
                    { label: 'Satisfacción', value: '4.9/5' }
                ]
            },
            shulastudio: {
                slogan: 'Donde el arte se encuentra con la elegancia.',
                aboutText: 'Especializados en la arquitectura de la mirada y el cuidado premium de la piel. En Shula Studio, cada tratamiento es un ritual de belleza diseñado para potenciar tu identidad.',
                address: 'Luxury Plaza L8, Zona Esmeralda',
                footerText: '© 2024 Shula Studio. The Art of Luxury Beauty.',
                socialInstagram: 'shula.studio_official',
                stats: [
                    { label: 'Años', value: '8+' },
                    { label: 'Clientes VIP', value: '500+' },
                    { label: 'Certificados', value: '25' }
                ]
            }
        };

        const data = demoData[tid as string] || demoData.citaplanner;
        setSettings(prev => ({
            ...prev,
            ...data
        }));
        toast.success("Datos demo inyectados correctamente.");
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

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImageUrl' | 'logoUrl' | 'heroVideoUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isVideo = file.type.startsWith('video/');
        toast.info(isVideo ? "Transfiriendo video de alta resolución..." : "Transfiriendo activo digital...");
        
        const url = await api.uploadImage(file);
        if (url) {
            setSettings({ ...settings, [field]: url });
            toast.success("Activo sincronizado.");
        } else {
            toast.error("Falla al subir archivo.");
        }
    };

    // Derive accent colors from settings for the preview
    const accent = settings.primaryColor || '#630E14';
    const accentSecondary = settings.secondaryColor || '#C5A028';
    const isDarkTemplate = settings.templateId === 'shula_dark';

    if (loading) return <div className="h-screen flex items-center justify-center bg-main"><Loader2 className="animate-spin text-[#CE4676]" size={48} /></div>;

    return (
        <div className="h-[calc(100vh-80px)] flex bg-main overflow-hidden font-inter">
            {/* Sidebar Control Panel */}
            <div className="w-[480px] border-r border-theme flex flex-col bg-card-theme">
                <div className="p-6 border-b border-theme flex justify-between items-center bg-input-theme">
                    <div>
                        <h1 className="text-2xl font-black text-main tracking-tighter uppercase leading-none mb-1">Web <span className="bugambilia-text-gradient">Architect</span></h1>
                        <p className="text-[9px] text-muted font-bold uppercase tracking-[0.4em]">Aurum Builder v2.0 • Pro Edition</p>
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
                <div className="grid grid-cols-4 p-3 gap-2 bg-input-theme">
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

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {activePanel === 'CONTENT' && (
                        <div className="space-y-8 animate-entrance">
                            {/* Maintenance Toggle */}
                            <section className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-[2.5rem] space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                                            <ShieldAlert size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500">Modo Mantenimiento</h4>
                                            <p className="text-[8px] text-muted font-bold uppercase tracking-widest">Bloquear acceso público</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-zinc-800'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.maintenanceMode ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            </section>

                            {/* Hero Section */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Layout size={16} /> Identidad Hero
                                </h3>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Nombre del Negocio</label>
                                        <input
                                            type="text"
                                            value={settings.businessName}
                                            onChange={e => setSettings({ ...settings, businessName: e.target.value })}
                                            placeholder="Ej: Shula Studio"
                                            className="w-full p-4 bg-input-theme text-main font-black text-xs outline-none focus:ring-1 ring-[#CE4676]/30 border border-theme rounded-2xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-2">Slogan</label>
                                        <input
                                            type="text"
                                            value={settings.slogan || ''}
                                            onChange={e => setSettings({ ...settings, slogan: e.target.value })}
                                            placeholder="Ej: Elegancia en cada detalle"
                                            className="w-full p-4 bg-input-theme text-main font-bold text-xs outline-none focus:ring-1 ring-[#CE4676]/30 border border-theme rounded-2xl"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Logo Upload */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Sparkles size={16} /> Logo
                                </h3>
                                <div
                                    className="group relative w-28 h-28 rounded-2xl bg-input-theme border border-dashed border-theme overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#CE4676]/40 transition-all mx-auto"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                >
                                    {settings.logoUrl ? (
                                        <>
                                            <img src={settings.logoUrl} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-all duration-300" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                                <RefreshCw className="text-white" size={16} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <Sparkles className="text-muted mx-auto" size={20} />
                                            <p className="text-[8px] text-muted mt-1 font-bold">Subir Logo</p>
                                        </div>
                                    )}
                                    <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={(e) => handleMediaUpload(e, 'logoUrl')} />
                                </div>
                            </section>

                            {/* Hero Image */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <ImageIcon size={16} /> Imagen Hero Principal
                                </h3>
                                <div
                                    className="group relative w-full h-40 rounded-2xl bg-input-theme border border-dashed border-theme overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#CE4676]/40 transition-all"
                                    onClick={() => document.getElementById('hero-upload')?.click()}
                                >
                                    {settings.heroImageUrl ? (
                                        <>
                                            <img src={settings.heroImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/60 px-6 py-2 rounded-full border border-white/20">Cambiar Imagen</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="text-muted mx-auto mb-2" size={28} />
                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest">Cargar Hero</p>
                                        </div>
                                    )}
                                    <input type="file" id="hero-upload" className="hidden" accept="image/*" onChange={(e) => handleMediaUpload(e, 'heroImageUrl')} />
                                </div>
                            </section>

                            {/* Hero Video (NEW) */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                                    <Monitor size={16} /> Video Background (Opcional)
                                </h3>
                                <div
                                    className="group relative w-full h-40 rounded-2xl bg-input-theme border border-dashed border-theme overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-400/40 transition-all"
                                    onClick={() => document.getElementById('video-upload')?.click()}
                                >
                                    {settings.heroVideoUrl ? (
                                        <>
                                            <video src={settings.heroVideoUrl} className="w-full h-full object-cover opacity-50" muted loop autoPlay playsInline />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest bg-indigo-600 px-6 py-2 rounded-full border border-white/20">Cambiar Video</span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSettings({...settings, heroVideoUrl: ''}); }}
                                                    className="mt-2 text-[8px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest"
                                                >
                                                    Eliminar Video
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <Monitor className="text-muted mx-auto mb-2" size={28} />
                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest">Cargar Video (MP4)</p>
                                            <p className="text-[7px] text-muted font-bold uppercase mt-1">Recomendado: Loop corto < 10MB</p>
                                        </div>
                                    )}
                                    <input type="file" id="video-upload" className="hidden" accept="video/mp4,video/webm" onChange={(e) => handleMediaUpload(e, 'heroVideoUrl')} />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Type size={16} /> Acerca de Nosotros
                                </h3>
                                <textarea
                                    rows={4}
                                    value={settings.aboutText || ''}
                                    onChange={e => setSettings({ ...settings, aboutText: e.target.value })}
                                    placeholder="Describe tu negocio para los clientes..."
                                    className="w-full p-4 bg-input-theme text-main text-xs font-medium leading-relaxed outline-none focus:ring-1 ring-[#CE4676]/30 border border-theme rounded-2xl resize-none"
                                />
                            </section>

                            {/* Services & Products Selection */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                        <Sparkles size={16} /> Servicios en Landing (Producción)
                                    </h3>
                                    <span className="text-[8px] font-black text-muted uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded-full">
                                        {settings.serviceIds?.length || 0} Seleccionados
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {productionServices.length === 0 && (
                                        <p className="text-[9px] text-muted italic text-center py-4">No hay servicios creados en producción.</p>
                                    )}
                                    {productionServices.map((service) => {
                                        const isSelected = settings.serviceIds?.includes(service.id);
                                        return (
                                            <div
                                                key={service.id}
                                                onClick={() => {
                                                    const currentIds = settings.serviceIds || [];
                                                    const newIds = isSelected 
                                                        ? currentIds.filter(id => id !== service.id)
                                                        : [...currentIds, service.id];
                                                    setSettings({ ...settings, serviceIds: newIds });
                                                }}
                                                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'bg-[#CE4676]/10 border-[#CE4676]' : 'bg-input-theme border-theme hover:border-muted'}`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[10px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-[#CE4676]' : 'text-main'}`}>{service.name}</p>
                                                    <p className="text-[8px] text-muted font-bold">${service.price} • {service.duration} min</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#CE4676] border-[#CE4676]' : 'border-theme'}`}>
                                                    {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                        <Layers size={16} /> Productos en Landing (Producción)
                                    </h3>
                                    <span className="text-[8px] font-black text-muted uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded-full">
                                        {settings.productIds?.length || 0} Seleccionados
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {productionProducts.length === 0 && (
                                        <p className="text-[9px] text-muted italic text-center py-4">No hay productos creados en producción.</p>
                                    )}
                                    {productionProducts.map((product) => {
                                        const isSelected = settings.productIds?.includes(product.id);
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => {
                                                    const currentIds = settings.productIds || [];
                                                    const newIds = isSelected 
                                                        ? currentIds.filter(id => id !== product.id)
                                                        : [...currentIds, product.id];
                                                    setSettings({ ...settings, productIds: newIds });
                                                }}
                                                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'bg-[#CE4676]/10 border-[#CE4676]' : 'bg-input-theme border-theme hover:border-muted'}`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[10px] font-black uppercase tracking-tight truncate ${isSelected ? 'text-[#CE4676]' : 'text-main'}`}>{product.name}</p>
                                                    <p className="text-[8px] text-muted font-bold">${product.price} • {product.category}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#CE4676] border-[#CE4676]' : 'border-theme'}`}>
                                                    {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Gallery */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <ImageIcon size={16} /> Galería Visual
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(settings.images || []).map((img, index) => (
                                        <div key={index} className="aspect-square bg-input-theme border border-theme rounded-xl overflow-hidden relative group">
                                            <img src={img.url} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => {
                                                    const newImages = [...(settings.images || [])];
                                                    newImages.splice(index, 1);
                                                    setSettings({ ...settings, images: newImages });
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <div
                                        onClick={() => document.getElementById('gallery-upload')?.click()}
                                        className="aspect-square bg-input-theme border border-dashed border-theme rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#CE4676] hover:text-[#CE4676] transition-all"
                                    >
                                        <Cloud size={18} className="mb-1 text-muted" />
                                        <span className="text-[8px] font-black text-muted uppercase tracking-widest">Subir</span>
                                    </div>
                                    <input
                                        type="file"
                                        id="gallery-upload"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const files = e.target.files;
                                            if (!files) return;
                                            toast.info(`Subiendo ${files.length} imágenes...`);
                                            const newImages = [...(settings.images || [])];
                                            for (let i = 0; i < files.length; i++) {
                                                const url = await api.uploadImage(files[i]);
                                                if (url) newImages.push({ url });
                                            }
                                            setSettings({ ...settings, images: newImages });
                                            toast.success("Galería actualizada.");
                                        }}
                                    />
                                </div>
                            </section>
                        </div>
                    )}

                    {activePanel === 'DESIGN' && (
                        <div className="space-y-8 animate-entrance">
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest">Paleta de Colores</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-muted uppercase tracking-widest block ml-1">Color Principal</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="color" value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer" />
                                            <div className="flex-1 bg-input-theme rounded-xl border border-theme flex items-center px-3 h-10 font-mono text-[10px] text-muted uppercase">{settings.primaryColor}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-muted uppercase tracking-widest block ml-1">Color Acento</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="color" value={settings.secondaryColor || '#C5A028'} onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })} className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer" />
                                            <div className="flex-1 bg-input-theme rounded-xl border border-theme flex items-center px-3 h-10 font-mono text-[10px] text-muted uppercase">{settings.secondaryColor}</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Color Preview */}
                                <div className="flex gap-2 p-3 bg-input-theme rounded-2xl border border-theme">
                                    <div className="flex-1 h-8 rounded-lg" style={{ backgroundColor: accent }} />
                                    <div className="flex-1 h-8 rounded-lg" style={{ backgroundColor: accentSecondary }} />
                                    <div className="flex-1 h-8 rounded-lg bg-black" />
                                    <div className="flex-1 h-8 rounded-lg bg-white border border-zinc-200" />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest">Plantilla Visual</h3>
                                    <button
                                        onClick={loadDemoData}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border border-indigo-500/20 active:scale-95"
                                    >
                                        <Sparkles size={10} /> Inyectar Demo
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { id: 'citaplanner', label: 'CitaPlanner SaaS', desc: 'Space / Tech Edition' },
                                        { id: 'master', label: 'Master Hub', desc: 'Central / Corporate' },
                                        { id: 'shulastudio', label: 'Shula Studio', desc: 'Luxury / Beauty' },
                                    ].map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleTemplateChange(template.id)}
                                            className={`w-full p-4 rounded-2xl border flex items-center justify-between group transition-all ${settings.templateId === template.id ? 'border-[#CE4676] shadow-xl' : 'bg-input-theme border-theme text-muted hover:text-main hover:bg-input-theme/50'}`}
                                            style={settings.templateId === template.id ? { backgroundColor: `${accent}15`, borderColor: accent } : {}}
                                        >
                                            <div className="text-left">
                                                <span className="text-[10px] font-black uppercase tracking-widest block" style={settings.templateId === template.id ? { color: accent } : {}}>{template.label}</span>
                                                <span className="text-[8px] text-muted font-bold opacity-70 italic">{template.desc}</span>
                                            </div>
                                            {settings.templateId === template.id && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
                                                    <CheckCircle2 size={16} style={{ color: accent }} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[8px] text-muted text-center px-4 leading-relaxed mt-2 italic font-medium uppercase tracking-widest">Al cambiar de plantilla, los colores se ajustarán automáticamente a la paleta recomendada.</p>
                            </section>
                        </div>
                    )}

                    {activePanel === 'PAGES' && (
                        <div className="space-y-8 animate-entrance">
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest">URL Activa</h3>
                                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                        <Check size={12} /> Certificado SSL Activo
                                    </p>
                                    <p className="text-xs font-bold text-main font-mono break-all">{settings.subdomain || 'demo'}.citaplanner.com</p>
                                </div>
                            </section>

                            <section className="space-y-4 pt-6 border-t border-theme">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Phone size={16} /> Contacto
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1 mb-1 block">Teléfono de Contacto</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                            <input type="tel" placeholder="+52 55 1234 5678" value={settings.contactPhone || ''} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} className="w-full pl-12 pr-4 py-4 bg-input-theme border border-theme rounded-2xl text-main font-bold text-xs focus:ring-1 ring-[#CE4676]/30" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1 mb-1 block">WhatsApp Flotante</label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                            <input type="tel" placeholder="+52 55..." value={settings.whatsappPhone || ''} onChange={e => setSettings({ ...settings, whatsappPhone: e.target.value })} className="w-full pl-12 pr-4 py-4 bg-input-theme border border-theme rounded-2xl text-main font-bold text-xs focus:ring-1 ring-emerald-500/30" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1 mb-1 block">Dirección</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                            <input type="text" placeholder="Av. Principal #123, Ciudad" value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} className="w-full pl-12 pr-4 py-4 bg-input-theme border border-theme rounded-2xl text-main font-bold text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 pt-6 border-t border-theme">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Share2 size={16} /> Footer & Redes
                                </h3>
                                <div className="space-y-3">
                                    <textarea placeholder="Texto legal o créditos del footer..." rows={2} value={settings.footerText || ''} onChange={e => setSettings({ ...settings, footerText: e.target.value })} className="w-full p-4 bg-input-theme border border-theme rounded-2xl text-main text-xs font-medium resize-none" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                            <input placeholder="@instagram" type="text" value={settings.socialInstagram || ''} onChange={e => setSettings({ ...settings, socialInstagram: e.target.value })} className="w-full pl-10 pr-3 py-3 bg-input-theme border border-theme rounded-xl text-main text-[10px]" />
                                        </div>
                                        <div className="relative">
                                            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                            <input placeholder="Facebook" type="text" value={settings.socialFacebook || ''} onChange={e => setSettings({ ...settings, socialFacebook: e.target.value })} className="w-full pl-10 pr-3 py-3 bg-input-theme border border-theme rounded-xl text-main text-[10px]" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activePanel === 'SEO' && (
                        <div className="space-y-8 animate-entrance">
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Search size={16} /> SEO & Meta Tags
                                </h3>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Meta Título</label>
                                        <input type="text" placeholder="Ej: Shula Studio - Pestañas & Cejas Premium" value={settings.seoTitle || ''} onChange={e => setSettings({ ...settings, seoTitle: e.target.value })} className="w-full p-4 bg-input-theme border border-theme rounded-2xl text-main font-black text-xs" />
                                        <p className="text-[8px] text-muted ml-1">{(settings.seoTitle || '').length}/60 caracteres recomendados</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Meta Descripción</label>
                                        <textarea rows={3} placeholder="Descripción para resultados de Google..." value={settings.seoDescription || ''} onChange={e => setSettings({ ...settings, seoDescription: e.target.value })} className="w-full p-4 bg-input-theme border border-theme rounded-2xl text-main text-xs font-medium resize-none" />
                                        <p className="text-[8px] text-muted ml-1">{(settings.seoDescription || '').length}/160 caracteres recomendados</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Keywords</label>
                                        <input type="text" placeholder="belleza, pestañas, cejas, studio..." value={settings.seoKeywords || ''} onChange={e => setSettings({ ...settings, seoKeywords: e.target.value })} className="w-full p-4 bg-input-theme border border-theme rounded-2xl text-main text-xs" />
                                    </div>
                                </div>
                            </section>

                            {/* Google Preview */}
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest">Vista Previa en Google</h3>
                                <div className="bg-white rounded-2xl p-4 border border-zinc-200">
                                    <p className="text-[10px] text-emerald-700 font-medium mb-0.5">{settings.subdomain || 'demo'}.citaplanner.com</p>
                                    <p className="text-blue-800 text-sm font-medium mb-1 hover:underline cursor-pointer">{settings.seoTitle || settings.businessName || 'Sin Título'}</p>
                                    <p className="text-zinc-600 text-[11px] leading-relaxed">{settings.seoDescription || 'Sin descripción configurada.'}</p>
                                </div>
                            </section>

                            <section className="space-y-4 pt-6 border-t border-theme">
                                <h3 className="text-[10px] font-black text-[#CE4676] uppercase tracking-widest flex items-center gap-3">
                                    <Compass size={16} /> Geolocalización
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Latitud</label>
                                        <input type="number" step="any" placeholder="19.4326" value={settings.latitude || ''} onChange={e => setSettings({ ...settings, latitude: parseFloat(e.target.value) })} className="w-full p-4 bg-input-theme border border-theme rounded-2xl text-main text-xs font-mono" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Longitud</label>
                                        <input type="number" step="any" placeholder="-99.1332" value={settings.longitude || ''} onChange={e => setSettings({ ...settings, longitude: parseFloat(e.target.value) })} className="w-full p-4 bg-input-theme border border-theme rounded-2xl text-main text-xs font-mono" />
                                    </div>
                                </div>
                                <p className="text-[8px] text-muted font-bold uppercase tracking-widest">Para Google Maps y SEO local.</p>
                            </section>
                        </div>
                    )}
                </div>
            </div>

            {/* ========== LIVE PREVIEW AREA ========== */}
            <div className="flex-1 flex flex-col bg-main overflow-hidden">
                {/* Preview Header */}
                <div className="h-14 bg-card-theme border-b border-theme flex items-center justify-between px-6">
                    <div className="flex bg-input-theme p-1 rounded-xl border border-theme">
                        <button onClick={() => setPreviewMode('DESKTOP')} className={`p-2 rounded-lg transition-all ${previewMode === 'DESKTOP' ? 'bg-card text-main shadow' : 'text-muted hover:text-main'}`}><Monitor size={14} /></button>
                        <button onClick={() => setPreviewMode('TABLET')} className={`p-2 rounded-lg transition-all ${previewMode === 'TABLET' ? 'bg-card text-main shadow' : 'text-muted hover:text-main'}`}><Tablet size={14} /></button>
                        <button onClick={() => setPreviewMode('MOBILE')} className={`p-2 rounded-lg transition-all ${previewMode === 'MOBILE' ? 'bg-card text-main shadow' : 'text-muted hover:text-main'}`}><Smartphone size={14} /></button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; }}
                            className="p-1.5 text-muted hover:text-[#CE4676] transition-colors rounded-lg hover:bg-input-theme"
                            title="Recargar vista previa"
                        >
                            <RefreshCw size={13} />
                        </button>
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">Vista Previa</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>

                {/* Device Frame */}
                <div className="flex-1 overflow-hidden p-8 flex justify-center bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                    <div className={`shadow-2xl transition-all duration-700 bg-black overflow-hidden relative ${previewMode === 'DESKTOP' ? 'w-full rounded-xl' :
                        previewMode === 'TABLET' ? 'w-[768px] h-full rounded-[2.5rem] border-[10px] border-zinc-950' :
                            'w-[375px] h-[667px] self-center rounded-[3rem] border-[14px] border-zinc-950'
                        }`}>

                        <iframe
                            ref={iframeRef}
                            src="/"
                            className="w-full h-full border-none"
                            title="Live Preview"
                        />

                        {/* Protection Overlay to allow dragging/scrolling from device frame edges if needed */}
                        <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
};
