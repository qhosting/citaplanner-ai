
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

  return (
    <div className="min-h-screen bg-[#050505] font-inter selection:text-white overflow-x-hidden scroll-smooth" style={{ '--accent': accent } as React.CSSProperties}>

      {/* Floating WhatsApp Concierge */}
      {(settings.showWhatsappButton ?? true) && waTarget && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-[500] group"
        >
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
          <LogoCitaplanner color={accent} customUrl={settings.logoUrl} businessName={settings.logoUrl ? undefined : settings.businessName} />

          <div className="hidden lg:flex items-center gap-10">
            <a href="#services" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:opacity-80" style={{ ['--hover-color' as any]: accent }}>Servicios</a>
            <a href="#about" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:opacity-80">Nosotros</a>
            {gallery.length > 0 && <a href="#gallery" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:opacity-80">Galería</a>}
            {settings.latitude && settings.longitude && <a href="#location" className="font-bold text-[10px] uppercase tracking-[0.3em] transition-all text-white/80 hover:opacity-80">Ubicación</a>}
            <div className="w-px h-4 bg-white/10 mx-2" />
            <Link to="/login" className="font-black text-[10px] uppercase tracking-[0.3em] transition-all text-white/60 hover:opacity-80 px-4 py-2 rounded-xl hover:bg-white/5">Staff</Link>
            <Link to="/book" className="px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 text-white" style={{ backgroundColor: accent }}>
              Mi Cita <ArrowRight size={14} />
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-3 text-white bg-white/5 rounded-xl border border-white/10">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl animate-entrance p-8 flex flex-col">
          <div className="flex justify-between items-center mb-20">
            <LogoCitaplanner color={accent} customUrl={settings.logoUrl} businessName={settings.logoUrl ? undefined : settings.businessName} />
            <button onClick={() => setMobileMenuOpen(false)} className="p-4 bg-white/5 rounded-2xl border" style={{ color: accent, borderColor: `${accent}33` }}>
              <X size={32} />
            </button>
          </div>
          <div className="flex flex-col gap-10 text-center">
            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-3xl font-black text-white uppercase tracking-tighter">Servicios</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-3xl font-black text-white uppercase tracking-tighter">Nosotros</a>
            <div className="h-px bg-white/10 w-24 mx-auto my-4" />
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-black uppercase tracking-[0.2em]" style={{ color: accent }}>Acceso Staff</Link>
            <Link to="/book" onClick={() => setMobileMenuOpen(false)} className="py-6 rounded-[2rem] text-sm uppercase tracking-[0.4em] font-black mx-auto w-full max-w-xs text-black" style={{ backgroundColor: accent }}>Reservar Ahora</Link>
          </div>
          <div className="mt-auto text-center border-t border-white/5 pt-10">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{settings.businessName}</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-screen min-h-[750px] w-full bg-black overflow-hidden" aria-label="Sección principal">
        {isShulaDark && (
          <div className="absolute inset-4 md:inset-8 border border-white/20 z-30 pointer-events-none rounded-[2rem] md:rounded-[4rem]" style={{ borderColor: `${accent}40` }} />
        )}
        {slides.map((slide, index) => (
          <div key={index} className={`absolute inset-0 transition-all duration-[2500ms] ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/60 z-10" />
            <img src={slide.image} className={`w-full h-full object-cover transition-transform duration-[10000ms] ${index === currentSlide ? 'scale-110' : 'scale-100'}`} alt={`${settings.businessName} — ${slide.title || 'Imagen principal'}`} loading="eager" />
            <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-6">
              <div className={`max-w-5xl transition-all duration-1000 delay-500 ${index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                {isShulaDark && (
                  <div className="inline-block px-4 py-2 border rounded-full mb-6 relative overflow-hidden" style={{ borderColor: `${accent}80` }}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: accent }} />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] relative z-10 text-white">PREMIUM STUDIO</span>
                  </div>
                )}
                <span className="text-[11px] font-black uppercase tracking-[1em] mb-8 block" style={{ color: accent }}>{settings.seoKeywords?.split(',')[0] || settings.businessName}</span>
                <h1 className={`text-6xl md:text-[120px] font-playfair font-black leading-none tracking-tighter mb-10 ${isShulaDark ? 'text-transparent bg-clip-text' : 'text-white'}`} style={isShulaDark ? { backgroundImage: `linear-gradient(to right, #fff, ${accent})` } : {}}>
                  {slide.title} {slide.subtitle && <span className="italic font-light" style={{ color: accent, WebkitTextFillColor: accent }}>{slide.subtitle}</span>}
                </h1>
                <p className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed mb-14">{slide.text}</p>
                <Link to="/book" className={`px-20 py-7 rounded-full text-[12px] uppercase tracking-[0.5em] font-black inline-block text-black ${isShulaDark ? 'shadow-[0_0_40px_rgba(212,175,55,0.3)]' : ''}`} style={{ backgroundColor: accent }} aria-label={`Reservar cita en ${settings.businessName}`}>
                  Reservar Experiencia
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* About Section */}
      {settings.aboutText && (
        <section id="about" className="py-32 md:py-48 bg-[#050505] relative overflow-hidden" aria-label="Sobre nosotros">
          <div className="max-w-5xl mx-auto px-8 text-center">
            <span className="text-[11px] font-black uppercase tracking-[0.6em] mb-8 block" style={{ color: accent }}>Sobre Nosotros</span>
            <h2 className="text-4xl md:text-6xl font-playfair font-black text-white leading-tight tracking-tighter mb-12">
              {settings.businessName}
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 font-light leading-relaxed max-w-3xl mx-auto">{settings.aboutText}</p>
          </div>
        </section>
      )}

      {/* Services Section */}
      {landingServices.length > 0 && (
        <section id="services" className="py-32 md:py-48 bg-[#050505] relative overflow-hidden" aria-label="Servicios">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-20 md:mb-32">
              <span className="text-[11px] font-black uppercase tracking-[0.6em] mb-8 block" style={{ color: accent }}>Nuestros Servicios</span>
              <h2 className="text-5xl md:text-[80px] font-playfair font-black text-white leading-[0.85] tracking-tighter">
                Descubre lo que <br /> <span className="italic font-light" style={{ color: accent }}>ofrecemos.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16">
              {landingServices.map((s: any, i: number) => (
                <article key={s.id || i} className="group bg-[#0a0a0a] rounded-[3rem] md:rounded-[4.5rem] border border-white/5 transition-all duration-700 relative overflow-hidden hover:-translate-y-5 shadow-2xl" style={{ ['--card-hover-border' as any]: `${accent}66` }}>
                  {s.imageUrl && (
                    <div className="h-[250px] md:h-[300px] overflow-hidden relative">
                      <img src={s.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={`${s.name} — Servicio de ${settings.businessName}`} loading="lazy" />
                    </div>
                  )}
                  <div className="p-8 md:p-12">
                    {s.category && <span className="text-[9px] font-black uppercase tracking-[0.4em] mb-6 block" style={{ color: accent }}>{s.category}</span>}
                    <h3 className="text-xl md:text-2xl font-playfair font-bold text-white mb-4 md:mb-6 group-hover:transition-colors" style={{ ['--hover' as any]: accent }}>{s.name}</h3>
                    <p className="text-zinc-500 font-medium leading-relaxed mb-8 md:mb-10 min-h-[60px]">{s.description || ''}</p>
                    {s.price && (
                      <div className="flex items-center justify-between pt-6 md:pt-8 border-t border-white/5">
                        <span className="text-2xl font-black" style={{ color: accent }}>${typeof s.price === 'number' ? s.price.toLocaleString() : s.price}</span>
                        <Link to="/book" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:opacity-80 transition-all" aria-label={`Reservar ${s.name}`}>
                          RESERVAR <ArrowRight size={16} style={{ color: accent }} />
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <section id="gallery" className="py-32 md:py-48 bg-[#050505]" aria-label="Galería de trabajos">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-20">
              <span className="text-[11px] font-black uppercase tracking-[0.6em] mb-8 block" style={{ color: accent }}>Galería</span>
              <h2 className="text-5xl md:text-[80px] font-playfair font-black text-white leading-[0.85] tracking-tighter">
                Nuestro <span className="italic font-light" style={{ color: accent }}>trabajo.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((img: any, i: number) => (
                <figure key={i} className="group relative rounded-3xl overflow-hidden aspect-[4/3]">
                  <img src={img.url || img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={img.caption || `${settings.businessName} — Trabajo ${i + 1}`} loading="lazy" />
                  {img.caption && (
                    <figcaption className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <p className="text-white text-sm font-bold">{img.caption}</p>
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Google Maps Embed — GEO Optimization */}
      {settings.latitude && settings.longitude && (
        <section id="location" className="bg-[#050505] py-24" aria-label="Ubicación del negocio">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-16">
              <span className="text-[11px] font-black uppercase tracking-[0.6em] mb-8 block" style={{ color: accent }}>Ubicación</span>
              <h2 className="text-5xl md:text-[80px] font-playfair font-black text-white leading-[0.85] tracking-tighter">
                Encuéntranos <span className="italic font-light" style={{ color: accent }}>aquí.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl h-[400px]">
                <iframe
                  title={`Ubicación de ${settings.businessName}`}
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${settings.latitude},${settings.longitude}&zoom=16&language=es`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex flex-col justify-center space-y-8">
                {settings.address && (
                  <div className="flex gap-4">
                    <MapPin size={24} className="shrink-0" style={{ color: accent }} />
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Dirección</p>
                      <p className="text-white font-bold text-sm leading-relaxed">{settings.address}</p>
                    </div>
                  </div>
                )}
                {settings.contactPhone && (
                  <div className="flex gap-4">
                    <Phone size={24} className="shrink-0" style={{ color: accent }} />
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Teléfono</p>
                      <a href={`tel:${settings.contactPhone}`} className="text-white font-bold text-sm hover:underline">{settings.contactPhone}</a>
                    </div>
                  </div>
                )}
                <Link to="/book" className="mt-4 px-10 py-5 rounded-full text-[10px] uppercase tracking-[0.4em] font-black text-black text-center shadow-2xl" style={{ backgroundColor: accent }}>
                  Agendar Visita
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- FOOTER --- */}
      <footer className="bg-[#050505] pt-32 pb-12 border-t border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: `${accent}0D` }} />

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-24">
            {/* Column 1: Brand */}
            <div className="lg:col-span-4 space-y-10">
              <LogoCitaplanner size={32} color={accent} customUrl={settings.logoUrl} businessName={settings.logoUrl ? undefined : settings.businessName} />
              <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                {settings.footerText || `${settings.businessName} — Sistema de reservas y gestión profesional.`}
              </p>
              <div className="flex items-center gap-4">
                {(settings.socialInstagram) && (
                  <a href={settings.socialInstagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:border-opacity-40 transition-all" style={{ ['--hover-color' as any]: accent }}>
                    <Instagram size={20} />
                  </a>
                )}
                {(settings.socialFacebook) && (
                  <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 transition-all">
                    <Facebook size={20} />
                  </a>
                )}
                {(settings.socialTwitter) && (
                  <a href={settings.socialTwitter} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 transition-all">
                    <Twitter size={20} />
                  </a>
                )}
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div className="lg:col-span-2 space-y-10">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] pl-4" style={{ borderLeft: `2px solid ${accent}` }}>Navegación</h4>
              <ul className="space-y-4">
                {['Inicio', 'Servicios', 'Nosotros'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group">
                      <div className="w-1 h-1 rounded-full scale-0 group-hover:scale-100 transition-transform" style={{ backgroundColor: accent }} /> {item}
                    </a>
                  </li>
                ))}
                <li>
                  <Link to="/login" className="text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group" style={{ color: accent }}>
                    <ShieldCheck size={14} /> Acceso Staff
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div className="lg:col-span-3 space-y-10">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] pl-4" style={{ borderLeft: `2px solid ${accent}` }}>Contacto</h4>
              <div className="space-y-6">
                {settings.address && (
                  <div className="flex gap-4">
                    <MapPin size={18} className="shrink-0" style={{ color: accent }} />
                    {settings.googleMapsUrl ? (
                      <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed hover:text-white transition-colors">{settings.address}</a>
                    ) : (
                      <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">{settings.address}</p>
                    )}
                  </div>
                )}
                {settings.contactPhone && (
                  <div className="flex gap-4">
                    <Phone size={18} className="shrink-0" style={{ color: accent }} />
                    <p className="text-zinc-400 text-[11px] font-black uppercase tracking-widest">{settings.contactPhone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 4: Network Status */}
            <div className="lg:col-span-3">
              <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-tr from-white/[0.02] to-transparent">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[9px] font-black text-white uppercase tracking-[0.3em]">System Status</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase">Online</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Platform</span>
                    <span className="text-[9px] text-zinc-400 font-mono">CitaPlanner</span>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2" style={{ color: accent }}>
                      <ShieldCheck size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Reservas Activas</span>
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
                {settings.businessName} • {new Date().getFullYear()}
              </p>
            </div>

            <div className="flex items-center gap-10">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-3 bg-white/5 rounded-xl text-zinc-500 hover:opacity-80 transition-all border border-white/5">
                <ChevronUp size={16} />
              </button>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="flex justify-center gap-4 text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">
              <span>© {new Date().getFullYear()} {settings.businessName}</span>
              <span className="text-zinc-900">|</span>
              <span>Powered by CitaPlanner</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
