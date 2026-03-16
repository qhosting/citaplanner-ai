
import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Sparkles, MapPin, Instagram, Facebook, Twitter, Phone,
    MessageCircle, ShieldCheck, Zap, Globe, Heart, Star, CheckCircle2,
    Calendar, Users, Clock, Menu, X, MessageSquare, Heart as HeartIcon,
    Zap as ZapIcon, Shield, CalendarDays
} from 'lucide-react';
import { LandingSettings, Service } from '../types';
import { LogoCitaplanner } from './LogoCitaplanner';

interface TemplateProps {
    settings: LandingSettings;
    services: Service[];
    accent: string;
    currentSlide?: number;
    slides?: any[];
}

// ==========================================
// 1. TEMPLATE: CITAPLANNER (SaaS Demo)
// ==========================================
export const TemplateCitaPlanner: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide, slides }) => {
    const defaultServices = [
        { id: 's1', name: 'Plan Starter', price: 290, duration: 30, category: 'SaaS', status: 'ACTIVE' as const, description: 'Gestión básica para estudios individuales. Calendario y clientes ilimitados.' },
        { id: 's2', name: 'Plan Professional', price: 950, duration: 30, category: 'SaaS', status: 'ACTIVE' as const, description: 'Para equipos de hasta 5 especialistas. IA de agendamiento incluida.' },
        { id: 's3', name: 'Enterprise Cloud', price: 2400, duration: 30, category: 'SaaS', status: 'ACTIVE' as const, description: 'Múltiples sucursales, API abierta y soporte prioritario 24/7.' },
    ];
    const displayServices = services.length > 0 ? services : defaultServices;

    return (
        <div className="bg-[#020617] text-slate-200 min-h-screen font-inter selection:bg-indigo-500/30">
            <nav className="fixed top-0 w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <LogoCitaplanner color={accent} businessName={settings.businessName} customUrl={settings.logoUrl} />
                    <div className="hidden md:flex items-center gap-10">
                        {['Plataforma', 'Funciones', 'Precios'].map(item => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-colors">{item}</a>
                        ))}
                        <Link to="/book" className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">Probar Demo</Link>
                    </div>
                </div>
            </nav>

            <header className="relative pt-48 pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] -z-10" />
                <div className="max-w-6xl mx-auto text-center space-y-10">
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <Zap size={14} className="text-indigo-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-200">
                            {settings.heroSlides?.[currentSlide || 0]?.subtitle || "La era de la Inteligencia Artificial"}
                        </span>
                    </div>
                    <h1 className="text-7xl md:text-[110px] font-black tracking-tighter text-white leading-[0.85] uppercase">
                        {slides?.[currentSlide || 0]?.title || settings.businessName || "CitaPlanner"} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            {slides?.[currentSlide || 0]?.text || settings.slogan || "Scale your studio effortlessly."}
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-slate-400 font-medium leading-relaxed">
                        {settings.aboutText || "Automatiza el 90% de tus tareas operativas. Desde agendamiento por IA hasta analítica predictiva de alto nivel."}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                        <Link to="/book" className="px-14 py-6 rounded-[2rem] bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:scale-105 transition-all shadow-2xl shadow-indigo-600/40 flex items-center gap-4">
                            Solicitar Acceso <ArrowRight size={18} />
                        </Link>
                        <button className="px-14 py-6 rounded-[2rem] bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Ver Roadmap</button>
                    </div>
                </div>

                <div className="mt-24 max-w-6xl mx-auto relative group">
                    <div className="absolute inset-x-20 -bottom-20 h-40 bg-indigo-500/30 blur-[120px] -z-10" />
                    <div className="aspect-video rounded-[3rem] bg-slate-900/50 border border-white/5 overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.1)] relative">
                        <img
                            src={slides?.[currentSlide || 0]?.image || settings.heroImageUrl || "/templates/saas_hero.png"}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-[2000ms]"
                            alt="SaaS Platform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    </div>
                </div>
            </header>

            {/* Platform Features */}
            <section className="py-32 px-6 bg-slate-950">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                        { icon: MessageSquare, title: 'IA Conversacional', desc: 'Tus clientas agendan por WhatsApp hablando naturalmente con nuestra IA.' },
                        { icon: Shield, title: 'Seguridad Bancaria', desc: 'Tus datos y transacciones están protegidos bajo estándares militares.' },
                        { icon: ZapIcon, title: 'Sync Ultrarrápido', desc: 'Calendario sincronizado en tiempo real en todos tus dispositivos.' },
                    ].map((feature, i) => (
                        <div key={i} className="p-12 rounded-[3.5rem] bg-white/[0.02] border border-white/5 space-y-6 hover:bg-white/[0.04] transition-all">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                <feature.icon size={30} />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing/Plans */}
            <section id="funciones" className="py-32 px-6 bg-[#020617] relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24 space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500">Infrastructure</span>
                        <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">Planes de Crecimiento</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {displayServices.map((s, i) => (
                            <div key={i} className={`p-10 rounded-[3rem] border transition-all ${i === 1 ? 'bg-indigo-600 border-indigo-500 shadow-2xl scale-105 z-10' : 'bg-slate-900/50 border-white/5 hover:border-indigo-500/30'}`}>
                                <h3 className={`text-2xl font-black mb-2 uppercase tracking-tighter ${i === 1 ? 'text-white' : 'text-slate-200'}`}>{s.name}</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className={`text-5xl font-black ${i === 1 ? 'text-white' : 'text-indigo-400'}`}>${s.price}</span>
                                    <span className="text-xs font-bold uppercase text-slate-400">/mes</span>
                                </div>
                                <p className={`mb-10 text-sm font-medium leading-relaxed ${i === 1 ? 'text-indigo-100' : 'text-slate-500'}`}>{s.description}</p>
                                <ul className="space-y-4 mb-12">
                                    {['Smart Calendar', 'Client CRM', 'AI Basic', 'Analytics'].map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest opacity-70">
                                            <CheckCircle2 size={14} className={i === 1 ? 'text-white' : 'text-indigo-400'} /> {item}
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/book" className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center transition-all ${i === 1 ? 'bg-white text-indigo-600 hover:bg-slate-100 shadow-xl' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                                    Empezar Ahora
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gallery — shown only when tenant has images */}
            {settings.images && settings.images.length > 0 && (
                <section className="py-24 px-6 bg-slate-950/60">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500">Showcase</span>
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mt-2">Galería Visual</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {settings.images.map((img, i) => (
                                <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border border-white/5 group bg-slate-900">
                                    <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={`Galería ${i}`} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials — shown only when tenant has testimonials */}
            {settings.testimonials && settings.testimonials.length > 0 && (
                <section className="py-24 px-6 bg-[#020617]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500">Social Proof</span>
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mt-2">Casos de Éxito</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {settings.testimonials.map((t, i) => (
                                <div key={i} className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] transition-all">
                                    <div className="flex gap-1 mb-6">
                                        {[...Array(5)].map((_, s) => <Star key={s} size={14} className="text-indigo-400 fill-indigo-400" />)}
                                    </div>
                                    <p className="text-slate-300 italic mb-10 leading-relaxed text-sm">"{t.text}"</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-black text-indigo-400 text-sm">{t.name.charAt(0)}</div>
                                        <span className="font-bold text-white text-xs uppercase tracking-widest">{t.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer delegated to global layout */}
        </div>
    );
};

// ==========================================
// 2. TEMPLATE: MASTER (Ultra-Clean Hub)
// ==========================================
export const TemplateMaster: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide, slides }) => {
    const defaultServices = [
        { id: '1', name: 'Microblading Profesional', price: 2500, duration: 120, category: 'Cejas', status: 'ACTIVE' as const, description: 'Cejas perfectas con técnica de pelo a pelo. Resultados naturales de larga duración.', imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80' },
        { id: '2', name: 'Nails Art Studio', price: 650, duration: 60, category: 'Uñas', status: 'ACTIVE' as const, description: 'Diseño exclusivo de uñas con materiales premium importados.', imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80' },
        { id: '3', name: 'Maquillaje Editorial', price: 1800, duration: 90, category: 'Maquillaje', status: 'ACTIVE' as const, description: 'Looks de alto impacto para ocasiones especiales y editoriales.', imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80' },
        { id: '4', name: 'Depilación Láser', price: 900, duration: 45, category: 'Tratamientos', status: 'ACTIVE' as const, description: 'Tecnología de punta para una piel suave y sin vello permanentemente.', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80' },
        { id: '5', name: 'Faciales Premium', price: 1200, duration: 75, category: 'Piel', status: 'ACTIVE' as const, description: 'Tratamientos personalizados para revitalizar y rejuvenecer tu piel.', imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80' },
        { id: '6', name: 'Masajes Terapéuticos', price: 800, duration: 60, category: 'Bienestar', status: 'ACTIVE' as const, description: 'Relajación total con técnicas orientales y occidentales.', imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80' },
    ];
    const displayServices = services.length > 0 ? services : defaultServices;
    return (
        <div className="bg-white text-slate-900 min-h-screen font-inter">
            <nav className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <LogoCitaplanner color="#111" businessName={settings.businessName} customUrl={settings.logoUrl} />
                <div className="flex items-center gap-8">
                    <div className="hidden md:flex gap-8">
                        {['Servicios', 'Sucursales', 'Contacto'].map(item => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">{item}</a>
                        ))}
                    </div>
                    <Link to="/book" className="px-8 py-3 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">Reservar</Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="py-24 px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-6 space-y-8">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-emerald-600" />
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">{slides?.[currentSlide || 0]?.subtitle || "Red de Excelencia Certificada"}</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.88] uppercase text-slate-950">
                            {slides?.[currentSlide || 0]?.title || "Master"}<br />
                            <span className="text-emerald-600">{slides?.[currentSlide || 0]?.text || settings.businessName || "Beauty Hub"}</span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-lg font-medium leading-relaxed">
                            {settings.aboutText || "La red de salones de belleza más completa. Gestión centralizada, profesionales certificados y la mejor tecnología en cada sucursal."}
                        </p>
                        <div className="flex items-center gap-4">
                            <Link to="/book" className="px-10 py-5 bg-slate-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3">
                                Agendar Ahora <ArrowRight size={16} />
                            </Link>
                            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Sin costo de reserva</span>
                        </div>
                        <div className="flex gap-8 pt-4 border-t border-slate-100">
                            {[
                                { num: settings.stats?.[0]?.value || '12+', label: 'Sucursales' },
                                { num: settings.stats?.[1]?.value || '500+', label: 'Esp. Certificados' },
                                { num: settings.stats?.[2]?.value || '50K+', label: 'Clientes' },
                            ].map((s, i) => (
                                <div key={i}>
                                    <p className="text-2xl font-black text-slate-950">{s.num}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-6 relative">
                        <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
                            <img src={slides?.[currentSlide || 0]?.image || settings.heroImageUrl || "/templates/master_hero.png"} className="w-full h-full object-cover hover:scale-103 transition-transform duration-700" alt="Master Beauty Hub" />
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100">
                            <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Globe size={20} /></div>
                                <div>
                                    <p className="text-xl font-black text-slate-950 leading-none">24/7</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Disponibilidad</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services */}
            <section id="servicios" className="bg-slate-50 py-24 px-8">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="flex justify-between items-end border-b border-slate-200 pb-8">
                        <div>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Catálogo</span>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-950 mt-1">Nuestros Servicios</h2>
                        </div>
                        <Link to="/book" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 flex items-center gap-2">Ver todos <ArrowRight size={12} /></Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayServices.map((s, i) => (
                            <div key={i} className="bg-white p-6 border border-slate-100 rounded-[2rem] group hover:shadow-xl hover:border-emerald-200 transition-all hover:-translate-y-1">
                                {s.imageUrl && <div className="h-36 rounded-2xl overflow-hidden mb-5"><img src={s.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={s.name} /></div>}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-base font-black uppercase text-slate-950 tracking-tight leading-tight">{s.name}</h3>
                                    <span className="text-sm font-black text-emerald-600 ml-2 whitespace-nowrap">${s.price}</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{s.description}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><CalendarDays size={10} /> {s.duration} min</span>
                                    <Link to="/book" className="text-[9px] font-black uppercase tracking-widest text-slate-950 hover:text-emerald-600 transition-colors">Agendar →</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Us */}
            <section className="py-24 px-8 bg-slate-950 text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Nuestra Promesa</span>
                        <h2 className="text-4xl font-black uppercase tracking-tighter mt-2">¿Por Qué Elegirnos?</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: ShieldCheck, title: 'Profesionales Certificados', desc: 'Cada especialista pasa por un riguroso proceso de certificación internacional.' },
                            { icon: Star, title: 'Productos Premium', desc: 'Solo trabajamos con marcas de primera calidad, seguras y cruelty-free.' },
                            { icon: CalendarDays, title: 'Agenda Flexible', desc: 'Disponibilidad 7 días a la semana con horarios adaptados a tu vida.' },
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-[2rem] border border-white/10 hover:border-emerald-500/30 hover:bg-white/5 transition-all">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6"><item.icon size={22} /></div>
                                <h3 className="text-lg font-black uppercase tracking-tight mb-3">{item.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer delegated to global layout */}
        </div>
    );
};


// ==========================================
// 3. TEMPLATE: SHULASTUDIO (Luxury Beauty)
// ==========================================
export const TemplateShulaStudio: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide, slides }) => {
    const defaultServices = [
        { id: '1', name: 'Microblading Elite', price: 2800, duration: 120, category: 'Cejas', status: 'ACTIVE' as const, description: 'Técnica de pelo a pelo para cejas perfectas y naturales de larga duración.', imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=600' },
        { id: '2', name: 'Extensiones de Pestañas', price: 1200, duration: 90, category: 'Pestañas', status: 'ACTIVE' as const, description: 'Volumen y curvatura perfecta con extensiones de seda premium.', imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80&w=600' },
        { id: '3', name: 'Nano Brows HD', price: 3200, duration: 150, category: 'Cejas', status: 'ACTIVE' as const, description: 'Definición ultra-fina con pigmentos orgánicos de larga duración.', imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80&w=600' },
        { id: '4', name: 'Lifting de Pestañas', price: 850, duration: 60, category: 'Pestañas', status: 'ACTIVE' as const, description: 'Rizador permanente que abre y realza tu mirada de manera natural.', imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=600' },
    ];
    const displayServices = services.length > 0 ? services : defaultServices;

    return (
        <div className="bg-white text-zinc-800 font-inter selection:bg-pink-100">
            {/* Top Bar */}
            <div className="hidden md:flex justify-between items-center py-2 px-8 border-b border-zinc-100 text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-zinc-50">
                <div className="flex gap-6">
                    {settings.contactPhone && <span className="flex items-center gap-2"><Phone size={12} style={{ color: accent }} /> {settings.contactPhone}</span>}
                    {settings.address && <span className="flex items-center gap-2"><MapPin size={12} style={{ color: accent }} /> {settings.address}</span>}
                </div>
                <div className="flex gap-4">
                    {settings.socialInstagram && <a href={settings.socialInstagram} target="_blank" rel="noreferrer" className="hover:text-black transition-colors"><Instagram size={14} /></a>}
                    {settings.socialFacebook && <a href={settings.socialFacebook} target="_blank" rel="noreferrer" className="hover:text-black transition-colors"><Facebook size={14} /></a>}
                </div>
            </div>

            {/* Main Nav */}
            <nav className="py-6 px-8 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-50 shadow-sm transition-all duration-300">
                <LogoCitaplanner size={28} color={accent} businessName={settings.businessName} customUrl={settings.logoUrl} />
                <div className="hidden lg:flex items-center gap-8">
                    {['Inicio', 'Nosotros', 'Servicios', 'Testimonios'].map(t => (
                        <a key={t} href={`#${t.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-[var(--accent)] transition-colors" style={{ '--accent': accent } as any}>{t}</a>
                    ))}
                </div>
                <Link to="/book" className="px-8 py-3 text-white rounded font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity shadow-md" style={{ backgroundColor: accent }}>Agendar Cita</Link>
            </nav>

            {/* Clean Hero Section */}
            <header id="inicio" className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-zinc-100">
                <img src={slides?.[currentSlide || 0]?.image || settings.heroImageUrl || "/templates/shula_hero.png"} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4000ms] hover:scale-105" alt="Beauty Salon" />
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
                
                <div className="relative z-10 text-center max-w-4xl px-6 py-16 bg-white/80 backdrop-blur-md rounded-tr-[4rem] rounded-bl-[4rem] border border-white/50 shadow-2xl mx-4">
                    <span className="block text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: accent }}>
                        {slides?.[currentSlide || 0]?.subtitle || "Bienvenida al mejor cuidado"}
                    </span>
                    <h1 className="text-5xl md:text-7xl font-playfair font-black tracking-tight text-zinc-900 mb-6 leading-tight">
                        {slides?.[currentSlide || 0]?.title || settings.businessName || "Beauty Experience"}
                    </h1>
                    <p className="text-zinc-600 text-lg md:text-xl font-light italic mb-10 max-w-2xl mx-auto leading-relaxed">
                        {slides?.[currentSlide || 0]?.text || settings.slogan || "Resalta tu belleza natural con nuestros expertos."}
                    </p>
                    <Link to="/book" className="inline-flex items-center gap-3 px-10 py-5 text-white rounded font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg hover:-translate-y-1" style={{ backgroundColor: accent }}>
                        Hacer una Reserva <ArrowRight size={14} />
                    </Link>
                </div>
            </header>

            {/* About Section */}
            <section id="nosotros" className="py-24 px-8 bg-white">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="relative aspect-square">
                        <div className="absolute inset-4 border-2 z-10 pointer-events-none" style={{ borderColor: accent }} />
                        <img src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80" className="w-full h-full object-cover p-8 shadow-sm" alt="Nuestro Studio" />
                        <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-zinc-50 rounded-full flex flex-col items-center justify-center p-6 shadow-xl border border-zinc-100 hidden md:flex">
                            <h4 className="text-4xl font-playfair font-black mb-1" style={{ color: accent }}>{settings.stats?.[0]?.value || '10+'}</h4>
                            <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold text-center">Años de<br/>Excelencia</p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-px w-12 bg-zinc-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sobre Nosotros</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-playfair font-black text-zinc-900 leading-tight">
                            Tu santuario de <span className="italic" style={{ color: accent }}>belleza y lujo.</span>
                        </h2>
                        <p className="text-zinc-500 leading-relaxed text-sm md:text-base font-light">
                            {settings.aboutText || "Creemos que cada persona tiene una belleza única. Nuestro objetivo es resaltarla a través de tratamientos personalizados, utilizando productos de la más alta calidad en un ambiente diseñado para tu tranquilidad."}
                        </p>
                        <div className="pt-6 grid grid-cols-2 gap-8">
                            {[
                                { t: 'Expertos', d: 'Personal calificado' },
                                { t: 'Premium', d: 'Productos de lujo' },
                                { t: 'Resultados', d: 'Naturales y bellos' },
                                { t: 'Bienestar', d: 'Ambiente tranquilo' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <CheckCircle2 className="mt-1" size={18} style={{ color: accent }} />
                                    <div>
                                        <h4 className="font-bold text-zinc-900 text-sm">{item.t}</h4>
                                        <p className="text-xs text-zinc-500 font-light">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Grid (BeautySpot Aesthetic) */}
            <section id="servicios" className="py-24 px-8 bg-zinc-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px w-12 bg-zinc-300" />
                            <Sparkles size={16} style={{ color: accent }} />
                            <div className="h-px w-12 bg-zinc-300" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-playfair font-black text-zinc-900">Nuestros Servicios</h2>
                        <p className="text-zinc-500 font-light italic">Descubre nuestra exclusiva gama de tratamientos de belleza y cuidado personal.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
                        {displayServices.map((s, i) => (
                            <div key={i} className="flex gap-6 group items-start">
                                <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                                    <img src={s.imageUrl || "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80"} className="w-full h-full object-cover" alt={s.name} />
                                </div>
                                <div className="flex-1 space-y-3 pt-2">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3 className="text-lg font-playfair font-black text-zinc-800 whitespace-nowrap">{s.name}</h3>
                                        <div className="flex-1 border-b-[2px] border-dotted border-zinc-300 mb-2 opacity-60" />
                                        <span className="text-xl font-black" style={{ color: accent }}>${s.price}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-light">{s.description}</p>
                                    <Link to="/book" className="inline-block text-[10px] font-black uppercase tracking-widest hover:underline pt-2" style={{ color: accent }}>Reservar Ahora</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            {(settings.testimonials?.length ?? 0) > 0 && (
                <section id="testimonios" className="py-24 bg-white px-8 border-t border-zinc-100">
                    <div className="max-w-5xl mx-auto text-center">
                        <div className="mb-16">
                            <Heart className="mx-auto mb-6 opacity-80" size={32} style={{ fill: accent, color: accent }} />
                            <h2 className="text-4xl font-playfair font-black text-zinc-900">Lo que dicen nuestras clientas</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            {settings.testimonials!.slice(0, 3).map((t, i) => (
                                <div key={i} className="p-8 bg-zinc-50 rounded-tr-[3rem] rounded-bl-[3rem] border border-zinc-100 flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex gap-1">
                                        {[...Array(t.rating || 5)].map((_, j) => <Star key={j} size={14} className="fill-[var(--accent)] text-[var(--accent)]" style={{ '--accent': accent } as any} />)}
                                    </div>
                                    <p className="text-zinc-600 font-light text-sm italic leading-relaxed flex-1">"{t.text}"</p>
                                    <div className="flex items-center gap-4 pt-4 border-t border-zinc-200">
                                        <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-playfair text-lg font-black text-zinc-600 shrink-0">
                                            {t.name.charAt(0)}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900">{t.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Final Pre-footer */}
            <section className="py-20 bg-zinc-900 text-center px-6" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80')`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
                <div className="max-w-2xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-5xl font-playfair font-black text-white leading-tight">¿Lista para transformar tu look?</h2>
                    <p className="text-zinc-300 font-light italic text-lg">Reserva hoy mismo y déjate consentir por nuestros profesionales.</p>
                    <Link to="/book" className="inline-block px-14 py-5 bg-white text-zinc-900 font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl rounded" style={{ color: accent }}>
                        Agenda tu Experiencia
                    </Link>
                </div>
            </section>

            {/* Footer delegated to global layout */}
        </div>
    );
};

// ==========================================
// 4. TEMPLATE: MINIMAL (Aurum Minimal)
// ==========================================
export const TemplateMinimal: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide, slides }) => (
    <div className="bg-white text-zinc-950">
        <nav className="p-8 flex justify-between items-center border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
            <LogoCitaplanner color={accent} customUrl={settings.logoUrl} businessName={settings.businessName} />
            <Link to="/book" className="px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-white transition-transform hover:scale-105 shadow-lg" style={{ backgroundColor: accent }}>
                Agendar ahora
            </Link>
        </nav>
        <section className="py-24 md:py-40 px-8 text-center bg-zinc-50 relative overflow-hidden">
            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                <h1 className="text-5xl md:text-[100px] font-black tracking-tighter leading-none uppercase transition-all duration-1000">
                    {slides?.[currentSlide || 0]?.title || settings.businessName}
                </h1>
                <p className="text-xl md:text-3xl font-light text-zinc-400 italic transition-all duration-1000">
                    "{slides?.[currentSlide || 0]?.text || settings.slogan}"
                </p>
                <div className="pt-10">
                    <Link to="/book" className="px-16 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] inline-block text-white shadow-2xl" style={{ backgroundColor: accent }}>
                        Reservar Experiencia
                    </Link>
                </div>
            </div>
        </section>
        <section className="py-24 px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-zinc-100">
                    <img
                        src={slides?.[currentSlide || 0]?.image || settings.heroImageUrl || "/templates/minimal.png"}
                        className="w-full h-full object-cover transition-all duration-1000"
                        alt="Minimalist"
                    />
                </div>
                <div className="space-y-6">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Nosotros</h2>
                    <p className="text-lg text-zinc-500 leading-relaxed font-medium">{settings.aboutText}</p>
                </div>
            </div>
        </section>

        <section className="py-24 bg-zinc-50 px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {services.map((s, i) => (
                        <div key={i} className="p-10 bg-white rounded-[2rem] border border-zinc-200 shadow-sm hover:shadow-xl transition-all">
                            <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">{s.name}</h3>
                            <p className="text-zinc-500 mb-8 font-medium text-sm leading-relaxed">{s.description}</p>
                            <div className="flex justify-between items-center pt-6 border-t border-zinc-100">
                                <span className="font-black text-lg" style={{ color: accent }}>${s.price}</span>
                                <Link to="/book" className="text-[10px] font-black uppercase tracking-widest hover:opacity-70" style={{ color: accent }}>Reservar</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);

// ==========================================
// 5. TEMPLATE: LUXURY (Luxury White)
// ==========================================
export const TemplateLuxury: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide, slides }) => (
    <div className="bg-[#0a0a0a] text-white">
        <header className="h-screen relative flex flex-col">
            <nav className="p-10 flex justify-between items-center z-50">
                <LogoCitaplanner size={24} color={accent} customUrl={settings.logoUrl} businessName={settings.businessName} />
                <div className="flex gap-8">
                    <Link to="/book" className="px-10 py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:scale-105 transition-transform">Agendar</Link>
                </div>
            </nav>
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src={slides?.[currentSlide || 0]?.image || settings.heroImageUrl || "/templates/luxury_white.png"}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms]"
                    alt="Luxury"
                />
                <div className="relative z-20 text-center space-y-6 max-w-5xl px-8">
                    <h1 className="text-7xl md:text-[160px] font-playfair font-black tracking-tighter leading-[0.85] uppercase mb-4 transition-all duration-1000" style={{ color: accent }}>
                        {slides?.[currentSlide || 0]?.title || settings.businessName}
                    </h1>
                    <p className="text-2xl md:text-3xl font-light tracking-[0.2em] opacity-80 uppercase transition-all duration-1000">
                        {slides?.[currentSlide || 0]?.text || settings.slogan}
                    </p>
                    <div className="pt-10">
                        <Link to="/book" className="px-20 py-8 border-2 font-black text-xs uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all" style={{ borderColor: accent, color: accent }}>Entrar al Santuario</Link>
                    </div>
                </div>
            </div>
        </header>

        <section className="py-40 px-8 bg-black">
            <div className="max-w-7xl mx-auto space-y-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-32">
                    <div className="space-y-12">
                        <h2 className="text-5xl font-playfair font-black tracking-tighter" style={{ color: accent }}>Nuestra Filosofía</h2>
                        <p className="text-2xl text-zinc-400 font-light leading-relaxed">{settings.aboutText}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {(settings.images || []).slice(0, 4).map((img, i) => (
                            <div key={i} className={`aspect-[4/5] rounded-3xl overflow-hidden ${i % 2 !== 0 ? 'translate-y-12' : ''}`}>
                                <img src={img.url} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        <section className="py-40 bg-zinc-950 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex justify-between items-end mb-24">
                    <h2 className="text-6xl font-playfair font-black tracking-tighter">Servicios <br /><span className="italic font-light opacity-50 text-white">Exclusivos.</span></h2>
                    <Link to="/book" className="mb-4 text-[11px] font-black uppercase tracking-[0.5em] pb-2 border-b-2" style={{ borderColor: accent }}>Ver Catálogo Completo</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 px-8">
                    {services.map((s, i) => (
                        <div key={i} className="flex justify-between items-center py-10 border-b border-white/10 group hover:px-8 transition-all duration-500">
                            <div>
                                <h3 className="text-2xl font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">{s.name}</h3>
                                <p className="text-zinc-500 text-sm max-w-sm">{s.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black mb-2" style={{ color: accent }}>${s.price}</p>
                                <Link to="/book" className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Reservar ahora</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);

// ==========================================
// 6. TEMPLATE: CLASSIC (Beauty / Default)
// ==========================================
export const TemplateClassic: React.FC<TemplateProps & {
    scrolled: boolean;
    currentSlide: number;
    slides: any[];
    waTarget: string;
    whatsappLink: string;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (o: boolean) => void;
}> = ({ settings, services, accent, scrolled, currentSlide, slides, waTarget, whatsappLink, mobileMenuOpen, setMobileMenuOpen }) => (
    <div className="min-h-screen bg-[#050505] font-inter selection:text-white overflow-x-hidden scroll-smooth">
        {(settings.showWhatsappButton ?? true) && waTarget && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-[500] group">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full animate-ping opacity-25 scale-125" style={{ backgroundColor: accent }} />
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-all duration-500" style={{ background: `linear-gradient(135deg, ${accent}, #000)` }}>
                        <MessageCircle className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                </div>
            </a>
        )}

        <nav className={`fixed top-0 w-full z-[500] transition-all duration-700 ${scrolled ? 'bg-black/90 backdrop-blur-2xl py-4 shadow-2xl' : 'bg-transparent py-8'}`} style={scrolled ? { borderBottom: `1px solid ${accent}20` } : {}}>
            <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
                <LogoCitaplanner color={accent} customUrl={settings.logoUrl} businessName={settings.businessName} />
                <div className="hidden lg:flex items-center gap-10">
                    {['Servicios', 'Nosotros', 'Galería'].map(item => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:opacity-80">{item}</a>
                    ))}
                    <Link to="/book" className="px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 text-white" style={{ backgroundColor: accent }}>
                        Mi Cita <ArrowRight size={14} />
                    </Link>
                </div>
                <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-3 text-white bg-white/5 rounded-xl border border-white/10"><Menu size={24} /></button>
            </div>
        </nav>

        <section className="relative h-screen min-h-[750px] w-full bg-black overflow-hidden">
            {slides.map((slide, index) => (
                <div key={index} className={`absolute inset-0 transition-all duration-[2500ms] ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-black/60 z-10" />
                    <img src={slide.image} className={`w-full h-full object-cover transition-transform duration-[10000ms] ${index === currentSlide ? 'scale-110' : 'scale-100'}`} alt={slide.title} />
                    <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-6">
                        <div className={`max-w-5xl transition-all duration-1000 delay-500 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                            <span className="text-[11px] font-black uppercase tracking-[1em] mb-8 block" style={{ color: accent }}>{settings.businessName}</span>
                            <h1 className="text-6xl md:text-[120px] font-playfair font-black leading-none tracking-tighter mb-10 text-white">
                                {slide.title} {slide.subtitle && <span className="italic font-light" style={{ color: accent }}>{slide.subtitle}</span>}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed mb-14">{slide.text || settings.slogan}</p>
                            <Link to="/book" className="px-20 py-7 rounded-full text-[12px] uppercase tracking-[0.5em] font-black inline-block text-black" style={{ backgroundColor: accent }}>Reservar Experiencia</Link>
                        </div>
                    </div>
                </div>
            ))}
        </section>

        <section id="services" className="py-32 md:py-48 bg-[#050505] px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {services.map((s, i) => (
                        <article key={i} className="group bg-[#0a0a0a] rounded-[3rem] border border-white/5 transition-all duration-700 overflow-hidden hover:-translate-y-5 shadow-2xl">
                            {s.imageUrl && <div className="h-[250px] overflow-hidden"><img src={s.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" /></div>}
                            <div className="p-12">
                                <h3 className="text-2xl font-bold text-white mb-6">{s.name}</h3>
                                <p className="text-zinc-500 font-medium leading-relaxed mb-10 min-h-[60px]">{s.description}</p>
                                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                    <span className="text-2xl font-black" style={{ color: accent }}>${s.price}</span>
                                    <Link to="/book" className="text-[10px] font-black uppercase tracking-widest text-white hover:opacity-80">Reservar <ArrowRight size={16} className="inline ml-2" style={{ color: accent }} /></Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    </div>
);
