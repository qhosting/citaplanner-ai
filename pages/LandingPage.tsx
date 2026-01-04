
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Wand2, Scissors, 
  Loader2, Award, Star, Clock, MapPin, Instagram, Facebook,
  ShieldCheck, CalendarDays, Zap, Globe, Shield, Phone, Heart, BriefcaseMedical, ImageIcon
} from 'lucide-react';
import { api } from '../services/api';
import { LandingSettings, Service, TemplateId } from '../types';

// Fallback constants to ensure page ALWAYS renders
const DEFAULT_SETTINGS: LandingSettings = {
  businessName: 'CitaPlanner Elite',
  primaryColor: '#630E14',
  secondaryColor: '#C5A028',
  templateId: 'citaplanner',
  slogan: 'Gestión de Lujo Simplificada',
  aboutText: 'Plataforma líder en gestión de citas y negocios de belleza.',
  address: 'Av. Principal 123, CDMX',
  contactPhone: '+52 55 1234 5678'
};

export const LogoCitaplanner = ({ size = 20, color = "#630E14" }: { size?: number, color?: string }) => (
  <div className="flex items-center gap-3 group">
    <div className="p-2 rounded-xl text-white group-hover:scale-110 transition-transform relative" style={{ background: `linear-gradient(135deg, ${color || '#630E14'} 0%, #111 100%)` }}>
      <CalendarDays size={size} />
      <div className="absolute -top-1 -right-1 text-[#C5A028]">
        <Sparkles size={12} fill="currentColor" />
      </div>
    </div>
    <div className="flex flex-col">
      <div className="flex items-center">
        <span className="font-black text-2xl tracking-tighter leading-none" style={{ color: color || '#630E14' }}>Cita</span>
        <span className="font-black text-2xl tracking-tighter brand-text-gold leading-none" style={{ color: '#C5A028' }}>Planner</span>
      </div>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em]">Business Suite</span>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        // Attempt to fetch data, but don't block render indefinitely if it fails
        const [s, sv] = await Promise.all([
          api.getLandingSettings().catch(() => DEFAULT_SETTINGS),
          api.getServices().catch(() => [])
        ]);
        
        if (isMounted) {
          // Merge with defaults to ensure no missing keys
          setSettings(prev => ({ ...prev, ...(s || DEFAULT_SETTINGS) }));
          setServices(sv || []);
        }
      } catch (error) {
        console.error("Error cargando la Landing Page, usando defaults:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#630E14]" size={40} /></div>;

  // Use current settings (which includes defaults)
  const { templateId, primaryColor, businessName, slogan, aboutText, address, contactPhone } = settings;

  const getThemeStyles = (tid: TemplateId) => {
    switch (tid) {
      case 'beauty':
        return {
          icon: <Sparkles className="text-[#C5A028]" />,
          heroClass: "bg-white",
          accentText: "text-[#8B5E66]",
          buttonClass: "bg-[#8B5E66] text-white",
          cardIcon: <Heart className="text-[#8B5E66]" />
        };
      case 'dentist':
        return {
          icon: <ShieldCheck className="text-[#C5A028]" />,
          heroClass: "bg-slate-50",
          accentText: "text-[#0A192F]",
          buttonClass: "bg-[#0A192F] text-white",
          cardIcon: <BriefcaseMedical className="text-[#0A192F]" />
        };
      case 'barber':
        return {
          icon: <Scissors className="text-[#C5A028]" />,
          heroClass: "bg-[#FDFBF7]",
          accentText: "text-[#1B3022]",
          buttonClass: "bg-[#1B3022] text-white",
          cardIcon: <Award className="text-[#1B3022]" />
        };
      default:
        return {
          icon: <Zap className="text-[#C5A028]" />,
          heroClass: "bg-white",
          accentText: "text-[#630E14]",
          buttonClass: "bg-[#630E14] text-white",
          cardIcon: <Zap className="text-[#630E14]" />
        };
    }
  };

  const theme = getThemeStyles(templateId || 'citaplanner');

  // Safe split for business name with fallback
  const safeName = businessName || 'CitaPlanner Elite';
  const nameParts = safeName.split(' ');
  const firstName = nameParts[0];
  const secondName = nameParts.slice(1).join(' ') || 'Studio';

  return (
    <div className="min-h-screen bg-white font-inter selection:bg-slate-900 selection:text-white scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
          {templateId === 'citaplanner' ? (
             <LogoCitaplanner color={primaryColor} />
          ) : (
            <div className="flex items-center gap-4">
               <div style={{ backgroundColor: primaryColor }} className="p-3 rounded-2xl text-white shadow-xl">
                  {theme.icon}
               </div>
               <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">{safeName}</h1>
            </div>
          )}
          
          <div className="hidden md:flex items-center gap-12">
            <a href="#services" className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-colors">Servicios</a>
            <a href="#about" className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-colors">Nosotros</a>
            <Link to="/login" className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-colors">Staff Login</Link>
            <Link 
              to="/book" 
              style={{ backgroundColor: primaryColor }}
              className="px-10 py-4 rounded-full text-white font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
            >
              Reservar Experiencia
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`pt-48 pb-32 relative overflow-hidden ${theme.heroClass}`}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-3 mb-8 bg-slate-900/5 px-4 py-2 rounded-full border border-slate-900/10">
               {theme.icon}
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Membresía Exclusiva</span>
            </div>
            <h1 className="text-7xl lg:text-[90px] font-black text-slate-900 leading-[0.85] tracking-tighter mb-10">
              {firstName} <br/>
              <span className="italic font-light" style={{ color: '#C5A028' }}>{secondName}</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-lg font-medium">
              {slogan}. Bienvenidos a un estándar superior de cuidado y distinción.
            </p>
            <div className="mt-14 flex flex-col sm:flex-row gap-8 items-center">
              <Link 
                to="/book" 
                style={{ backgroundColor: primaryColor }}
                className="px-16 py-6 rounded-[2.5rem] text-white text-xs font-black uppercase tracking-[0.3em] shadow-[0_30px_60px_rgba(0,0,0,0.2)] hover:translate-y-[-4px] transition-all"
              >
                Solicitar Cita
              </Link>
              <div className="flex -space-x-4">
                {[1,2,3].map(i => <div key={i} className="w-14 h-14 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center font-black text-slate-300 text-xs shadow-xl">CP</div>)}
                <div className="pl-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confianza Elite</p>
                    <p className="text-sm font-black text-slate-900">+500 Miembros</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative group animate-fade-in-up delay-200">
             <div className="absolute -top-10 -right-10 w-48 h-48 border border-[#C5A028]/20 rounded-full animate-pulse"></div>
             <div className="aspect-[4/5] bg-slate-900 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.3)] border-[12px] border-white relative">
                {settings.heroImageUrl && (
                  <img src={settings.heroImageUrl} className="w-full h-full object-cover opacity-70 grayscale-[20%]" alt={safeName} />
                )}
                {!settings.heroImageUrl && (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                    <ImageIcon size={64} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute bottom-10 left-10 text-white">
                   <p className="text-xs font-black uppercase tracking-[0.4em] text-[#C5A028] mb-2">Petición Abierta</p>
                   <p className="text-2xl font-black">Agenda Otoño 2025</p>
                </div>
             </div>
             <div className="absolute -bottom-10 -left-10 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 max-w-[280px] hidden md:block">
                <Award style={{ color: '#C5A028' }} className="mb-4" size={32} />
                <p className="text-sm font-black text-slate-900 leading-tight">Certificación Elite de Servicio & Calidad Platinum</p>
             </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-40 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center max-w-2xl mx-auto mb-24">
              <span style={{ color: primaryColor }} className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">Menú de Tratamientos</span>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-8 leading-none">Nuestra Selección <br/> Curada de Excelencia.</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {services.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-[4rem] border border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando catálogo de servicios...</p>
                </div>
              ) : (
                services.slice(0, 6).map((s, i) => (
                  <div key={i} className="bg-white p-12 rounded-[4rem] border border-slate-100 hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }} className="w-20 h-20 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                        {theme.cardIcon}
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">{s.name}</h3>
                    <p className="text-slate-400 font-medium leading-relaxed mb-10 line-clamp-2">{s.description || 'Una experiencia personalizada diseñada para elevar tus sentidos y resaltar tu esencia única.'}</p>
                    <div className="flex justify-between items-end border-t border-slate-50 pt-8">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión</p>
                          <p className="text-2xl font-black text-slate-900">${s.price}</p>
                        </div>
                        <Link to="/book" style={{ color: primaryColor }} className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-2 transition-transform">Reservar <ArrowRight size={16}/></Link>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
           <div className="relative">
              <div className="aspect-square bg-slate-900 rounded-[5rem] overflow-hidden shadow-2xl">
                 <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=2070" className="w-full h-full object-cover opacity-50" alt="Club Atmosphere" />
              </div>
              <div className="text-white p-12 rounded-[4rem] shadow-2xl border-4 border-white max-w-[300px] absolute -bottom-10 -right-10" style={{ backgroundColor: '#C5A028' }}>
                 <p className="text-5xl font-black mb-2 leading-none">10+</p>
                 <p className="text-xs font-black uppercase tracking-widest">Años Elevando <br/> Estándares.</p>
              </div>
           </div>
           <div>
              <span style={{ color: primaryColor }} className="text-[10px] font-black uppercase tracking-[0.5em] mb-6 block">Nuestra Herencia</span>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-10 leading-none">Más que un Negocio, <br/> un Club Privado.</h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
                {aboutText || 'Nuestra filosofía se basa en la atención al detalle y la búsqueda constante de la perfección estética. Cada tratamiento es una obra de arte diseñada exclusivamente para usted.'}
              </p>
              <div className="space-y-8">
                 <div className="flex gap-6 items-start">
                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-400"><MapPin size={24}/></div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visítanos</p>
                       <p className="font-black text-lg text-slate-900">{address}</p>
                    </div>
                 </div>
                 <div className="flex gap-6 items-start">
                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-400"><Phone size={24}/></div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Línea Directa Elite</p>
                       <p className="font-black text-lg text-slate-900">{contactPhone}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-32 text-white relative overflow-hidden">
         <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(to top, ${primaryColor}, transparent)` }}></div>
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-20 items-center">
               <div>
                  {templateId === 'citaplanner' ? (
                    <LogoCitaplanner size={32} color="#FFF" />
                  ) : (
                    <div className="flex flex-col gap-4">
                       <h1 className="text-4xl font-black tracking-tighter uppercase">{safeName}</h1>
                       <p className="text-slate-500 font-medium max-w-xs">{slogan}</p>
                    </div>
                  )}
               </div>
               <div className="flex justify-center gap-12">
                  <a href="#" className="p-4 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors hover:bg-white/10"><Instagram size={24}/></a>
                  <a href="#" className="p-4 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors hover:bg-white/10"><Facebook size={24}/></a>
               </div>
               <div className="text-center md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Experiencia Asegurada por</p>
                  <LogoCitaplanner size={18} color="#C5A028" />
               </div>
            </div>
            <div className="mt-20 pt-10 border-t border-white/5 text-center">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">© 2025 {safeName}. Miembro del CitaPlanner Business Network.</p>
            </div>
         </div>
      </footer>
    </div>
  );
};
