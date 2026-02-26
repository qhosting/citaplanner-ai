
import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Sparkles, MapPin, Instagram, Facebook, Twitter,
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
}

// ==========================================
// 1. TEMPLATE: CITAPLANNER (SaaS Demo)
// ==========================================
export const TemplateCitaPlanner: React.FC<TemplateProps> = ({ settings, services, accent }) => {
    return (
        <div className="bg-[#020617] text-slate-200 min-h-screen font-inter selection:bg-indigo-500/30">
            <nav className="fixed top-0 w-full z-50 bg-slate-950/50 backdrop-blur-xl border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <LogoCitaplanner color={accent} businessName={settings.businessName} customUrl={settings.logoUrl} />
                    <div className="hidden md:flex items-center gap-8">
                        {['Características', 'Servicios', 'Nosotros'].map(item => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">{item}</a>
                        ))}
                        <Link to="/book" className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-white/5">Reservar Demo</Link>
                    </div>
                </div>
            </nav>

            <header className="relative pt-48 pb-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 opacity-50" />
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100">Inteligencia Artificial aplicada a tu negocio</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9] uppercase">
                        {settings.businessName || "CitaPlanner"} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-200">{settings.slogan || "Tu negocio, en piloto automático."}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-slate-400 font-medium leading-relaxed">
                        {settings.aboutText || "La plataforma más avanzada para la gestión de citas, clientes y operaciones. Diseñada para escalar."}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
                        <Link to="/book" className="px-12 py-5 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/20 flex items-center gap-3 group">
                            Probar Sistema <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="px-12 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Ver Características</button>
                    </div>
                </div>

                <div className="mt-24 max-w-6xl mx-auto relative group">
                    <div className="absolute inset-x-20 -bottom-10 h-20 bg-indigo-500/50 blur-[100px] -z-10 group-hover:bg-indigo-400/60 transition-all duration-1000" />
                    <div className="aspect-video rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl relative">
                        <img src={settings.heroImageUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80"} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" alt="SaaS Dashboard" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    </div>
                </div>
            </header>

            <section id="servicios" className="py-32 px-6 bg-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20 border-b border-slate-800 pb-12">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Nuestro Catálogo</span>
                            <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Servicios Premium</h2>
                        </div>
                        <p className="max-w-sm text-slate-400 font-medium text-right italic">"Excelencia en cada detalle, respaldada por tecnología de punta."</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((s, i) => (
                            <div key={i} className="p-10 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all group hover:bg-slate-900">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-8 border border-indigo-500/20">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{s.name}</h3>
                                <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">{s.description}</p>
                                <div className="flex items-center justify-between pt-8 border-t border-slate-800">
                                    <span className="text-2xl font-black text-white">${s.price}</span>
                                    <Link to="/book" className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300">Reservar Ahora</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

// ==========================================
// 2. TEMPLATE: MASTER (Ultra-Clean Hub)
// ==========================================
export const TemplateMaster: React.FC<TemplateProps> = ({ settings, services, accent }) => {
    return (
        <div className="bg-white text-slate-900 min-h-screen font-inter">
            <nav className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <LogoCitaplanner color="#111" businessName={settings.businessName} customUrl={settings.logoUrl} />
                <div className="flex items-center gap-12">
                    <div className="hidden md:flex gap-10">
                        {['Portal', 'Servicios', 'Soporte'].map(item => (
                            <button key={item} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">{item}</button>
                        ))}
                    </div>
                    <Link to="/book" className="px-10 py-4 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Consola de Reservas</Link>
                </div>
            </nav>

            <section className="py-32 px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
                    <div className="lg:col-span-7 space-y-10 animate-entrance">
                        <div className="flex items-center gap-3 text-slate-400">
                            <ShieldCheck size={18} className="text-emerald-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Infraestructura de Grado Empresarial</span>
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.9] uppercase text-slate-950">
                            Central <br />
                            <span className="text-slate-400">{settings.businessName || "Master Hub"}</span>
                        </h1>
                        <p className="text-xl text-slate-500 max-w-xl font-medium leading-relaxed">
                            {settings.aboutText || "Sistema de gestión centralizado para múltiples sucursales y operaciones masivas. Control total en tiempo real."}
                        </p>
                        <div className="flex items-center gap-6">
                            <Link to="/book" className="px-12 py-5 bg-slate-950 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl flex items-center gap-3">
                                Gestionar Ahora <ArrowRight size={16} />
                            </Link>
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-slate-900">100% Sincronizado</span> con Aurum Nexus
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-5 relative">
                        <div className="aspect-[4/5] rounded-[3rem] bg-slate-100 overflow-hidden shadow-2xl relative rotate-3 hover:rotate-0 transition-transform duration-700">
                            <img src={settings.heroImageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"} className="w-full h-full object-cover" alt="Corporate" />
                        </div>
                        <div className="absolute -bottom-10 -left-10 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 hidden md:block">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Globe size={24} /></div>
                                <div>
                                    <p className="text-2xl font-black text-slate-950 leading-none">Global</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Disponibilidad 24/7</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-slate-50 py-32 px-8">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-950">Estructura Operativa</h2>
                        <div className="h-1 w-20 bg-slate-950 mx-auto rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((s, i) => (
                            <div key={i} className="bg-white p-8 border border-slate-100 rounded-[2rem] flex justify-between items-center hover:shadow-xl transition-all group">
                                <div className="flex gap-6 items-center">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-all"><Star size={20} /></div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase text-slate-950 tracking-tight">{s.name}</h3>
                                        <p className="text-xs text-slate-500">{s.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-slate-950 leading-none mb-1">${s.price}</p>
                                    <Link to="/book" className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-950 hover:underline">Agendar</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

// ==========================================
// 3. TEMPLATE: SHULASTUDIO (Luxury Beauty)
// ==========================================
export const TemplateShulaStudio: React.FC<TemplateProps> = ({ settings, services, accent }) => {
    return (
        <div className="bg-[#050505] text-[#D4AF37] min-h-screen font-inter selection:bg-[#D4AF37]/20">
            <nav className="p-10 flex justify-between items-center absolute top-0 w-full z-50">
                <LogoCitaplanner size={28} color="#D4AF37" businessName={settings.businessName} customUrl={settings.logoUrl} />
                <Link to="/book" className="px-10 py-5 bg-[#D4AF37] text-black rounded-full font-black text-[11px] uppercase tracking-[0.3em] hover:scale-105 transition-transform shadow-[0_10px_40px_rgba(212,175,55,0.3)]">Entrar al Studio</Link>
            </nav>

            <header className="h-screen relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/60 z-10" />
                <img src={settings.heroImageUrl || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80"} className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 scale-110 animate-entrance" style={{ animationDuration: '3s' }} alt="Luxury Hero" />

                <div className="relative z-20 text-center space-y-8 flex flex-col items-center max-w-5xl px-8">
                    <div className="flex items-center gap-6 mb-4 animate-pulse">
                        <div className="h-px w-20 bg-[#D4AF37]/30" />
                        <span className="text-[12px] font-bold uppercase tracking-[0.8em] text-[#D4AF37]/80">The Art of Perfection</span>
                        <div className="h-px w-20 bg-[#D4AF37]/30" />
                    </div>
                    <h1 className="text-8xl md:text-[180px] font-playfair font-black text-[#D4AF37] leading-[0.8] tracking-tighter uppercase mb-2">
                        {settings.businessName || "Shula Studio"}
                    </h1>
                    <p className="text-xl md:text-3xl font-light tracking-[0.4em] text-white/50 uppercase italic">
                        {settings.slogan || "Redefiniendo tu esencia."}
                    </p>
                    <div className="pt-20">
                        <Link to="/book" className="group relative px-24 py-8 border border-[#D4AF37]/40 hover:border-[#D4AF37] transition-all overflow-hidden flex items-center gap-4">
                            <div className="absolute inset-0 bg-[#D4AF37] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <span className="relative z-10 text-[12px] font-black uppercase tracking-[0.6em] text-[#D4AF37] group-hover:text-black">Solicitar Experiencia</span>
                            <ArrowRight size={20} className="relative z-10 text-[#D4AF37] group-hover:text-black group-hover:translate-x-3 transition-all" />
                        </Link>
                    </div>
                </div>
            </header>

            <section className="py-48 px-8 bg-[#050505]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
                        <div className="lg:col-span-4 sticky top-48 space-y-12">
                            <h2 className="text-6xl font-playfair font-black text-white leading-tight uppercase tracking-tighter">
                                Servicios <br />
                                <span className="italic font-light text-[#D4AF37]">Magnificados.</span>
                            </h2>
                            <p className="text-zinc-500 text-lg leading-relaxed font-light">
                                Cada tratamiento es una obra de arte. En Shula Studio, fusionamos las técnicas más avanzadas con una visión estética única.
                            </p>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-32">
                            {services.map((s, i) => (
                                <div key={i} className={`group cursor-pointer ${i % 2 !== 0 ? 'md:translate-y-32' : ''}`}>
                                    <div className="relative aspect-[3/4] overflow-hidden mb-10 rounded-[3rem]">
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors duration-1000 z-10" />
                                        <img src={s.imageUrl || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[1500ms]" alt={s.name} />
                                        <div className="absolute bottom-8 left-8 right-8 z-20">
                                            <Link to="/book" className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-10 group-hover:translate-y-0 transition-all duration-700 flex items-center justify-center">Reservar Ahora</Link>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mb-4 pr-10">
                                        <h3 className="text-3xl font-playfair font-black text-white uppercase tracking-tighter">{s.name}</h3>
                                        <span className="text-2xl font-black text-[#D4AF37] opacity-60">${s.price}</span>
                                    </div>
                                    <p className="text-zinc-600 font-medium text-sm leading-relaxed pr-8">{s.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

// ==========================================
// 4. TEMPLATE: MINIMAL (Aurum Minimal)
// ==========================================
export const TemplateMinimal: React.FC<TemplateProps> = ({ settings, services, accent }) => (
    <div className="bg-white text-zinc-950">
        <nav className="p-8 flex justify-between items-center border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
            <LogoCitaplanner color={accent} customUrl={settings.logoUrl} businessName={settings.businessName} />
            <Link to="/book" className="px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest text-white transition-transform hover:scale-105 shadow-lg" style={{ backgroundColor: accent }}>
                Agendar ahora
            </Link>
        </nav>
        <section className="py-24 md:py-40 px-8 text-center bg-zinc-50">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-5xl md:text-[100px] font-black tracking-tighter leading-none uppercase">{settings.businessName}</h1>
                <p className="text-xl md:text-3xl font-light text-zinc-400 italic">"{settings.slogan}"</p>
                <div className="pt-10">
                    <Link to="/book" className="px-16 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] inline-block text-white shadow-2xl" style={{ backgroundColor: accent }}>
                        Reservar Experiencia
                    </Link>
                </div>
            </div>
        </section>
        <section className="py-24 px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
                    <img src={settings.heroImageUrl} className="w-full h-full object-cover" />
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
export const TemplateLuxury: React.FC<TemplateProps> = ({ settings, services, accent }) => (
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
                <img src={settings.heroImageUrl} className="absolute inset-0 w-full h-full object-cover" />
                <div className="relative z-20 text-center space-y-6 max-w-5xl px-8">
                    <h1 className="text-7xl md:text-[160px] font-playfair font-black tracking-tighter leading-[0.85] uppercase mb-4" style={{ color: accent }}>{settings.businessName}</h1>
                    <p className="text-2xl md:text-3xl font-light tracking-[0.2em] opacity-80 uppercase">{settings.slogan}</p>
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
