
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Loader2, Clock, MapPin, Instagram, Facebook,
  CalendarDays, Zap, Globe, Shield, Phone, Heart, 
  Menu, X, MessageSquare, Eye, Mail, MessageCircle
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
        // Garantizamos que el loader desaparezca independientemente del éxito de la API
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
      
      {/* Floating WhatsApp Concierge - Ultra Luxury UI */}
      {settings.showWhatsappButton && settings.contactPhone && (
        <a 
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-[500] group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#C5A028] rounded-full animate-ping opacity-25 scale-125" />
            <div className="absolute inset-0 bg-[#C5A028] rounded-full animate-pulse opacity-10 scale-150" />
            
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-[#C5A028] to-[#8C6F1B] flex items-center justify-center text-black shadow-[0_25px_60px_-15px_rgba(197,160,40,0.5)] hover:scale-110 transition-all duration-500">
               <MessageCircle className="w-8 h-8 md:w-10 md:h-10" />
               <div className="absolute -right-1 -top-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-black" />
            </div>

            <div className="absolute right-24 md:right-28 top-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[2rem] whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 transition-all duration-500 pointer-events-none shadow-2xl">
               <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Concierge Elite Online</p>
               </div>
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

      {/* Hero Section Dynamic */}
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

      {/* Footer */}
      <footer className="bg-[#050505] pt-48 pb-20 border-t border-white/5 relative">
         <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32">
               <div className="space-y-10">
                  <LogoCitaplanner size={32} color={settings.primaryColor} customUrl={settings.logoUrl} />
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                     {settings.businessName} es un nodo de excelencia estética bajo estándares internacionales.
                  </p>
               </div>
               <div className="space-y-10">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] border-l-2 border-[#C5A028] pl-4">Contacto</h4>
                  <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">{settings.address}</p>
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{settings.contactPhone}</p>
               </div>
            </div>
            <div className="pt-20 border-t border-white/5 text-center">
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.5em]">Secure Node • Aurum Shield Active • © 2026 {settings.businessName}</p>
            </div>
         </div>
      </footer>
    </div>
  );
};
