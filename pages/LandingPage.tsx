
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Wand2, Scissors, 
  Loader2, Award, Star, Clock, MapPin, Instagram, Facebook,
  CalendarDays, Zap, Globe, Shield, Phone, Heart, 
  Menu, X, PlayCircle, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { LandingSettings, Service } from '../types';

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=2000",
    title: "Mirada",
    subtitle: "PERFECTA",
    text: "Técnicas de Microblading Hyper-Realista que resaltan tu expresión natural con precisión micrométrica."
  },
  {
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=2000",
    title: "Piel",
    subtitle: "DIAMANTE",
    text: "Protocolos avanzados de regeneración facial fusionando tecnología alemana y activos orgánicos premium."
  },
  {
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=2000",
    title: "Labios",
    subtitle: "INFINITOS",
    text: "Pigmentación de alta gama para un color vibrante, simétrico y un volumen sofisticado que perdura."
  }
];

const DEFAULT_SETTINGS: LandingSettings = {
  businessName: 'Aurum Beauty Studio',
  primaryColor: '#C5A028',
  secondaryColor: '#1A1A1A',
  templateId: 'beauty',
  slogan: 'Redefiniendo la Estética de Ultra-Lujo',
  aboutText: 'Santuario de belleza líder en alta tecnología. Fusionamos arte y ciencia para crear resultados naturales y sofisticados que resaltan tu esencia única.',
  address: 'Presidente Masaryk 450, Polanco, CDMX',
  contactPhone: '+52 55 7142 7321'
};

