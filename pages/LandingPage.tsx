
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Loader2, Clock, MapPin, Instagram, Facebook,
  CalendarDays, Zap, Globe, Shield, Phone, Heart,
  Menu, X, MessageSquare, Eye, Mail, MessageCircle,
  Linkedin, Twitter, ShieldCheck, Activity, ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { LandingSettings, Service } from '../types';
import { AIConciergeWidget } from '../components/AIConciergeWidget';

const DEFAULT_SETTINGS: LandingSettings = {
  businessName: 'CitaPlanner',
  primaryColor: '#C5A028',
  secondaryColor: '#1A1A1A',
  templateId: 'beauty',
  slogan: 'Redefiniendo la Estética de Ultra-Lujo',
  aboutText: 'Santuario de belleza líder en alta tecnología. Fusionamos arte y ciencia para crear resultados naturales y sofisticados.',
  address: 'Ubicación Central',
  contactPhone: '+52 55 0000 0000',
  heroSlides: [],
  stats: [],
  socialLinks: {},
  testimonials: [],
  images: [],
  showWhatsappButton: true
};

export const LogoCitaplanner = ({ size = 20, color = "#C5A028", customUrl, businessName }: { size?: number, color?: string, customUrl?: string, businessName?: string }) => (
  <div className="flex items-center gap-3 group cursor-default">
    {customUrl ? (
      <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
        <img src={customUrl} className="w-full h-full object-contain group-hover:scale-105 transition-transform" alt="Logo" />
      </div>
    ) : (
      <div className="p-2.5 rounded-xl text-white group-hover:scale-105 transition-transform duration-500 relative shadow-lg" style={{ background: `linear-gradient(135deg, ${color} 0%, #000 100%)` }}>
        <CalendarDays size={size} />
        <div className="absolute -top-1 -right-1 animate-pulse" style={{ color }}>
          <Sparkles size={size * 0.6} fill="currentColor" />
        </div>
      </div>
    )}
    <div className="flex flex-col">
      {businessName ? (
        <span className="font-black text-2xl tracking-tighter leading-none text-white">{businessName}</span>
      ) : (
        <div className="flex items-center">
          <span className="font-black text-2xl tracking-tighter leading-none text-white">Cita</span>
          <span className="font-black text-2xl tracking-tighter leading-none" style={{ color }}>Planner</span>
        </div>
      )}
      <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-[0.4em]">Powered by CitaPlanner</span>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic accent color from tenant settings
  const accent = settings.primaryColor || '#C5A028';
  const isShulaDark = settings.templateId === 'shula_dark';

  // SEO: Derive canonical URL from current window location
  const canonicalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://citaplanner.com';

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
          const activeServices = sv.value.filter(svItem => svItem.status === 'ACTIVE').slice(0, 6);
          setServices(activeServices.length > 0 ? activeServices : sv.value.slice(0, 6));
        }
      } catch (error) {
        console.error("Error loading landing:", error);
      } finally {
        setLoading(false);
      }
    };
    init();

    // --- PREVIEW ENGINE: Listen for real-time changes from Web Architect ---
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LANDING_PREVIEW_UPDATE') {
        const newSettings = event.data.settings;
        setSettings(prev => ({ ...prev, ...newSettings }));
        console.log("⚡ [PREVIEW] Settings updated via Architect");
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // === FULL SEO/GEO ENGINE ===
  useEffect(() => {
    const pageTitle = settings.seoTitle || `${settings.businessName} — Reservas en Línea`;
    const pageDescription = settings.seoDescription || `${settings.businessName} — ${settings.slogan || 'Reserva tu cita en línea'}. ${settings.address || ''}`;
    const heroImage = settings.heroImageUrl || settings.logoUrl || '';

    // 1. Title Tag
    document.title = pageTitle;

    // Helper to set/create meta tags by name or property
    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper for <link> tags
    const setLink = (rel: string, href: string) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    setMeta('name', 'description', pageDescription);
    if (settings.seoKeywords) setMeta('name', 'keywords', settings.seoKeywords);
    setMeta('name', 'robots', 'index, follow');
    setMeta('name', 'author', settings.businessName || 'CitaPlanner');

    // 3. Canonical URL
    setLink('canonical', canonicalUrl);

    // 4. Open Graph (Facebook, WhatsApp, LinkedIn)
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', pageDescription);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:site_name', settings.businessName || 'CitaPlanner');
    setMeta('property', 'og:locale', 'es_MX');
    if (heroImage) setMeta('property', 'og:image', heroImage);
    if (heroImage) setMeta('property', 'og:image:alt', `${settings.businessName} — ${settings.slogan || 'Portada'}`);

    // 5. Twitter Cards
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', pageDescription);
    if (heroImage) setMeta('name', 'twitter:image', heroImage);

    // 6. GEO Meta Tags
    if (settings.latitude && settings.longitude) {
      setMeta('name', 'geo.position', `${settings.latitude};${settings.longitude}`);
      setMeta('name', 'ICBM', `${settings.latitude}, ${settings.longitude}`);
    }
    if (settings.address) setMeta('name', 'geo.placename', settings.address);
    setMeta('name', 'geo.region', 'MX');

    // 7. Schema.org JSON-LD (LocalBusiness)
    const existingJsonLd = document.querySelector('script[data-seo="landing-jsonld"]');
    if (existingJsonLd) existingJsonLd.remove();

    const jsonLdData: any = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: settings.businessName || 'CitaPlanner',
      description: pageDescription,
      url: canonicalUrl,
      telephone: settings.contactPhone || undefined,
      address: settings.address ? {
        '@type': 'PostalAddress',
        streetAddress: settings.address,
        addressCountry: 'MX'
      } : undefined,
      image: heroImage || undefined,
      priceRange: '$$',
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '19:00'
      }
    };

    if (settings.latitude && settings.longitude) {
      jsonLdData.geo = {
        '@type': 'GeoCoordinates',
        latitude: settings.latitude,
        longitude: settings.longitude
      };
    }

    if (settings.socialInstagram || settings.socialFacebook) {
      jsonLdData.sameAs = [
        settings.socialInstagram,
        settings.socialFacebook,
        settings.socialTwitter
      ].filter(Boolean);
    }

    // Add services as offers
    const allServices = services.length > 0 ? services : (settings.services || []);
    if (allServices.length > 0) {
      jsonLdData.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: 'Servicios',
        itemListElement: allServices.map((s: any) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: s.name || s.title || 'Servicio',
            description: s.description || ''
          },
          price: typeof s.price === 'number' ? s.price : (s.price || '').replace(/[^0-9.]/g, '') || '0',
          priceCurrency: 'MXN'
        }))
      };
    }

    const scriptEl = document.createElement('script');
    scriptEl.type = 'application/ld+json';
    scriptEl.setAttribute('data-seo', 'landing-jsonld');
    scriptEl.textContent = JSON.stringify(jsonLdData);
    document.head.appendChild(scriptEl);

    // 8. Inject dynamic accent color as CSS variable
    document.documentElement.style.setProperty('--accent', accent);

    // Cleanup JSON-LD on unmount
    return () => {
      const el = document.querySelector('script[data-seo="landing-jsonld"]');
      if (el) el.remove();
    };
  }, [settings, accent, canonicalUrl, services]);

  const slides = useMemo(() => {
    if (settings.heroSlides && settings.heroSlides.length > 0) return settings.heroSlides;
    return [{
      image: settings.heroImageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035",
      title: settings.businessName || "CitaPlanner",
      subtitle: "",
      text: settings.slogan || "Gestiona tu negocio con inteligencia."
    }];
  }, [settings]);

  const waTarget = settings.whatsappPhone || settings.contactPhone;
  const whatsappLink = waTarget ? `https://wa.me/${waTarget.replace(/\D/g, '')}` : '#';

  // Landing services from web-builder or from database
  const landingServices = useMemo(() => {
    if (services.length > 0) return services;
    // Fallback to web-builder configured services
    if (settings.services && Array.isArray(settings.services) && settings.services.length > 0) {
      return settings.services.map((s: any, i: number) => ({
        id: `landing-${i}`,
        name: s.title || s.name || 'Servicio',
        description: s.description || '',
        price: s.price || '0',
        duration: 60,
        category: s.category || '',
        imageUrl: s.imageUrl || '',
        status: 'ACTIVE'
      }));
    }
    return [];
  }, [services, settings.services]);

  // Gallery from web-builder
  const gallery = useMemo(() => {
    if (settings.images && Array.isArray(settings.images) && settings.images.length > 0) return settings.images;
    return [];
  }, [settings.images]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black">
        <Loader2 className="animate-spin mb-6" style={{ color: accent }} size={40} />
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Cargando...</p>
      </div>
    );
  }

  // --- TEMPLATE COMPONENTS ---
  const TemplateMinimal = () => (
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
            <img src={settings.heroImageUrl || slides[0].image} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Nosotros</h2>
            <p className="text-lg text-zinc-500 leading-relaxed font-medium">{settings.aboutText}</p>
          </div>
        </div>
      </section>

      {/* Services Minimal */}
      <section className="py-24 bg-zinc-50 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {landingServices.map((s: any, i: number) => (
              <div key={i} className="p-10 bg-white rounded-[2rem] border border-zinc-200 shadow-sm hover:shadow-xl transition-all">
                <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">{s.name}</h3>
                <p className="text-zinc-500 mb-8 font-medium text-sm leading-relaxed">{s.description}</p>
                <div className="flex justify-between items-center pt-6 border-t border-zinc-100">
                  <span className="font-black text-lg" style={{ color: accent }}>{typeof s.price === 'number' ? `$${s.price}` : s.price}</span>
                  <Link to="/book" className="text-[10px] font-black uppercase tracking-widest hover:opacity-70" style={{ color: accent }}>Reservar</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const TemplateLuxury = () => (
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
          <img src={settings.heroImageUrl || slides[0].image} className="absolute inset-0 w-full h-full object-cover" />
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
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-32">
            <div className="space-y-12">
              <h2 className="text-[120px] font-playfair font-black leading-none opacity-10 absolute -translate-x-12 -translate-y-20">EST.</h2>
              <h2 className="text-5xl font-playfair font-black tracking-tighter" style={{ color: accent }}>Nuestra Filosofía</h2>
              <p className="text-2xl text-zinc-400 font-light leading-relaxed">{settings.aboutText}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {gallery.slice(0, 4).map((img: any, i: number) => (
                <div key={i} className={`aspect-[4/5] rounded-3xl overflow-hidden ${i % 2 !== 0 ? 'translate-y-12' : ''}`}>
                  <img src={img.url || img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
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
            {landingServices.map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-10 border-b border-white/10 group hover:px-8 transition-all duration-500">
                <div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">{s.name}</h3>
                  <p className="text-zinc-500 text-sm max-w-sm">{s.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black mb-2" style={{ color: accent }}>{typeof s.price === 'number' ? `$${s.price}` : s.price}</p>
                  <Link to="/book" className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Reservar ahora</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  // Default / Beauty Theme (Customized Classic)
  const TemplateClassic = () => (
    <div className="min-h-screen bg-[#050505] font-inter selection:text-white overflow-x-hidden scroll-smooth">
      {/* Floating WhatsApp Concierge */}
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

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[500] transition-all duration-700 ${scrolled ? 'bg-black/90 backdrop-blur-2xl py-4 shadow-2xl' : 'bg-transparent py-8'}`} style={scrolled ? { borderBottom: `1px solid ${accent}20` } : {}}>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <LogoCitaplanner color={accent} customUrl={settings.logoUrl} businessName={settings.businessName} />
          <div className="hidden lg:flex items-center gap-10">
            <a href="#services" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:opacity-80">Servicios</a>
            <a href="#about" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:opacity-80">Nosotros</a>
            {gallery.length > 0 && <a href="#gallery" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:opacity-80">Galería</a>}
            <Link to="/book" className="px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 text-white" style={{ backgroundColor: accent }}>
              Mi Cita <ArrowRight size={14} />
            </Link>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-3 text-white bg-white/5 rounded-xl border border-white/10"><Menu size={24} /></button>
        </div>
      </nav>

      {/* Hero */}
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

      {/* About */}
      <section id="about" className="py-32 md:py-48 bg-[#050505] text-center px-8">
        <span className="text-[11px] font-black uppercase tracking-[0.6em] mb-8 block" style={{ color: accent }}>Santuario de Belleza</span>
        <h2 className="text-4xl md:text-6xl font-playfair font-black text-white leading-tight tracking-tighter mb-12">{settings.businessName}</h2>
        <p className="text-lg md:text-xl text-zinc-400 font-light leading-relaxed max-w-3xl mx-auto">{settings.aboutText}</p>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-32 md:py-48 bg-[#050505] px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {landingServices.map((s: any, i: number) => (
              <article key={i} className="group bg-[#0a0a0a] rounded-[3rem] border border-white/5 transition-all duration-700 overflow-hidden hover:-translate-y-5 shadow-2xl">
                {s.imageUrl && <div className="h-[250px] overflow-hidden"><img src={s.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" /></div>}
                <div className="p-12">
                  <h3 className="text-2xl font-bold text-white mb-6">{s.name}</h3>
                  <p className="text-zinc-500 font-medium leading-relaxed mb-10 min-h-[60px]">{s.description}</p>
                  <div className="flex items-center justify-between pt-8 border-t border-white/5">
                    <span className="text-2xl font-black" style={{ color: accent }}>{typeof s.price === 'number' ? `$${s.price}` : s.price}</span>
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

  // Routing to templates
  const renderTemplate = () => {
    switch (settings.templateId) {
      case 'aurum_minimal': return <TemplateMinimal />;
      case 'luxury_white': // Using luxury but could be specialized later
      case 'luxury': return <TemplateLuxury />;
      case 'beauty':
      case 'citaplanner': return <TemplateClassic />;
      case 'shula_dark': return <TemplateLuxury />; // Shula dark uses Luxury layout but global styles make it look different
      default: return <TemplateClassic />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]" style={{ '--accent': accent } as React.CSSProperties}>
      {renderTemplate()}

      {/* Common Footer (Enhanced) */}
      <footer className="bg-[#050505] pt-32 pb-12 border-t border-white/5 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-20 mb-20">
            <div className="space-y-6">
              <LogoCitaplanner color={accent} customUrl={settings.logoUrl} businessName={settings.businessName} />
              <p className="text-zinc-500 text-xs leading-relaxed">{settings.footerText || "Experiencia de salud y bienestar diseñada para tu estilo de vida."}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 border-l-2 pl-4" style={{ borderColor: accent }}>Encuéntranos</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">{settings.address || "Visita nuestro estudio"}</p>
              <p className="text-zinc-300 font-bold mt-4 text-sm">{settings.contactPhone}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 border-l-2 pl-4" style={{ borderColor: accent }}>Síguenos</h4>
              <div className="flex gap-4">
                {settings.socialInstagram && <a href={settings.socialInstagram} className="text-zinc-600 hover:text-white transition-colors"><Instagram size={20} /></a>}
                {settings.socialFacebook && <a href={settings.socialFacebook} className="text-zinc-600 hover:text-white transition-colors"><Facebook size={20} /></a>}
                {settings.socialTwitter && <a href={settings.socialTwitter} className="text-zinc-600 hover:text-white transition-colors"><Twitter size={20} /></a>}
              </div>
            </div>
            <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Servidor en Línea
              </p>
              <p className="text-zinc-500 text-[10px] leading-relaxed">Infraestructura Aurum Nexus v5.0 segura con cifrado de grado militar.</p>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">© {new Date().getFullYear()} {settings.businessName} • Powered by CitaPlanner</p>
            <div className="flex gap-4">
              <Link to="/login" className="text-[9px] font-black text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors">Acceso de Staff</Link>
            </div>
          </div>
        </div>
      </footer>

      <AIConciergeWidget settings={settings} />
    </div>
  );
};
