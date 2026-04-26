
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Loader2, Clock, MapPin, Instagram, Facebook,
  CalendarDays, Zap, Globe, Shield, Phone, Heart,
  Menu, X, MessageSquare, Eye, Mail, MessageCircle,
  Linkedin, Twitter, ShieldCheck, Activity, ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { LandingSettings, Service, Product } from '../types';
// WhatsApp button replaces AI chat widget — managed inline below
import {
  TemplateCitaPlanner,
  TemplateMaster,
  TemplateShulaStudio,
  TemplateMinimal,
  TemplateLuxury,
  TemplateClassic
} from '../components/LandingTemplates';
import { LogoCitaplanner } from '../components/LogoCitaplanner';

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



export const LandingPage: React.FC = () => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<LandingSettings>(DEFAULT_SETTINGS);


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
        const [s, sv, pv] = await Promise.allSettled([
          api.getLandingSettings(),
          api.getServices(),
          api.getProducts()
        ]);

        let finalSettings = DEFAULT_SETTINGS;
        if (s.status === 'fulfilled' && s.value) {
          finalSettings = { ...DEFAULT_SETTINGS, ...s.value };
          setSettings(finalSettings);
        }

        if (sv.status === 'fulfilled' && sv.value) {
          setAllServices(sv.value);
        }

        if (pv.status === 'fulfilled' && pv.value) {
          setAllProducts(pv.value);
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
    const servicesToDisplay = allServices.length > 0 ? allServices : (settings.services || []);
    if (servicesToDisplay.length > 0) {
      jsonLdData.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: 'Servicios',
        itemListElement: servicesToDisplay.map((s: any) => ({
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
  }, [settings, accent, canonicalUrl, allServices]);

  const slides = useMemo(() => {
    if (settings.heroSlides && settings.heroSlides.length > 0) return settings.heroSlides;
    // Rich fallback slides per template — siempre hay contenido visual
    const fallbacks: Record<string, { image: string; title: string; subtitle: string; text: string }[]> = {
      shulastudio: [
        { image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1400', title: settings.businessName || 'Shula Studio', subtitle: 'Arte & Precisión', text: settings.slogan || 'Donde el arte se encuentra con la elegancia.' },
        { image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80&w=1400', title: 'Tratamientos Elite', subtitle: 'Resultados Premium', text: 'Microblading y extensiones de pestañas a nivel galería.' },
        { image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80&w=1400', title: 'Experiencia VIP', subtitle: 'Lujo & Confort', text: 'Tu tratamiento, en un ambiente de ultra-lujo.' },
      ],
      shula_dark: [
        { image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1400', title: settings.businessName || 'Studio', subtitle: 'Lujo Oscuro', text: settings.slogan || 'Elegancia en cada detalle.' },
        { image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=1400', title: 'Faciales Premium', subtitle: 'Piel Perfecta', text: 'Tratamientos diseñados para potenciar tu belleza natural.' },
      ],
      master: [
        { image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1400', title: settings.businessName || 'Master Hub', subtitle: 'Red Certificada', text: settings.slogan || 'Excelencia operativa centralizada.' },
        { image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1400', title: 'Especialistas', subtitle: '150+ Profesionales', text: 'Certificados y listos para atenderte.' },
        { image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1400', title: 'Tratamientos', subtitle: 'Catálogo Completo', text: 'Desde faciales hasta tratamientos corporales.' },
      ],
      citaplanner: [
        { image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1400', title: settings.businessName || 'CitaPlanner', subtitle: 'Plataforma IA', text: settings.slogan || 'Tu negocio, en piloto automático.' },
        { image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1400', title: 'Analytics en Tiempo Real', subtitle: 'Data Intelligence', text: 'Insights para tomar decisiones más inteligentes.' },
      ],
    };
    const tid = settings.templateId as string;
    const templateSlides = fallbacks[tid] || [
      { image: settings.heroImageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1400', title: settings.businessName || 'CitaPlanner', subtitle: '', text: settings.slogan || 'Gestiona tu negocio con inteligencia.' },
      { image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1400', title: 'Profesionales', subtitle: 'Staff Elite', text: 'Especialistas certificados para tu bienestar.' },
      { image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80&w=1400', title: 'Tratamientos', subtitle: 'Catálogo Premium', text: 'Servicios diseñados para potenciar tu belleza.' },
    ];
    return templateSlides;
  }, [settings]);

  const waTarget = settings.whatsappPhone || settings.contactPhone;
  const whatsappLink = waTarget ? `https://wa.me/${waTarget.replace(/\D/g, '')}` : '#';

  // Landing services from web-builder or from database
  const landingServices = useMemo(() => {
    // 1. Prioritize Production Services selected via IDs
    const selectedIds = settings.serviceIds || [];
    if (selectedIds.length > 0 && allServices.length > 0) {
      return allServices.filter(s => selectedIds.includes(s.id));
    }

    // 2. Fallback: If no IDs selected, show top 6 active production services
    if (allServices.length > 0) {
      return allServices.filter(s => s.status === 'ACTIVE').slice(0, 6);
    }
    
    // 3. Last Resort: Web-builder manually configured services (legacy/demo)
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
  }, [allServices, settings.serviceIds, settings.services]);

  // Products from production
  const landingProducts = useMemo(() => {
    const selectedIds = settings.productIds || [];
    if (selectedIds.length > 0 && allProducts.length > 0) {
      return allProducts.filter(p => selectedIds.includes(p.id));
    }
    return [];
  }, [allProducts, settings.productIds]);

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

  const renderTemplate = () => {
    const props = { settings, services: landingServices, products: landingProducts, accent, currentSlide, slides };

    switch (settings.templateId) {
      case 'citaplanner': return <TemplateCitaPlanner {...props} />;
      case 'master': return <TemplateMaster {...props} />;
      case 'shulastudio': return <TemplateShulaStudio {...props} />;
      case 'aurum_minimal': return <TemplateMinimal {...props} />;
      case 'luxury_white': return <TemplateLuxury {...props} />;
      case 'shula_dark': return <TemplateShulaStudio {...props} />;
      default: return (
        <TemplateClassic
          {...props}
          scrolled={scrolled}
          slides={slides}
          waTarget={waTarget}
          whatsappLink={whatsappLink}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]" style={{ '--accent': accent } as React.CSSProperties}>
      {renderTemplate()}

      {/* Common Footer (Enhanced) */}
      {settings.templateId !== 'shulastudio' && settings.templateId !== 'shula_dark' && (
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
      )}

      {/* Floating WhatsApp Button */}
      {waTarget && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{ backgroundColor: '#25D366' }}
          title={`Contactar por WhatsApp`}
        >
          {/* WhatsApp SVG oficial */}
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 fill-white">
            <path d="M16.003 3C9.375 3 4 8.376 4 15.003c0 2.132.557 4.133 1.528 5.87L4 29l8.392-1.49A12.913 12.913 0 0016.003 28C22.63 28 28 22.625 28 15.997 28 9.373 22.63 3 16.003 3zm6.38 18.376c-.265.744-1.548 1.418-2.116 1.508-.545.087-1.234.124-1.99-.124-.46-.147-1.05-.344-1.808-.673-3.184-1.375-5.262-4.557-5.42-4.767-.159-.21-1.295-1.72-1.295-3.28 0-1.56.82-2.33 1.11-2.645.291-.316.635-.395.847-.395.211 0 .423.002.607.01.195.009.456-.074.713.544.265.636.9 2.196.979 2.355.079.159.132.344.026.554-.105.211-.158.342-.316.527-.158.185-.332.413-.475.554-.158.155-.323.323-.138.634.185.31.822 1.356 1.764 2.197 1.212 1.08 2.235 1.414 2.546 1.572.31.158.49.133.67-.08.185-.211.79-.924 1.001-1.24.211-.317.422-.264.71-.158.291.105 1.85.873 2.168 1.031.317.158.528.237.607.37.079.132.079.764-.185 1.503z"/>
          </svg>
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: '#25D366' }} />
        </a>
      )}
    </div>
  );
};