export const LogoCitaplanner = ({ size = 20, color = "#C5A028" }: { size?: number, color?: string }) => (
  <div className="flex items-center gap-3 group cursor-default">
    <div className="p-2.5 rounded-xl text-white group-hover:scale-105 transition-transform duration-500 relative shadow-lg" style={{ background: `linear-gradient(135deg, ${color} 0%, #000 100%)` }}>
      <CalendarDays size={size} />
      <div className="absolute -top-1 -right-1 text-[#C5A028] animate-pulse">
        <Sparkles size={size * 0.6} fill="currentColor" />
      </div>
    </div>
    <div className="flex flex-col">
      <div className="flex items-center">
        <span className="font-black text-2xl tracking-tighter leading-none text-[#1A1A1A]">Cita</span>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection for Navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-slider logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = useCallback(() => setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length), []);
  const prevSlide = useCallback(() => setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);

  useEffect(() => {
    const init = async () => {
      try {
        const [s, sv] = await Promise.all([
          api.getLandingSettings(),
          api.getServices()
        ]);
        if (s) setSettings(s);
        if (sv && sv.length > 0) {
          setServices(sv);
        } else {
          // Fallback manual si el backend no tiene servicios aún
          setServices([
            { id: '1', name: 'Microblading Hyper-Realist', price: 4500, duration: 120, category: 'Cejas', status: 'ACTIVE', description: 'Simulación de vello natural con pigmentos de grado médico.' },
            { id: '2', name: 'Lip Blush Diamond', price: 3800, duration: 90, category: 'Labios', status: 'ACTIVE', description: 'Definición y color semi-permanente para unos labios perfectos.' },
            { id: '3', name: 'Hydrafacial Elite', price: 2100, duration: 60, category: 'Facial', status: 'ACTIVE', description: 'Limpieza profunda, exfoliación e hidratación intensiva.' }
          ]);
        }
      } catch (error) {
        console.error("Error loading landing:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-inter selection:bg-[#C5A028] selection:text-white overflow-x-hidden scroll-smooth">
      
      {/* Navigation - Ultra Glassmorphism */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-700 ${scrolled ? 'bg-white/80 backdrop-blur-2xl py-4 border-b border-[#C5A028]/10' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <LogoCitaplanner color={scrolled ? "#C5A028" : "#C5A028"} />
          
          <div className="hidden lg:flex items-center gap-12">
            <a href="#services" className={`font-bold text-[10px] uppercase tracking-[0.3em] transition-all ${scrolled ? 'text-slate-600' : 'text-white/80'} hover:text-[#C5A028]`}>Servicios</a>
            <a href="#about" className={`font-bold text-[10px] uppercase tracking-[0.3em] transition-all ${scrolled ? 'text-slate-600' : 'text-white/80'} hover:text-[#C5A028]`}>Nosotros</a>
            <Link to="/login" className={`font-bold text-[10px] uppercase tracking-[0.3em] transition-all ${scrolled ? 'text-slate-400' : 'text-white/40'} hover:text-[#C5A028]`}>Staff</Link>
            <Link 
              to="/book" 
              className={`px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 ${scrolled ? 'bg-[#1A1A1A] text-white' : 'bg-white text-black'}`}
            >
              Agendar Ritual <ArrowRight size={14} />
            </Link>
          </div>

          <button className={`lg:hidden ${scrolled ? 'text-slate-800' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-0 bg-white z-[90] p-12 flex flex-col gap-10 animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
               <LogoCitaplanner />
               <button onClick={() => setMobileMenuOpen(false)}><X size={32} /></button>
            </div>
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-4xl font-playfair font-black text-[#1A1A1A]">Servicios</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-4xl font-playfair font-black text-[#1A1A1A]">Sobre el Studio</a>
            <div className="mt-auto flex flex-col gap-4">
                <Link to="/book" className="text-center py-6 rounded-3xl bg-[#1A1A1A] text-white font-black uppercase tracking-widest text-sm">RESERVAR AHORA</Link>
                <Link to="/login" className="text-center py-6 text-slate-400 font-bold uppercase tracking-widest text-xs">Acceso Personal</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Cinematic Slider */}
      <section className="relative h-screen min-h-[750px] w-full bg-black overflow-hidden">
        {HERO_SLIDES.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-all duration-[2500ms] ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/50 z-10" />
            <img 
              src={slide.image} 
              className={`w-full h-full object-cover transition-transform duration-[10000ms] ${index === currentSlide ? 'scale-110' : 'scale-100'}`} 
              alt={slide.title} 
            />
            
            <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-6">
              <div className={`max-w-5xl transition-all duration-1000 delay-500 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                <span className="text-[11px] font-black uppercase tracking-[1em] text-[#C5A028] mb-8 block drop-shadow-lg">Exclusividad • Arte • Precisión</span>
                <h1 className="text-8xl md:text-[160px] font-playfair font-black text-white leading-none tracking-tighter mb-10">
                  {slide.title} <span className="italic font-light text-[#C5A028] drop-shadow-md">{slide.subtitle}</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed mb-14 drop-shadow">
                  {slide.text}
                </p>
                <div className="flex flex-col sm:flex-row gap-10 justify-center items-center">
                  <Link to="/book" className="gold-btn px-20 py-7 rounded-full text-[12px] uppercase tracking-[0.5em] font-black shadow-[0_30px_60px_-15px_rgba(197,160,40,0.5)]">Reservar Experiencia</Link>
                  <button className="flex items-center gap-5 group">
                    <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-[#C5A028] group-hover:border-[#C5A028] transition-all duration-500">
                      <PlayCircle className="text-white" size={28} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">Nuestra Filosofía</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Cinematic Slider Controls */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-12">
          <button onClick={prevSlide} className="text-white/40 hover:text-[#C5A028] transition-colors"><ChevronLeft size={32}/></button>
          <div className="flex gap-4">
             {HERO_SLIDES.map((_, i) => (
               <div key={i} className={`h-1 rounded-full transition-all duration-1000 ${i === currentSlide ? 'w-16 bg-[#C5A028]' : 'w-4 bg-white/20'}`} />
             ))}
          </div>
          <button onClick={nextSlide} className="text-white/40 hover:text-[#C5A028] transition-colors"><ChevronRight size={32}/></button>
        </div>
      </section>

      {/* Luxury Stats Bar */}
      <div className="bg-white py-16 border-b border-slate-50 relative z-30">
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-center md:justify-between items-center gap-16">
           <div className="text-center md:text-left">
              <p className="text-3xl font-playfair font-black text-[#1A1A1A]">15k+</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Tratamientos Éxito</p>
           </div>
           <div className="text-center md:text-left">
              <p className="text-3xl font-playfair font-black text-[#1A1A1A]">Elite</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Certificación Internacional</p>
           </div>
           <div className="text-center md:text-left">
              <p className="text-3xl font-playfair font-black text-[#1A1A1A]">99%</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Satisfacción Cliente</p>
           </div>
           <div className="text-center md:text-left">
              <p className="text-3xl font-playfair font-black text-[#1A1A1A]">2025</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Sede Polanco Node</p>
           </div>
        </div>
      </div>

      {/* Editorial Services Section */}
      <section id="services" className="py-48 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
           <div className="flex flex-col lg:flex-row justify-between items-end mb-32 gap-12">
              <div className="max-w-2xl">
                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-[#C5A028] mb-8 block">Le Menu d'Excellence</span>
                <h2 className="text-7xl md:text-[100px] font-playfair font-black text-[#1A1A1A] leading-[0.85] tracking-tighter">
                  Invierte en tu <br/> <span className="italic font-light text-[#C5A028]">Propia Mirada.</span>
                </h2>
              </div>
              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-md border-l-2 border-[#C5A028]/20 pl-10">
                Cada procedimiento es una obra maestra técnica diseñada para armonizar tus facciones naturales con pigmentos biocompatibles de última generación.
              </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {services.map((s, i) => (
                <div key={i} className="group bg-white p-16 rounded-[4.5rem] border border-slate-50 hover:shadow-[0_80px_120px_-40px_rgba(0,0,0,0.08)] transition-all duration-700 relative overflow-hidden hover:-translate-y-5">
                   <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-150 group-hover:text-[#C5A028] group-hover:opacity-10 transition-all duration-[1500ms]">
                      {s.category === 'Cejas' ? <Wand2 size={140} /> : <Sparkles size={140} />}
                   </div>
                   
                   <div className="flex justify-between items-start mb-16 relative z-10">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-[#C5A028] group-hover:bg-[#1A1A1A] group-hover:text-white transition-all duration-500 shadow-sm">
                          {s.category === 'Cejas' ? <Wand2 size={32} /> : s.category === 'Labios' ? <Heart size={32} /> : <Sparkles size={32} />}
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Inversión</p>
                         <span className="text-4xl font-playfair font-black text-[#1A1A1A]">${s.price}</span>
                      </div>
                   </div>
                   
                   <h3 className="text-3xl font-playfair font-bold text-[#1A1A1A] mb-8 group-hover:text-[#C5A028] transition-colors">{s.name}</h3>
                   <p className="text-slate-500 font-medium leading-relaxed mb-16 min-h-[100px] text-lg">
                      {s.description}
                   </p>
                   
                   <div className="flex items-center justify-between border-t border-slate-50 pt-12 relative z-10">
                        <div className="flex items-center gap-4 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                           <Clock size={20} className="text-[#C5A028]" /> {s.duration} MIN
                        </div>
                        <Link to="/book" className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.4em] text-[#1A1A1A] group-hover:translate-x-3 transition-transform">
                           RESERVAR <ArrowRight size={20} className="text-[#C5A028]" />
                        </Link>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Brand Narrative Section */}
      <section id="about" className="py-56 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(197,160,40,0.06)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
           <div className="relative order-2 lg:order-1">
              <div className="aspect-[4/5] bg-slate-800 rounded-[6rem] overflow-hidden shadow-2xl relative z-10 group border border-white/5">
                 <img src="https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[5000ms]" alt="Studio Atmosphere" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                 <div className="absolute bottom-20 left-20">
                    <span className="text-[11px] font-black uppercase tracking-[0.6em] text-[#C5A028] mb-6 block">Atmósfera Elite</span>
                    <h4 className="text-5xl font-playfair font-bold text-white leading-tight">Privacidad, Paz y <br/> Resultados de Clase Mundial.</h4>
                 </div>
              </div>
              <div className="absolute -bottom-12 -left-12 w-full h-full border-2 border-[#C5A028]/20 rounded-[6rem] -z-0" />
           </div>
           
           <div className="order-1 lg:order-2 text-white relative z-10">
              <span className="text-[11px] font-black uppercase tracking-[0.8em] text-[#C5A028] mb-12 block opacity-80">Nuestra Filosofía</span>
              <h2 className="text-7xl md:text-[90px] font-playfair font-black tracking-tighter mb-16 leading-[0.9]">
                Donde el <span className="italic font-light text-[#C5A028]">Arte</span> <br/> encuentra la <span className="text-[#C5A028]">Perfección.</span>
              </h2>
              <p className="text-2xl text-slate-400 font-light leading-relaxed mb-20 max-w-xl">
                {settings.aboutText} No creemos en la saturación, sino en la armonía. Cada trazo es una decisión técnica basada en proporciones áureas para revelar tu mejor versión.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
                 <div className="flex gap-8 items-start">
                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A028] shrink-0 shadow-lg">
                       <MapPin size={32}/>
                    </div>
                    <div>
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Master Node</p>
                       <p className="font-bold text-white text-xl leading-snug">{settings.address}</p>
                    </div>
                 </div>
                 <div className="flex gap-8 items-start">
                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A028] shrink-0 shadow-lg">
                       <Phone size={32}/>
                    </div>
                    <div>
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Concierge 24/7</p>
                       <p className="font-bold text-white text-xl leading-snug">{settings.contactPhone}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer Minimalista Elite */}
      <footer className="bg-[#050505] py-40 border-t border-white/5">
         <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-24">
               <div className="max-w-md">
                  <LogoCitaplanner size={36} color="#FFF" />
                  <p className="mt-12 text-slate-500 text-lg leading-relaxed italic opacity-60">
                    "La verdadera elegancia reside en la simplicidad de un trazo perfecto."
                  </p>
               </div>
               
               <div className="flex gap-24">
                  <div className="space-y-6">
                     <p className="text-[11px] font-black text-[#C5A028] uppercase tracking-[0.4em] mb-10">Conectar</p>
                     <a href="#" className="flex items-center gap-4 text-slate-400 hover:text-white transition-colors group">
                        <Instagram size={24} className="group-hover:text-[#C5A028] transition-colors" /> <span className="text-[11px] font-bold uppercase tracking-widest">Instagram</span>
                     </a>
                     <a href="#" className="flex items-center gap-4 text-slate-400 hover:text-white transition-colors group">
                        <Facebook size={24} className="group-hover:text-[#C5A028] transition-colors" /> <span className="text-[11px] font-bold uppercase tracking-widest">Facebook</span>
                     </a>
                  </div>
                  <div className="space-y-6">
                     <p className="text-[11px] font-black text-[#C5A028] uppercase tracking-[0.4em] mb-10">Protocolos</p>
                     <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Privacidad Master</p>
                     <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Términos de Servicio</p>
                  </div>
               </div>
            </div>
            
            <div className="mt-48 pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12">
               <p className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.6em]">© 2025 {settings.businessName}. Aurum Business Infrastructure.</p>
               <div className="flex items-center gap-12 opacity-40">
                  <span className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Shield size={16} className="text-[#C5A028]" /> Secure Sync
                  </span>
                  <span className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Globe size={16} className="text-[#C5A028]" /> Cloud Node Polanco
                  </span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};
