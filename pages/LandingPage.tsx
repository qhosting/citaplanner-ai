
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Wand2, Scissors, 
  Loader2, Award, Star, Clock, MapPin, Instagram, Facebook,
  CalendarDays, Zap, Globe, Shield, Phone, Heart, 
  Menu, X, PlayCircle, ChevronLeft, ChevronRight, CheckCircle2,
  Quote, MessageSquare, Eye, Mail, MessageCircle
} from 'lucide-react';
import { api } from '../services/api';
import { LandingSettings, Service, HeroSlide, LandingStat, Testimonial } from '../types';

const DEFAULT_SETTINGS: LandingSettings = {
  businessName: 'Aurum Beauty Studio',
  primaryColor: '#C5A028',
  secondaryColor: '#1A1A1A',
  templateId: 'beauty',
  slogan: 'Redefiniendo la Estética de Ultra-Lujo',
  aboutText: 'Santuario de belleza líder en alta tecnología. Fusionamos arte y ciencia para crear resultados naturales y sofisticados que resaltan tu esencia única.',
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
      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.4em]">Aurum Ecosystem</span>
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
        const [s, sv] = await Promise.all([
          api.getLandingSettings(),
          api.getServices()
        ]);
        if (s) setSettings(s);
        const activeServices = sv.filter(s => s.status === 'ACTIVE').slice(0, 3);
        setServices(activeServices.length > 0 ? activeServices : sv.slice(0, 3));
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

  return (
    <div className="min-h-screen bg-[#050505] font-inter selection:bg-[#C5A028] selection:text-white overflow-x-hidden scroll-smooth">
      
      {/* Floating WhatsApp Concierge */}
      {settings.showWhatsappButton && settings.contactPhone && (
        <a 
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-10 right-10 z-[200] group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#C5A028] rounded-full animate-ping opacity-20" />
            <div className="relative w-16 h-16 rounded-full gold-btn flex items-center justify-center text-black shadow-[0_20px_50px_rgba(197,160,40,0.4)] hover:scale-110 transition-transform duration-500">
               <MessageCircle size={32} />
               <div className="absolute right-0 top-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black" />
            </div>
            {/* Tooltip Elite */}
            <div className="absolute right-20 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
               <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Hablar con Concierge</p>
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
            <a href="#portfolio" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:text-[#C5A028]">Portafolio</a>
            <a href="#testimonials" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:text-[#C5A028]">VIP</a>
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
                <span className="text-[11px] font-black uppercase tracking-[1em] text-[#C5A028] mb-8 block drop-shadow-lg">Exclusividad • Arte • Precisión</span>
                <h1 className="text-8xl md:text-[140px] font-playfair font-black text-white leading-none tracking-tighter mb-10">
                  {slide.title} <span className="italic font-light text-[#C5A028] drop-shadow-md">{slide.subtitle}</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed mb-14">{slide.text}</p>
                <Link to="/book" className="gold-btn px-20 py-7 rounded-full text-[12px] uppercase tracking-[0.5em] font-black">Reservar Experiencia</Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Luxury Stats Bar Dynamic */}
      <div className="bg-[#0a0a0a] py-16 border-b border-white/5 relative z-30">
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-center md:justify-between items-center gap-16">
           {(settings.stats || []).map((s, i) => (
             <div key={i} className="text-center md:text-left">
                <p className="text-3xl font-playfair font-black text-white">{s.value}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{s.label}</p>
             </div>
           ))}
        </div>
      </div>

      <section id="services" className="py-48 bg-[#050505] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
           <div className="flex flex-col lg:flex-row justify-between items-end mb-32 gap-12">
              <div className="max-w-2xl">
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-[#C5A028] mb-8 block">Le Menu d'Excellence</span>
                <h2 className="text-7xl md:text-[100px] font-playfair font-black text-white leading-[0.85] tracking-tighter">
                  Invierte en tu <br/> <span className="italic font-light text-[#C5A028]">Propia Mirada.</span>
                </h2>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {services.map((s, i) => (
                <div key={i} className="group bg-[#0a0a0a] rounded-[4.5rem] border border-white/5 hover:border-[#C5A028]/40 transition-all duration-700 relative overflow-hidden hover:-translate-y-5 shadow-2xl">
                   <div className="h-[300px] overflow-hidden relative">
                      <img src={s.imageUrl || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={s.name} />
                      <div className="absolute top-8 right-8 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full border border-white/10"><span className="text-white font-black text-xl tracking-tighter">${s.price}</span></div>
                   </div>
                   <div className="p-12">
                      <span className="text-[9px] font-black text-[#C5A028] uppercase tracking-[0.4em] mb-6 block">{s.category}</span>
                      <h3 className="text-2xl font-playfair font-bold text-white mb-6 group-hover:text-[#C5A028] transition-colors">{s.name}</h3>
                      <p className="text-slate-500 font-medium leading-relaxed mb-10 min-h-[80px]">{s.description || 'Protocolo exclusivo diseñado para armonizar tus rasgos.'}</p>
                      <div className="pt-8 border-t border-white/5">
                        <Link to="/book" className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white group-hover:text-[#C5A028] transition-all">RESERVAR EXPERIENCIA <ArrowRight size={18} className="text-[#C5A028]" /></Link>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* PORTFOLIO SECTION */}
      {settings.gallery && settings.gallery.length > 0 && (
        <section id="portfolio" className="py-48 bg-[#0a0a0a]">
           <div className="max-w-7xl mx-auto px-8">
              <div className="text-center mb-32">
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-[#C5A028] mb-8 block">Galería Master</span>
                <h2 className="text-7xl font-playfair font-black text-white tracking-tighter uppercase">Resultados <br/> <span className="italic font-light text-[#C5A028]">Incomparables</span></h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {settings.gallery.map((img, i) => (
                    <div key={i} className={`group relative overflow-hidden rounded-[3rem] ${i % 3 === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                       <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye size={48} className="text-white/20" />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>
      )}

      {/* TESTIMONIALS SECTION */}
      {settings.testimonials && settings.testimonials.length > 0 && (
        <section id="testimonials" className="py-48 bg-[#050505]">
           <div className="max-w-7xl mx-auto px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
                 <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.6em] text-[#C5A028] mb-12 block">Voz del Cliente</span>
                    <h2 className="text-7xl font-playfair font-black text-white tracking-tighter uppercase leading-[0.9] mb-16">
                       Confianza <br/> <span className="italic font-light text-[#C5A028]">Certificada por <br/> el Prestigio.</span>
                    </h2>
                 </div>
                 <div className="space-y-12">
                    {settings.testimonials.map((t, i) => (
                       <div key={i} className="glass-card p-12 rounded-[4rem] border-white/5 relative group hover:border-[#C5A028]/20 transition-all">
                          <Quote className="absolute top-10 right-10 text-[#C5A028]/10" size={80} />
                          <p className="text-2xl font-light text-slate-300 leading-relaxed mb-10 italic">"{t.quote}"</p>
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#111] to-black border border-white/10 flex items-center justify-center font-black text-[#C5A028] text-xl">{t.name.charAt(0)}</div>
                             <div>
                                <h4 className="text-white font-black text-lg uppercase tracking-tight">{t.name}</h4>
                                <p className="text-[9px] font-black text-[#C5A028] uppercase tracking-[0.3em] mt-1">{t.role}</p>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>
      )}

      <section id="about" className="py-56 bg-[#0a0a0a] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
           <div className="relative">
              <div className="aspect-[4/5] bg-slate-800 rounded-[6rem] overflow-hidden shadow-2xl border border-white/5 group">
                 <img src="https://images.unsplash.com/photo-1596178065887-1198b6148b2b" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[5000ms]" alt="Studio" />
                 <div className="absolute bottom-20 left-20"><span className="text-[11px] font-black uppercase tracking-[0.6em] text-[#C5A028] mb-6 block">Atmósfera Elite</span><h4 className="text-5xl font-playfair font-bold text-white leading-tight">Privacidad y Resultados <br/> de Clase Mundial.</h4></div>
              </div>
           </div>
           <div className="text-white relative z-10">
              <span className="text-[11px] font-black uppercase tracking-[0.8em] text-[#C5A028] mb-12 block opacity-80">Nuestra Filosofía</span>
              <h2 className="text-7xl md:text-[90px] font-playfair font-black tracking-tighter mb-16 leading-[0.9]">
                {settings.slogan ? (
                  <>
                    {settings.slogan.split(' ').slice(0, Math.ceil(settings.slogan.split(' ').length / 2)).join(' ')} <br/>
                    <span className="italic font-light text-[#C5A028]">{settings.slogan.split(' ').slice(Math.ceil(settings.slogan.split(' ').length / 2)).join(' ')}</span>
                  </>
                ) : (
                  <>Donde el <span className="italic font-light text-[#C5A028]">Arte</span> <br/> encuentra la <span className="text-[#C5A028]">Perfección.</span></>
                )}
              </h2>
              <p className="text-2xl text-slate-400 font-light leading-relaxed mb-20">{settings.aboutText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
                 <div><p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Master Node</p><p className="font-bold text-white text-xl">{settings.address}</p></div>
                 <div><p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Concierge 24/7</p><p className="font-bold text-white text-xl">{settings.contactPhone}</p></div>
              </div>
           </div>
        </div>
      </section>

      {/* REDESIGNED MASTER FOOTER */}
      <footer className="bg-[#050505] pt-48 pb-20 border-t border-white/5 relative overflow-hidden">
         {/* Background Elements */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-[#C5A028]/40 to-transparent" />
         
         <div className="max-w-7xl mx-auto px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
               
               {/* Brand Story */}
               <div className="space-y-10">
                  <LogoCitaplanner size={32} color={settings.primaryColor} customUrl={settings.logoUrl} />
                  <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs uppercase tracking-wider">
                     {settings.businessName} es un nodo de excelencia estética diseñado para aquellos que buscan resultados quirúrgicos sin intervención, bajo los más altos estándares de tecnología internacional.
                  </p>
               </div>

               {/* Ritual Navigation */}
               <div className="space-y-10">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] border-l-2 border-[#C5A028] pl-4">El Ritual</h4>
                  <ul className="space-y-6">
                     {['Servicios', 'Portafolio', 'VIP Experience', 'Nosotros'].map((link) => (
                        <li key={link}>
                           <a href={`#${link.toLowerCase().split(' ')[0]}`} className="text-slate-500 hover:text-[#C5A028] text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                              {link}
                           </a>
                        </li>
                     ))}
                  </ul>
               </div>

               {/* Access & Contact */}
               <div className="space-y-10">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] border-l-2 border-[#C5A028] pl-4">Contacto Directo</h4>
                  <div className="space-y-8">
                     <div className="flex gap-4">
                        <MapPin size={16} className="text-[#C5A028] shrink-0" />
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-relaxed">{settings.address}</p>
                     </div>
                     <div className="flex gap-4">
                        <Phone size={16} className="text-[#C5A028] shrink-0" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{settings.contactPhone}</p>
                     </div>
                     <div className="flex gap-4">
                        <Mail size={16} className="text-[#C5A028] shrink-0" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">concierge@aurum.mx</p>
                     </div>
                  </div>
               </div>

               {/* Social Resonance */}
               <div className="space-y-10">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] border-l-2 border-[#C5A028] pl-4">Canales Elite</h4>
                  <div className="flex flex-wrap gap-5">
                     {settings.socialLinks?.instagram && (
                        <a href={settings.socialLinks.instagram} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:border-[#C5A028]/40 hover:bg-[#C5A028]/5 transition-all group">
                           <Instagram size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                     )}
                     {settings.socialLinks?.facebook && (
                        <a href={settings.socialLinks.facebook} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:border-[#C5A028]/40 hover:bg-[#C5A028]/5 transition-all group">
                           <Facebook size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                     )}
                     {settings.socialLinks?.tiktok && (
                        <a href={settings.socialLinks.tiktok} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:border-[#C5A028]/40 hover:bg-[#C5A028]/5 transition-all group">
                           <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                     )}
                  </div>
                  <div className="p-6 rounded-[2rem] bg-[#C5A028]/5 border border-[#C5A028]/10">
                     <p className="text-[8px] font-black text-[#C5A028] uppercase tracking-[0.3em] leading-relaxed">
                        Suscríbase a nuestra red privada para recibir actualizaciones exclusivas y accesos anticipados.
                     </p>
                  </div>
               </div>
            </div>

            {/* Bottom Bar Elite */}
            <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
               <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse" />
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">
                     Secure Node CDMX-NORTH-01 • Aurum Shield Active
                  </p>
               </div>
               
               <div className="flex items-center gap-10">
                  <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.6em]">
                     © 2026 {settings.businessName}
                  </p>
                  <div className="h-4 w-px bg-white/5" />
                  <a href="https://aurumcapital.mx" target="_blank" className="flex flex-col items-end group">
                     <span className="text-[7px] font-bold text-slate-800 uppercase tracking-[0.4em] mb-1">Powered by</span>
                     <span className="text-[9px] font-black text-slate-500 group-hover:text-[#C5A028] transition-colors tracking-widest uppercase">Aurum Capital Ecosystem</span>
                  </a>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};
