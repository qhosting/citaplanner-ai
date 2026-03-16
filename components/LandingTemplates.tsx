
import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Sparkles, MapPin, Instagram, Facebook, Twitter,
    MessageCircle, ShieldCheck, Zap, Globe, Heart, Star, CheckCircle2,
    Calendar, Users, Clock, Menu, X, MessageSquare, Heart as HeartIcon,
    Zap as ZapIcon, Shield, CalendarDays, Quote, Award, Activity
} from 'lucide-react';
import { LandingSettings, Service } from '../types';
import { LogoCitaplanner } from './LogoCitaplanner';

interface TemplateProps {
    settings: LandingSettings;
    services: Service[];
    accent: string;
    currentSlide?: number;
}

const PlaceholderImage = ({ text = "Imagen", className = "" }: { text?: string; className?: string }) => (
    <div className={`flex flex-col items-center justify-center bg-zinc-900 border border-white/5 text-zinc-700 ${className}`}>
        <Sparkles size={24} className="mb-2 opacity-20" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-20">{text}</span>
    </div>
);

// ==========================================
// 1. TEMPLATE: CITAPLANNER (SaaS Demo)
// ==========================================
export const TemplateCitaPlanner: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide }) => {
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
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100">
                            {settings.heroSlides?.[currentSlide || 0]?.subtitle || "Inteligencia Artificial aplicada a tu negocio"}
                        </span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.9] uppercase transition-all duration-700">
                        {settings.heroSlides?.[currentSlide || 0]?.title || settings.businessName || "CitaPlanner"} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-200">
                            {settings.heroSlides?.[currentSlide || 0]?.text || settings.slogan || "Tu negocio, en piloto automático."}
                        </span>
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
                        {(settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl) ? (
                            <img
                                src={settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl}
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-1000"
                                alt="SaaS Dashboard"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        ) : <PlaceholderImage className="w-full h-full opacity-20" />}
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

                    {/* Standard Gallery Section for Template */}
                    {settings.images && settings.images.length > 0 && (
                        <div className="mt-32">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-12 text-center">Galería Visual</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {settings.images.map((img, i) => (
                                    <div key={i} className="aspect-square rounded-3xl overflow-hidden border border-slate-800 group bg-slate-900">
                                        <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={`Galería ${i}`} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Testimonials for CitaPlanner */}
                    {settings.testimonials && settings.testimonials.length > 0 && (
                        <div className="mt-32">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-16 text-center">Casos de Éxito</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {settings.testimonials.map((t, i) => (
                                    <div key={i} className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                                        <Quote className="text-indigo-500 mb-6 opacity-40" size={32} />
                                        <p className="text-slate-300 italic mb-10 leading-relaxed">"{t.text}"</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center font-black text-indigo-400 text-xs">{t.name.charAt(0)}</div>
                                            <span className="font-bold text-white text-xs uppercase tracking-widest">{t.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

// ==========================================
// 2. TEMPLATE: MASTER (Ultra-Clean Hub)
// ==========================================
export const TemplateMaster: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide }) => {
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
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">{settings.heroSlides?.[currentSlide || 0]?.subtitle || "Red de Excelencia Certificada"}</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.88] uppercase text-slate-950">
                            {settings.heroSlides?.[currentSlide || 0]?.title || "Master"}<br />
                            <span className="text-emerald-600">{settings.heroSlides?.[currentSlide || 0]?.text || settings.businessName || "Beauty Hub"}</span>
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
                        <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-slate-100">
                            {(settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl) ? (
                                <img src={settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl} className="w-full h-full object-cover hover:scale-103 transition-transform duration-700" alt="Master Beauty Hub" />
                            ) : <PlaceholderImage className="w-full h-full" />}
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

            {/* Testimonials for Master */}
            {settings.testimonials && settings.testimonials.length > 0 && (
                <section className="py-24 px-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Opiniones</span>
                            <h2 className="text-4xl font-black uppercase tracking-tighter mt-2 text-slate-950">Lo Que Nuestros Clientes Dicen</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {settings.testimonials.map((t, i) => (
                                <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative">
                                    <Quote className="absolute top-8 right-8 text-emerald-600/10" size={40} />
                                    <div className="flex gap-1 mb-6">
                                        {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} className="fill-emerald-500 text-emerald-500" />)}
                                    </div>
                                    <p className="text-slate-600 italic mb-8 leading-relaxed">"{t.text}"</p>
                                    <p className="font-black uppercase tracking-widest text-[10px] text-slate-950">— {t.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery for Master */}
            {settings.images && settings.images.length > 0 && (
                <section className="py-24 px-8 bg-slate-50">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-950 mb-12 text-center">Nuestras Instalaciones</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {settings.images.map((img, i) => (
                                <div key={i} className="aspect-square rounded-[2rem] overflow-hidden shadow-lg border border-white bg-slate-100">
                                    <img src={img.url} className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt={`Instalación ${i}`} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

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
                                <div className="h-36 rounded-2xl overflow-hidden mb-5 bg-slate-50">
                                    {s.imageUrl ? (
                                        <img src={s.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={s.name} />
                                    ) : <PlaceholderImage className="w-full h-full opacity-10" text="Beauty Service" />}
                                </div>
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

            {/* Footer */}
            <footer className="py-10 border-t border-slate-100 px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <LogoCitaplanner color="#111" businessName={settings.businessName} customUrl={settings.logoUrl} />
                    {settings.address && <p className="text-slate-400 text-xs flex items-center gap-2"><MapPin size={12} />{settings.address}</p>}
                    <p className="text-slate-400 text-[9px] uppercase tracking-widest">{settings.footerText || `© ${new Date().getFullYear()} ${settings.businessName}. Todos los derechos reservados.`}</p>
                </div>
            </footer>
        </div>
    );
};


// ==========================================
// 3. TEMPLATE: SHULASTUDIO (Luxury Beauty)
// ==========================================
export const TemplateShulaStudio: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide }) => {
    const defaultServices = [
        { id: '1', name: 'Microblading Elite', price: 2800, duration: 120, category: 'Cejas', status: 'ACTIVE' as const, description: 'Técnica de pelo a pelo para cejas perfectas y naturales de larga duración.', imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=600' },
        { id: '2', name: 'Extensiones de Pestañas', price: 1200, duration: 90, category: 'Pestañas', status: 'ACTIVE' as const, description: 'Volumen y curvatura perfecta con extensiones de seda premium.', imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80&w=600' },
        { id: '3', name: 'Nano Brows HD', price: 3200, duration: 150, category: 'Cejas', status: 'ACTIVE' as const, description: 'Definición ultra-fina con pigmentos orgánicos de larga duración.', imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80&w=600' },
        { id: '4', name: 'Lifting de Pestañas', price: 850, duration: 60, category: 'Pestañas', status: 'ACTIVE' as const, description: 'Rizador permanente que abre y realza tu mirada de manera natural.', imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=600' },
    ];
    const displayServices = services.length > 0 ? services : defaultServices;

    return (
        <div className="bg-[#050505] text-[#D4AF37] min-h-screen font-inter selection:bg-[#D4AF37]/20">
            <nav className="p-10 flex justify-between items-center absolute top-0 w-full z-50">
                <LogoCitaplanner size={28} color="#D4AF37" businessName={settings.businessName} customUrl={settings.logoUrl} />
                <Link to="/book" className="px-10 py-5 bg-[#D4AF37] text-black rounded-full font-black text-[11px] uppercase tracking-[0.3em] hover:scale-105 transition-transform shadow-[0_10px_40px_rgba(212,175,55,0.3)]">Entrar al Studio</Link>
            </nav>

            <header className="h-screen relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80 z-10" />
                {(settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl) ? (
                    <img src={settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl} className="absolute inset-0 w-full h-full object-cover scale-105" alt="Luxury Beauty Studio" />
                ) : <PlaceholderImage className="absolute inset-0 w-full h-full opacity-20" text="Santuario Shula" />}
                <div className="relative z-20 text-center space-y-6 flex flex-col items-center max-w-5xl px-8">
                    <div className="flex items-center gap-6">
                        <div className="h-px w-16 bg-[#D4AF37]/40" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.8em] text-[#D4AF37]/70">{settings.heroSlides?.[currentSlide || 0]?.subtitle || "The Art of Perfection"}</span>
                        <div className="h-px w-16 bg-[#D4AF37]/40" />
                    </div>
                    <h1 className="text-7xl md:text-[120px] font-black text-[#D4AF37] leading-[0.85] tracking-tighter uppercase">
                        {settings.heroSlides?.[currentSlide || 0]?.title || settings.businessName || "Shula Studio"}
                    </h1>
                    <p className="text-lg md:text-2xl font-light tracking-[0.3em] text-white/50 uppercase italic">
                        {settings.heroSlides?.[currentSlide || 0]?.text || settings.slogan || "Redefiniendo tu esencia."}
                    </p>
                    <div className="pt-10">
                        <Link to="/book" className="group relative inline-flex items-center gap-4 px-20 py-7 border border-[#D4AF37]/50 overflow-hidden hover:border-[#D4AF37] transition-all">
                            <div className="absolute inset-0 bg-[#D4AF37] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.5em] text-[#D4AF37] group-hover:text-black">Solicitar Experiencia</span>
                            <ArrowRight size={18} className="relative z-10 text-[#D4AF37] group-hover:text-black group-hover:translate-x-2 transition-all" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Stats Strip */}
            <section className="py-16 border-y border-[#D4AF37]/10 bg-[#080808]">
                <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { num: settings.stats?.[0]?.value || '8+', label: settings.stats?.[0]?.label || 'Años de Experiencia' },
                        { num: settings.stats?.[1]?.value || '2,400+', label: settings.stats?.[1]?.label || 'Clientas Satisfechas' },
                        { num: settings.stats?.[2]?.value || '15', label: settings.stats?.[2]?.label || 'Especialistas Elite' },
                        { num: settings.stats?.[3]?.value || '98%', label: settings.stats?.[3]?.label || 'Satisfacción Total' },
                    ].map((s, i) => (
                        <div key={i} className="space-y-1">
                            <p className="text-3xl md:text-5xl font-black text-[#D4AF37]">{s.num}</p>
                            <p className="text-[8px] uppercase tracking-[0.4em] text-zinc-700 font-bold">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Services */}
            <section className="py-28 px-8 bg-[#050505]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
                        <div className="lg:col-span-4 sticky top-32 space-y-6">
                            <div className="h-px w-12 bg-[#D4AF37]/40" />
                            <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight">
                                Servicios<br /><span className="italic font-light text-[#D4AF37]">Magnificados.</span>
                            </h2>
                            <p className="text-zinc-500 leading-relaxed font-light text-sm">{settings.aboutText || "Cada tratamiento es una obra de arte. Fusionamos técnicas avanzadas con una visión estética única e irrepetible."}</p>
                            <Link to="/book" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#D4AF37] border-b border-[#D4AF37]/30 pb-1 hover:border-[#D4AF37] transition-colors">
                                Ver Disponibilidad <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-20">
                            {displayServices.map((s, i) => (
                                <div key={i} className={`group cursor-pointer ${i % 2 !== 0 ? 'md:translate-y-16' : ''}`}>
                                    <div className="relative aspect-[3/4] overflow-hidden mb-6 rounded-[2rem] bg-zinc-900">
                                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/10 transition-colors duration-700 z-10" />
                                        {s.imageUrl ? (
                                            <img src={s.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1200ms]" alt={s.name} />
                                        ) : <PlaceholderImage className="w-full h-full opacity-30" text="Servicio Elite" />}
                                        <div className="absolute bottom-5 left-5 right-5 z-20">
                                            <Link to="/book" className="w-full py-3 bg-[#D4AF37] text-black font-black text-[9px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-400 flex items-center justify-center rounded-full">Reservar</Link>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mb-2">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{s.name}</h3>
                                        <span className="text-lg font-black text-[#D4AF37] opacity-60">${s.price}</span>
                                    </div>
                                    <p className="text-zinc-600 text-xs leading-relaxed">{s.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Marquee Banner */}
            <section className="py-10 bg-[#D4AF37] overflow-hidden">
                <div className="flex gap-10 whitespace-nowrap animate-marquee">
                    {[...Array(6)].map((_, i) => (
                        <span key={i} className="text-[10px] font-black uppercase tracking-[0.5em] text-black flex items-center gap-8">
                            {settings.businessName || "Shula Studio"} <Star size={10} className="fill-black inline" /> Reserva Tu Lugar <Star size={10} className="fill-black inline" />
                        </span>
                    ))}
                </div>
            </section>

            {/* Gallery for Shula */}
            {settings.images && settings.images.length > 0 && (
                <section className="py-28 bg-[#080808] px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-6 mb-16">
                            <div className="h-px flex-1 bg-[#D4AF37]/10" />
                            <h2 className="text-3xl font-black text-white uppercase tracking-widest px-8">La Galería</h2>
                            <div className="h-px flex-1 bg-[#D4AF37]/10" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {settings.images.map((img, i) => (
                                <div key={i} className="aspect-square rounded-3xl overflow-hidden border border-[#D4AF37]/5 group bg-zinc-900">
                                    <img src={img.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" alt={`Gallery Shula ${i}`} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials */}
            {(settings.testimonials?.length ?? 0) > 0 && (
                <section className="py-28 bg-[#050505] px-8 border-t border-[#D4AF37]/5">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-2">
                            <span className="text-[9px] uppercase tracking-[0.5em] text-[#D4AF37]/50 font-bold">Lo Que Dicen</span>
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Ellas Ya Lo Vivieron</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {settings.testimonials!.map((t, i) => (
                                <div key={i} className="p-8 rounded-[2rem] border border-[#D4AF37]/10 space-y-4">
                                    <div className="flex gap-1">{[...Array(t.rating || 5)].map((_, j) => <Star key={j} size={12} className="fill-[#D4AF37] text-[#D4AF37]" />)}</div>
                                    <p className="text-zinc-400 italic font-light text-sm leading-relaxed">"{t.text}"</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]/50">— {t.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="py-12 border-t border-[#D4AF37]/10 px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <LogoCitaplanner size={22} color="#D4AF37" businessName={settings.businessName} customUrl={settings.logoUrl} />
                    {settings.address && <p className="text-zinc-700 text-[10px] flex items-center gap-2"><MapPin size={10} />{settings.address}</p>}
                    <p className="text-zinc-800 text-[8px] uppercase tracking-widest">{settings.footerText || `© ${new Date().getFullYear()} ${settings.businessName}. Todos los derechos reservados.`}</p>
                </div>
            </footer>
        </div>
    );
};

// ==========================================
// 4. TEMPLATE: MINIMAL (Aurum Minimal)
// ==========================================
export const TemplateMinimal: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide }) => (
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
                    {settings.heroSlides?.[currentSlide || 0]?.title || settings.businessName}
                </h1>
                <p className="text-xl md:text-3xl font-light text-zinc-400 italic transition-all duration-1000">
                    "{settings.heroSlides?.[currentSlide || 0]?.text || settings.slogan}"
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
                    {(settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl) ? (
                        <img
                            src={settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl}
                            className="w-full h-full object-cover transition-all duration-1000"
                            alt="Minimalist"
                        />
                    ) : <PlaceholderImage className="w-full h-full" text="Minimalist" />}
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
                            <div className="h-40 rounded-2xl overflow-hidden mb-6 bg-zinc-50">
                                {s.imageUrl ? (
                                    <img src={s.imageUrl} className="w-full h-full object-cover" />
                                ) : <PlaceholderImage className="w-full h-full opacity-10" text="Minimal Service" />}
                            </div>
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

        {/* Gallery for Minimal */}
        {settings.images && settings.images.length > 0 && (
            <section className="py-24 px-8 max-w-7xl mx-auto">
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-12">Galería</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {settings.images.map((img, i) => (
                        <div key={i} className="aspect-square rounded-[2rem] overflow-hidden bg-zinc-100">
                            <img src={img.url} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt={`Minimal Gallery ${i}`} onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* Testimonials for Minimal */}
        {settings.testimonials && settings.testimonials.length > 0 && (
            <section className="py-24 bg-zinc-950 text-white px-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-16 text-center">Experiencias</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {settings.testimonials.map((t, i) => (
                            <div key={i} className="space-y-6">
                                <p className="text-2xl font-light italic leading-relaxed text-zinc-300">"{t.text}"</p>
                                <p className="font-black uppercase tracking-widest text-xs" style={{ color: accent }}>— {t.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )}
    </div>
);

// ==========================================
// 5. TEMPLATE: LUXURY (Luxury White)
// ==========================================
export const TemplateLuxury: React.FC<TemplateProps> = ({ settings, services, accent, currentSlide }) => (
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
                {(settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl) ? (
                    <img
                        src={settings.heroSlides?.[currentSlide || 0]?.image || settings.heroImageUrl}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms]"
                        alt="Luxury"
                    />
                ) : <PlaceholderImage className="absolute inset-0 w-full h-full opacity-10" text="Lujo Absolute" />}
                <div className="relative z-20 text-center space-y-6 max-w-5xl px-8">
                    <h1 className="text-7xl md:text-[160px] font-playfair font-black tracking-tighter leading-[0.85] uppercase mb-4 transition-all duration-1000" style={{ color: accent }}>
                        {settings.heroSlides?.[currentSlide || 0]?.title || settings.businessName}
                    </h1>
                    <p className="text-2xl md:text-3xl font-light tracking-[0.2em] opacity-80 uppercase transition-all duration-1000">
                        {settings.heroSlides?.[currentSlide || 0]?.text || settings.slogan}
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
                                <img src={img.url} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" onError={(e) => (e.currentTarget.style.display = 'none')} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 px-8">
                    {services.map((s, i) => (
                        <div key={i} className="flex justify-between items-center py-10 border-b border-white/10 group hover:px-4 transition-all duration-500">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-zinc-900 flex-shrink-0">
                                    {s.imageUrl ? (
                                        <img src={s.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                    ) : <PlaceholderImage className="w-full h-full opacity-20" text="Service" />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">{s.name}</h3>
                                    <p className="text-zinc-500 text-sm max-w-sm">{s.description}</p>
                                </div>
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

        {/* Testimonials for Luxury */}
        {settings.testimonials && settings.testimonials.length > 0 && (
            <section className="py-40 bg-black px-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-5xl font-playfair font-black text-center mb-24 uppercase tracking-widest" style={{ color: accent }}>Experiencias Inolvidables</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        {settings.testimonials.map((t, i) => (
                            <div key={i} className="text-center space-y-8">
                                <Quote className="mx-auto opacity-20" size={40} style={{ color: accent }} />
                                <p className="text-xl font-light italic text-zinc-400 leading-relaxed">"{t.text}"</p>
                                <div className="h-px w-12 bg-white/20 mx-auto" />
                                <p className="font-black uppercase tracking-[0.4em] text-xs">{t.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )}
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
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-all duration-500 shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ background: `linear-gradient(135deg, ${accent}, #000)` }}>
                        <MessageCircle className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                </div>
            </a>
        )}

        {mobileMenuOpen && (
            <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl animate-entrance flex flex-col items-center justify-center p-12 text-center">
                <button onClick={() => setMobileMenuOpen(false)} className="absolute top-10 right-10 text-zinc-500 hover:text-white p-4"><X size={32} /></button>
                <div className="space-y-8">
                    {['Servicios', 'Nosotros', 'Galería'].map(item => (
                        <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="block text-4xl font-black text-white uppercase tracking-tighter hover:text-[var(--accent)] transition-colors">{item}</a>
                    ))}
                    <Link to="/book" onClick={() => setMobileMenuOpen(false)} className="block px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest text-black" style={{ backgroundColor: accent }}>Mi Cita</Link>
                </div>
            </div>
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
                    {slide.image ? (
                        <img src={slide.image} className={`w-full h-full object-cover transition-transform duration-[10000ms] ${index === currentSlide ? 'scale-110' : 'scale-100'}`} alt={slide.title} />
                    ) : <PlaceholderImage className="w-full h-full opacity-20" text="Elegancia" />}
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
                            <div className="h-[250px] overflow-hidden bg-zinc-900">
                                {s.imageUrl ? (
                                    <img src={s.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" />
                                ) : <PlaceholderImage className="w-full h-full opacity-40" text="Luxury Service" />}
                            </div>
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

        {/* Gallery for Classic */}
        {settings.images && settings.images.length > 0 && (
            <section id="galería" className="py-32 bg-[#050505] px-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-playfair font-black text-white text-center mb-20 uppercase tracking-tighter">Galería <span style={{ color: accent }}>Exclusiva</span></h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {settings.images.map((img, i) => (
                            <div key={i} className="aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl bg-zinc-900">
                                <img src={img.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[1200ms]" alt={`Classic Gallery ${i}`} onError={(e) => (e.currentTarget.style.display = 'none')} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* Testimonials for Classic */}
        {settings.testimonials && settings.testimonials.length > 0 && (
            <section className="py-32 bg-black px-8 border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {settings.testimonials.map((t, i) => (
                            <div key={i} className="p-12 rounded-[3.5rem] bg-[#0a0a0a] border border-white/5 space-y-8 relative overflow-hidden group">
                                <Quote className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity" size={120} style={{ color: accent }} />
                                <div className="flex gap-1">
                                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} className="fill-white text-white" />)}
                                </div>
                                <p className="text-xl font-light text-zinc-400 leading-relaxed italic">"{t.text}"</p>
                                <p className="font-black uppercase tracking-widest text-[10px]" style={{ color: accent }}>— {t.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )}
    </div>
);
