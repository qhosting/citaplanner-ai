
import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Sparkles, MapPin, Instagram, Facebook, Twitter, Phone,
    MessageCircle, ShieldCheck, Zap, Globe, Heart, Star, CheckCircle2,
    Calendar, Users, Clock, Menu, X, MessageSquare, Heart as HeartIcon,
    Zap as ZapIcon, Shield, CalendarDays, Layers
} from 'lucide-react';
import { LandingSettings, Service, Product } from '../types';
import { LogoCitaplanner } from './LogoCitaplanner';
import { WhatsAppButton } from './WhatsAppButton';
import { SYSTEM_VERSION } from '../src/version';

const gold = '#D4AF37';
const magenta = '#D4AF37';

interface TemplateProps {
    settings: LandingSettings;
    services: Service[];
    products?: Product[];
    accent: string;
    currentSlide?: number;
    slides?: any[];
    onContactClick?: () => void;
    setMobileMenuOpen?: (o: boolean) => void;
}

// ==========================================
// 1. TEMPLATE: CITAPLANNER (SaaS Demo)
// ==========================================
export const TemplateCitaPlanner: React.FC<TemplateProps> = ({ settings, services, products, accent, currentSlide, slides, onContactClick }) => {
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
                        <button onClick={onContactClick} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-colors">Contacto</button>
                        <Link to="/book" className="px-8 py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">Probar Demo</Link>
                    </div>
                </div>
            </nav>

            <header className="relative pt-48 pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] -z-10" />
                <div className="max-w-6xl mx-auto text-center space-y-10">
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
export const TemplateMaster: React.FC<TemplateProps> = ({ settings, services, products, accent, currentSlide, slides, onContactClick }) => {
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
            <WhatsAppButton phone={settings.whatsappPhone || settings.contactPhone} />
            <nav className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <LogoCitaplanner color="#111" businessName={settings.businessName} customUrl={settings.logoUrl} />
                <div className="flex items-center gap-8">
                    <div className="hidden md:flex gap-8">
                        {['Servicios', 'Sucursales'].map(item => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">{item}</a>
                        ))}
                        <button onClick={onContactClick} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Contacto</button>
                    </div>
                    <Link to="/book" className="px-8 py-3 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">Reservar</Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="py-24 px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-6 space-y-8">
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
                        <div className="aspect-video md:aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
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
export const TemplateShulaStudio: React.FC<TemplateProps> = ({ settings, services, products, accent, currentSlide, slides, onContactClick, setMobileMenuOpen }) => {
    const defaultServices = [
        { id: '1', name: 'Clásicas', price: 950, duration: 120, category: 'Pestañas', status: 'ACTIVE' as const, description: 'Técnica 1 a 1 para un look natural y sofisticado.', imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80' },
        { id: '2', name: 'Volumen Híbrido', price: 1250, duration: 120, category: 'Pestañas', status: 'ACTIVE' as const, description: 'Mezcla perfecta de clásicas y volumen para mayor densidad.', imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80' },
        { id: '3', name: 'Volumen Ruso', price: 1550, duration: 150, category: 'Pestañas', status: 'ACTIVE' as const, description: 'Máximo volumen y dramatismo con abanicos hechos a mano.', imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80' },
        { id: '4', name: 'Lifting de Pestañas', price: 850, duration: 60, category: 'Pestañas', status: 'ACTIVE' as const, description: 'Levantamiento natural de tus propias pestañas.', imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80' },
    ];
    const displayServices = services.length > 0 ? services.slice(0, 4) : defaultServices;

    return (
        <div className="bg-black text-zinc-300 font-inter min-h-screen">
            {/* WhatsApp Floating Button */}
            <WhatsAppButton phone={settings.whatsappPhone || settings.contactPhone} />

            {/* 1. Navbar Fijo con Glassmorphism y Estilo Dorado Premium */}
            <nav className="fixed w-full z-50 bg-black/60 backdrop-blur-xl border-b border-[#D4AF37]/20 shadow-[0_4px_30px_rgba(212,175,55,0.15)] transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center h-24">
                    <Link to="/" className="flex items-center group">
                        <LogoCitaplanner size={32} color={magenta} businessName={settings.businessName} customUrl={settings.logoUrl} />
                    </Link>
                    
                    <div className="hidden md:flex items-center gap-10">
                        {['Inicio', 'Servicios', 'Galería'].map(t => (
                            <a 
                                key={t} 
                                href={`#${t.toLowerCase()}`} 
                                className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-zinc-100 hover:text-[#D4AF37] transition-all duration-300 relative py-2 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-[#D4AF37] hover:after:w-full after:transition-all after:duration-300 hover:scale-105"
                            >
                                {t}
                            </a>
                        ))}
                        <button 
                            onClick={onContactClick} 
                            className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-zinc-100 hover:text-[#D4AF37] transition-all duration-300 relative py-2 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-[#D4AF37] hover:after:w-full after:transition-all after:duration-300 hover:scale-105"
                        >
                            Contacto
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link 
                            to="/book" 
                            className="hidden md:inline-block px-8 py-3 rounded-full font-extrabold text-[11px] uppercase tracking-[0.2em] text-black hover:scale-105 hover:bg-[#AA7C11] transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.45)] hover:shadow-[0_0_30px_rgba(212,175,55,0.7)] bg-gradient-to-r from-[#D4AF37] to-[#AA7C11]"
                        >
                            Agendar Cita
                        </Link>
                        <button 
                            onClick={() => setMobileMenuOpen?.(true)}
                            className="md:hidden text-white p-2 hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <Menu size={28} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* 2. Hero Slider Pantalla Completa */}
            <header id="inicio" className="relative h-[50vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-[#050505]">
                {settings.heroVideoUrl ? (
                    <video 
                        src={settings.heroVideoUrl} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 z-10" 
                        autoPlay muted loop playsInline 
                    />
                ) : (
                    <img 
                        src={slides?.[currentSlide || 0]?.image || settings.heroImageUrl || "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80"} 
                        className="absolute inset-0 w-full h-full object-cover opacity-80 z-10 transition-transform duration-[5000ms] scale-105" 
                        alt="Lash Studio Background" 
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-20" />
                
                <div className="relative z-30 text-center max-w-4xl px-6 flex flex-col items-center animate-entrance">
                    <span className="block text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-[#D4AF37]">{slides?.[currentSlide || 0]?.subtitle || 'Alta Estética de Lujo'}</span>
                    <h1 className="text-4xl md:text-7xl font-playfair font-black text-white uppercase tracking-tighter mb-6 leading-none">{slides?.[currentSlide || 0]?.title || settings.businessName || 'Shula Studio'}</h1>
                    <p className="text-zinc-400 font-light italic text-sm md:text-base max-w-2xl mb-10 leading-relaxed">{slides?.[currentSlide || 0]?.text || settings.slogan || 'Elegancia en cada detalle de tu mirada.'}</p>
                    <Link to="/book" className="inline-flex items-center gap-3 px-10 py-5 text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform rounded-sm shadow-[0_10px_40px_rgba(212,175,55,0.3)] bg-gradient-to-r from-[#D4AF37] to-[#AA7C11]">
                        Reserva Tu Cita <ArrowRight size={16} />
                    </Link>
                </div>

                {/* Slider dots */}
                <div className="absolute bottom-10 z-30 flex gap-3">
                    {[0, 1, 2].map((_, idx) => (
                        <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === (currentSlide || 0) ? 'w-8 bg-[#D4AF37]' : 'bg-white/30'}`} />
                    ))}
                </div>
            </header>

            {/* 3. Servicios - Grid de 4 */}
            <section id="servicios" className="py-24 px-8 bg-zinc-950 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <Sparkles className="mx-auto block" size={32} style={{ color: gold }} />
                        <h2 className="text-4xl md:text-5xl font-playfair font-black" style={{ color: gold }}>Nuestros Servicios</h2>
                        <p className="text-zinc-500 font-light italic text-lg max-w-2xl mx-auto">
                            Técnicas exclusivas para diseñar una mirada de impacto y larga duración.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {displayServices.map((s, i) => (
                            <Link 
                                key={i} 
                                to={`/book?serviceId=${s.id}`}
                                className="group flex flex-col bg-[#0d0d0d] rounded-3xl border border-white/5 hover:border-[#D4AF37]/50 transition-all duration-500 overflow-hidden shadow-2xl relative"
                            >
                                <div className="aspect-[4/5] overflow-hidden relative">
                                    <img 
                                        src={s.imageUrl || 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80'} 
                                        alt={s.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6 text-left">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">{s.category || 'Servicio'}</p>
                                            <h3 className="text-xl font-playfair font-black text-white leading-tight">{s.name}</h3>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-6 pt-2 space-y-4 flex flex-col flex-1 text-left">
                                    <p className="text-xs text-zinc-500 font-light leading-relaxed line-clamp-3">
                                        {s.description || 'Experiencia exclusiva diseñada para resaltar tu belleza natural con técnicas de vanguardia.'}
                                    </p>
                                    
                                    <div className="mt-auto flex justify-between items-center pt-6 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Inversión</span>
                                            <span className="font-black text-xl text-white">${s.price}</span>
                                        </div>
                                        <div className="px-6 py-3 rounded-xl bg-white/5 group-hover:bg-[#D4AF37] group-hover:text-black text-white text-[10px] font-black uppercase tracking-widest transition-all">
                                            Agendar
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
            {/* 3.1 Productos en Landing (opcional) */}
            {products && products.length > 0 && (
                <section id="productos" className="py-24 px-8 bg-black border-t border-white/5">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-20 space-y-4">
                            <Layers className="mx-auto block" size={32} style={{ color: gold }} />
                            <h2 className="text-4xl md:text-5xl font-playfair font-black" style={{ color: gold }}>Productos Exclusivos</h2>
                            <p className="text-zinc-500 font-light italic text-lg max-w-2xl mx-auto">
                                Consiente tu cuidado personal con nuestra selección de productos profesionales de alta gama.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {products.map((p, i) => (
                                <div key={i} className="group flex flex-col p-6 bg-zinc-900/30 rounded-lg border border-white/5 hover:border-[#D4AF37]/50 transition-all duration-300">
                                    <div className="aspect-square rounded-md bg-zinc-800/50 mb-6 overflow-hidden relative">
                                        <img 
                                            src={p.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80"} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt={p.name}
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h3 className="text-lg font-playfair font-black text-white mb-1 tracking-wide">{p.name}</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-4">{p.category}</p>
                                    
                                    <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="font-black text-lg" style={{ color: magenta }}>${p.price}</span>
                                        <button 
                                            className="text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all rounded-sm"
                                        >
                                            Ver Detalle
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 3.5 Galería Section */}
            {(settings.images && settings.images.length > 0) || true ? (
                <section id="galería" className="py-24 px-8 bg-black">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <span className="block text-[10px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: gold }}>Portafolio de Arte</span>
                            <h2 className="text-4xl md:text-5xl font-playfair font-black text-white">Nuestra Galería</h2>
                            <div className="h-px w-24 bg-[#D4AF37] mx-auto mt-6" />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {(settings.images && settings.images.length > 0 ? settings.images : [
                                { url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80' },
                                { url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80' },
                                { url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80' },
                                { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80' },
                                { url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80' },
                                { url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80' }
                            ]).map((img, i) => (
                                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-white/5">
                                    <img 
                                        src={img.url} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        alt={`Galería ${i}`} 
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Sparkles size={24} style={{ color: gold }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {/* 4. Footer */}
            {/* Footer delegated to global layout */}
        </div>
    );
};

// ==========================================
// 4. TEMPLATE: MINIMAL (Aurum Minimal)
// ==========================================
export const TemplateMinimal: React.FC<TemplateProps> = ({ settings, services, products, accent, currentSlide, slides, onContactClick }) => (
    <div className="bg-white text-zinc-950">
        <WhatsAppButton phone={settings.whatsappPhone || settings.contactPhone} />
        <nav className="p-8 flex justify-between items-center border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
            <LogoCitaplanner color={accent} customUrl={settings.logoUrl} businessName={settings.businessName} />
            <Link to="/book" className="px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-white transition-transform hover:scale-105 shadow-lg" style={{ backgroundColor: accent }}>
                Agendar ahora
            </Link>
        </nav>
        <section className="py-24 md:py-40 px-8 text-center bg-zinc-50 relative overflow-hidden">
                <div className="pt-10">
                    <Link to="/book" className="px-16 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] inline-block text-white shadow-2xl" style={{ backgroundColor: accent }}>
                        Reservar Experiencia
                    </Link>
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
export const TemplateLuxury: React.FC<TemplateProps> = ({ settings, services, products, accent, currentSlide, slides, onContactClick }) => (
    <div className="bg-[#0a0a0a] text-white">
        <WhatsAppButton phone={settings.whatsappPhone || settings.contactPhone} />
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
    onContactClick?: () => void;
}> = ({ settings, services, products, accent, scrolled, currentSlide, slides, waTarget, whatsappLink, mobileMenuOpen, setMobileMenuOpen, onContactClick }) => (
    <div className="min-h-screen bg-[#050505] font-inter selection:text-white overflow-x-hidden scroll-smooth">
        <WhatsAppButton phone={settings.whatsappPhone || settings.contactPhone} />

        <nav className={`fixed top-0 w-full z-[500] transition-all duration-700 ${scrolled ? 'bg-black/90 backdrop-blur-2xl py-4 border-b border-[#D4AF37]/20 shadow-[0_4px_30px_rgba(212,175,55,0.15)]' : 'bg-transparent py-8'}`}>
            <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
                <LogoCitaplanner color={accent === gold || accent === '#C5A028' ? magenta : accent} customUrl={settings.logoUrl} businessName={settings.businessName} />
                <div className="hidden lg:flex items-center gap-10">
                    {['Servicios', 'Nosotros', 'Galería'].map(item => (
                        <a 
                            key={item} 
                            href={`#${item.toLowerCase()}`} 
                            className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-zinc-100 hover:text-[#D4AF37] transition-all duration-300 relative py-2 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-[#D4AF37] hover:after:w-full after:transition-all after:duration-300 hover:scale-105"
                        >
                            {item}
                        </a>
                    ))}
                    <button 
                        onClick={onContactClick} 
                        className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-zinc-100 hover:text-[#D4AF37] transition-all duration-300 relative py-2 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-[#D4AF37] hover:after:w-full after:transition-all after:duration-300 hover:scale-105"
                    >
                        Contacto
                    </button>
                    <Link 
                        to="/book" 
                        className="px-8 py-3 rounded-full font-extrabold text-[11px] uppercase tracking-[0.2em] text-black hover:scale-105 hover:bg-[#AA7C11] transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.45)] hover:shadow-[0_0_30px_rgba(212,175,55,0.7)]" 
                        style={{ backgroundColor: magenta }}
                    >
                        Mi Cita <ArrowRight size={14} className="inline ml-1" />
                    </Link>
                </div>
                <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-3 text-white bg-white/5 rounded-xl border border-white/10"><Menu size={24} /></button>
            </div>
        </nav>

        <section className="relative h-[50vh] md:h-[75vh] md:min-h-[600px] w-full bg-black overflow-hidden">
            {slides.map((slide, index) => (
                <div key={index} className={`absolute inset-0 transition-all duration-[2500ms] ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-black/60 z-10" />
                    {settings.heroVideoUrl && index === 0 ? (
                         <video src={settings.heroVideoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                        <img src={slide.image} className={`w-full h-full object-cover transition-transform duration-[10000ms] ${index === currentSlide ? 'scale-110' : 'scale-100'}`} alt={slide.title} />
                    )}
                    <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-6">
                        <div className={`max-w-5xl transition-all duration-1000 delay-500 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
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

        {products && products.length > 0 && (
            <section id="products" className="py-32 bg-black px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Shopping <span style={{ color: accent }}>Collection</span></h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((p, i) => (
                            <div key={i} className="group bg-zinc-900/40 rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all">
                                <div className="aspect-square rounded-2xl overflow-hidden mb-6 bg-zinc-800">
                                    <img src={p.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{p.category}</p>
                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <span className="text-xl font-black" style={{ color: accent }}>${p.price}</span>
                                    <button className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Detalles</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )}
    </div>
);
