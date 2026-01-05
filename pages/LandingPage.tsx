
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Loader2, Clock, MapPin, Instagram, Facebook,
  CalendarDays, Zap, Globe, Shield, Phone, Heart, 
  Menu, X, MessageSquare, Eye, Mail, MessageCircle,
  Linkedin, Twitter, ShieldCheck, Activity, ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { LandingSettings, Service } from '../types';

const DEFAULT_SETTINGS: LandingSettings = {
  businessName: 'Aurum Beauty Studio',
  primaryColor: '#C5A028',
  secondaryColor: '#1A1A1A',
  templateId: 'beauty',
  slogan: 'Redefiniendo la Estética de Ultra-Lujo',
  aboutText: 'Santuario de belleza líder en alta tecnología. Fusionamos arte y ciencia para crear resultados naturales y sofisticados.',
  address: 'Presidente Masaryk 450, Polanco, CDMX',
  contactPhone: '+52 55 7142 7321',
  heroSlides: [],
  stats: [],
  socialLinks: {},
  testimonials: [],
  gallery: [],
  showWhatsappButton: true
};

export const LogoCitaplanner = ({ size = 20, color = "#C5A028", customUrl }: { size?: number, color?: string, customUrl?: string }) => (
  <div className="flex items-center gap-3 group cursor-default">
    {customUrl ? (
      <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
        <img src={customUrl} className="w-full h-full object-contain group-hover:scale-105 transition-transform" alt="Logo" />
      </div>
    ) : (
      <div className="p-2.5 rounded-xl text-white group-hover:scale-105 transition-transform duration-500 relative shadow-lg" style={{ background: `linear-gradient(135deg, ${color} 0%, #000 100%)` }}>
        <CalendarDays size={size} />
        <div className="absolute -top-1 -right-1 text-[#C5A028] animate-pulse">
          <Sparkles size={size * 0.6} fill="currentColor" />
        </div>
      </div>
    )}
    <div className="flex flex-col">
      <div className="flex items-center">
        <span className="font-black text-2xl tracking-tighter leading-none text-white">Cita</span>
        <span className="font-black text-2xl tracking-tighter leading-none" style={{ color: color }}>Planner</span>
      </div>
      <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-[0.4em]">Aurum Ecosystem</span>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (settings.heroSlides && settings.heroSlides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % (settings.heroSlides?.length || 1));
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [settings.heroSlides]);

  useEffect(() => {
    const init = async () => {
      try {
        const [s, sv] = await Promise.allSettled([
          api.getLandingSettings(),
          api.getServices()
        ]);
        
        if (s.status === 'fulfilled' && s.value) {
          setSettings({ ...DEFAULT_SETTINGS, ...s.value });
        }
        
        if (sv.status === 'fulfilled' && sv.value) {
          const activeServices = sv.value.filter(svItem => svItem.status === 'ACTIVE').slice(0, 3);
          setServices(activeServices.length > 0 ? activeServices : sv.value.slice(0, 3));
        }
      } catch (error) {
        console.error("Error loading landing:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const slides = settings.heroSlides && settings.heroSlides.length > 0 
    ? settings.heroSlides 
    : [{ image: "https://images.unsplash.com/photo-1560066984-138dadb4c035", title: "Citaplanner", subtitle: "ELITE", text: "Gestiona tu negocio con inteligencia." }];

  const whatsappLink = settings.contactPhone ? `https://wa.me/${settings.contactPhone.replace(/\D/g, '')}` : '#';

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 className="animate-spin text-[#D4AF37] mb-6" size={40} />
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Iniciando Protocolo Aurum...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-inter selection:bg-[#C5A028] selection:text-white overflow-x-hidden scroll-smooth">
      
      {/* Floating WhatsApp Concierge */}
      {settings.showWhatsappButton && settings.contactPhone && (
        <a 
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-[500] group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#C5A028] rounded-full animate-ping opacity-25 scale-125" />
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-[#C5A028] to-[#8C6F1B] flex items-center justify-center text-black shadow-[0_25px_60px_-15px_rgba(197,160,40,0.5)] hover:scale-110 transition-all duration-500">
               <MessageCircle className="w-8 h-8 md:w-10 md:h-10" />
            </div>
          </div>
        </a>
      )}

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-700 ${scrolled ? 'bg-black/90 backdrop-blur-2xl py-4 border-b border-[#C5A028]/20' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <LogoCitaplanner color={settings.primaryColor} customUrl={settings.logoUrl} />
          
          <div className="hidden lg:flex items-center gap-12">
            <a href="#services" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:text-[#C5A028]">Servicios</a>
            <a href="#about" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:text-[#C5A028]">Santuario</a>
            <Link to="/login" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/40 hover:text-[#C5A028]">Staff</Link>
            <Link to="/book" className="px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 bg-white text-black">
              Agendar Ritual <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[750px] w-full bg-black overflow-hidden">
        {slides.map((slide, index) => (
          <div key={index} className={`absolute inset-0 transition-all duration-[2500ms] ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/60 z-10" />
            <img src={slide.image} className={`w-full h-full object-cover transition-transform duration-[10000ms] ${index === currentSlide ? 'scale-110' : 'scale-100'}`} alt={slide.title} />
            <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-6">
              <div className={`max-w-5xl transition-all duration-1000 delay-500 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                <span className="text-[11px] font-black uppercase tracking-[1em] text-[#C5A028] mb-8 block">Exclusividad • Arte • Precisión</span>
                <h1 className="text-8xl md:text-[140px] font-playfair font-black text-white leading-none tracking-tighter mb-10">
                  {slide.title} <span className="italic font-light text-[#C5A028]">{slide.subtitle}</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed mb-14">{slide.text}</p>
                <Link to="/book" className="gold-btn px-20 py-7 rounded-full text-[12px] uppercase tracking-[0.5em] font-black inline-block">Reservar Experiencia</Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Services Section */}
      <section id="services" className="py-48 bg-[#050505] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
           <div className="mb-32">
              <span className="text-[11px] font-black uppercase tracking-[0.6em] text-[#C5A028] mb-8 block">Le Menu d'Excellence</span>
              <h2 className="text-7xl md:text-[100px] font-playfair font-black text-white leading-[0.85] tracking-tighter">
                Invierte en tu <br/> <span className="italic font-light text-[#C5A028]">Propia Mirada.</span>
              </h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {services.map((s, i) => (
                <div key={i} className="group bg-[#0a0a0a] rounded-[4.5rem] border border-white/5 hover:border-[#C5A028]/40 transition-all duration-700 relative overflow-hidden hover:-translate-y-5 shadow-2xl">
                   <div className="h-[300px] overflow-hidden relative">
                      <img src={s.imageUrl || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={s.name} />
                   </div>
                   <div className="p-12">
                      <span className="text-[9px] font-black text-[#C5A028] uppercase tracking-[0.4em] mb-6 block">{s.category}</span>
                      <h3 className="text-2xl font-playfair font-bold text-white mb-6 group-hover:text-[#C5A028] transition-colors">{s.name}</h3>
                      <p className="text-zinc-500 font-medium leading-relaxed mb-10 min-h-[80px]">{s.description || 'Protocolo exclusivo diseñado para armonizar tus rasgos.'}</p>
                      <div className="pt-8 border-t border-white/5">
                        <Link to="/book" className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white group-hover:text-[#C5A028] transition-all">RESERVAR EXPERIENCIA <ArrowRight size={18} className="text-[#C5A028]" /></Link>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* --- ELITE UPGRADED FOOTER --- */}
      <footer className="bg-[#050505] pt-32 pb-12 border-t border-white/5 relative overflow-hidden">
         {/* Subtle background glow */}
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#C5A028]/5 blur-[120px] rounded-full pointer-events-none" />
         
         <div className="max-w-7xl mx-auto px-8 relative z-10">
            {/* Top Footer: Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-24">
               {/* Column 1: Brand */}
               <div className="lg:col-span-4 space-y-10">
                  <LogoCitaplanner size={32} color={settings.primaryColor} customUrl={settings.logoUrl} />
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                    {settings.businessName} opera bajo los estándares del ecosistema de capital Aurum. Fusionamos alta tecnología con protocolos de estética de nivel máster para resultados sin precedentes.
                  </p>
                  <div className="flex items-center gap-4">
                    <a href={settings.socialLinks?.instagram || '#'} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#C5A028] hover:border-[#C5A028]/40 transition-all">
                      <Instagram size={20} />
                    </a>
                    <a href={settings.socialLinks?.facebook || '#'} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#C5A028] hover:border-[#C5A028]/40 transition-all">
                      <Facebook size={20} />
                    </a>
                    <a href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#C5A028] hover:border-[#C5A028]/40 transition-all">
                      <Linkedin size={20} />
                    </a>
                  </div>
               </div>

               {/* Column 2: Navigation */}
               <div className="lg:col-span-2 space-y-10">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] border-l-2 border-[#C5A028] pl-4">Navegación</h4>
                  <ul className="space-y-4">
                    {['Inicio', 'Servicios', 'Santuario', 'Agendar'].map((item) => (
                      <li key={item}>
                        <a href={`#${item.toLowerCase()}`} className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group">
                          <div className="w-1 h-1 rounded-full bg-[#C5A028] scale-0 group-hover:scale-100 transition-transform" /> {item}
                        </a>
                      </li>
                    ))}
                  </ul>
               </div>

               {/* Column 3: Contact */}
               <div className="lg:col-span-3 space-y-10">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] border-l-2 border-[#C5A028] pl-4">Contacto Elite</h4>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <MapPin size={18} className="text-[#C5A028] shrink-0" />
                      <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">{settings.address}</p>
                    </div>
                    <div className="flex gap-4">
                      <Phone size={18} className="text-[#C5A028] shrink-0" />
                      <p className="text-zinc-400 text-[11px] font-black uppercase tracking-widest">{settings.contactPhone}</p>
                    </div>
                    <div className="flex gap-4">
                      <Mail size={18} className="text-[#C5A028] shrink-0" />
                      <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest">concierge@{settings.businessName.toLowerCase().replace(/\s/g, '')}.mx</p>
                    </div>
                  </div>
               </div>

               {/* Column 4: Network Status (Interactive Fake Component) */}
               <div className="lg:col-span-3">
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-tr from-white/[0.02] to-transparent">
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Network Status</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase">Live</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Node ID</span>
                        <span className="text-[9px] text-zinc-400 font-mono">AUM-NODE-MX-01</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Latency</span>
                        <span className="text-[9px] text-zinc-400 font-mono">14ms</span>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[#C5A028]">
                          <ShieldCheck size={12} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Aurum Shield Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-3">
                  <Shield size={16} className="text-zinc-700" />
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em]">
                    Socio Tecnológico Certificado por Aurum Capital Technology
                  </p>
               </div>
               
               <div className="flex items-center gap-10">
                  <a href="#" className="text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">Privacidad</a>
                  <a href="#" className="text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">Protocolos Legales</a>
                  <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="p-3 bg-white/5 rounded-xl text-zinc-500 hover:text-[#C5A028] transition-all border border-white/5">
                    <ChevronUp size={16} />
                  </button>
               </div>
            </div>

            <div className="mt-12 text-center">
               <p className="text-[8px] font-bold text-zinc-800 uppercase tracking-[1em] mb-4">In Precision We Trust</p>
               <div className="flex justify-center gap-4 text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">
                  <span>© 2026 {settings.businessName}</span>
                  <span className="text-zinc-900">|</span>
                  <span>Infrastructure by QHosting</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};
