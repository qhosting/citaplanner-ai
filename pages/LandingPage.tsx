
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
import { WhatsAppButton } from '../components/WhatsAppButton';
import { SYSTEM_VERSION } from '../src/version';
import { Footer } from '../components/Footer';
import { LegalModal } from '../components/LegalModal';
import { ContactModal } from '../components/ContactModal';

const DEFAULT_SETTINGS: LandingSettings = {
  businessName: 'Luxury Business',
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
    console.log(`%c CitaPlanner SaaS %c v${SYSTEM_VERSION} `, "background:#6366f1;color:#fff;padding:4px;border-radius:4px 0 0 4px;font-weight:bold;", "background:#1e293b;color:#fff;padding:4px;border-radius:0 4px 4px 0;");
    const init = async () => {
      try {
        const [s, sv, pv] = await Promise.allSettled([
          api.getLandingSettings(),
          api.getServices(),
          api.getProducts()
        ]);

        let finalSettings = DEFAULT_SETTINGS;
        if (s.status === 'fulfilled' && s.value && s.value.success) {
          console.log(`[LANDING DEBUG] Settings extracted for tenant:`, s.value.value);
          finalSettings = { ...DEFAULT_SETTINGS, ...s.value.value };
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
    (window as any).setMobileMenuOpen = setMobileMenuOpen;
    (window as any).setLegalModal = (val: any) => setLegalType(val);
    return () => {
      window.removeEventListener('message', handleMessage);
      delete (window as any).setMobileMenuOpen;
      delete (window as any).setLegalModal;
    };
  }, []);

  const [legalType, setLegalType] = useState<'PRIVACY' | 'TERMS' | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // === FULL SEO/GEO ENGINE ===
  useEffect(() => {
    const cleanBizName = (settings.businessName || '').trim();
    const pageTitle = settings.seoTitle || (cleanBizName ? `${cleanBizName} — Reservas` : 'Luxury Business — Reservas');
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
        { image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1400', title: settings.businessName || 'Studio', subtitle: '', text: settings.slogan || 'Elegancia en cada detalle.' },
        { image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=1400', title: 'Faciales Premium', subtitle: '', text: 'Tratamientos diseñados para potenciar tu belleza natural.' },
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

    // INJECTION: Si existe una heroImageUrl del usuario, forzarla en el primer slide del template seleccionado
    if (settings.heroImageUrl && templateSlides.length > 0) {
      templateSlides[0].image = settings.heroImageUrl;
    }

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
    const props = { 
      settings, 
      services: landingServices, 
      products: landingProducts, 
      accent, 
      currentSlide, 
      slides,
      onContactClick: () => setContactModalOpen(true),
      setMobileMenuOpen
    };

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
          waTarget={waTarget}
          whatsappLink={whatsappLink}
          mobileMenuOpen={mobileMenuOpen}
        />
      );
    }
  };

  return (
    <>
      <LegalModal type={legalType} onClose={() => setLegalType(null)} settings={settings} />
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} settings={settings} />

      <div className="min-h-screen bg-[#050505]" style={{ '--accent': accent } as React.CSSProperties}>
      {renderTemplate()}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl animate-entrance flex flex-col p-10">
          <div className="flex justify-between items-center mb-16">
            <LogoCitaplanner color={accent} businessName={settings.businessName} customUrl={settings.logoUrl} />
            <button onClick={() => setMobileMenuOpen(false)} className="p-4 text-white/50 hover:text-white bg-white/5 rounded-2xl">
              <X size={32} />
            </button>
          </div>
          
          <nav className="flex flex-col gap-8">
            {['Servicios', 'Nosotros', 'Galería'].map((item, i) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                onClick={() => setMobileMenuOpen(false)}
                className="text-4xl font-black text-white uppercase tracking-tighter hover:text-[#CE4676] transition-colors animate-entrance"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {item}
              </a>
            ))}
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                setContactModalOpen(true);
              }}
              className="text-4xl font-black text-white uppercase tracking-tighter hover:text-[#CE4676] transition-colors text-left"
            >
              Contacto
            </button>
            <Link 
              to="/book" 
              onClick={() => setMobileMenuOpen(false)}
              className="mt-8 px-10 py-6 rounded-3xl text-white text-center font-black text-xs uppercase tracking-widest shadow-2xl"
              style={{ backgroundColor: accent }}
            >
              Agendar Ahora
            </Link>
          </nav>

          <div className="mt-auto pt-10 border-t border-white/5 flex gap-6 justify-center">
             {settings.socialInstagram && <a href={`https://instagram.com/${settings.socialInstagram}`} className="text-white/40 hover:text-white"><Instagram size={24} /></a>}
             {settings.socialFacebook && <a href={`https://facebook.com/${settings.socialFacebook}`} className="text-white/40 hover:text-white"><Facebook size={24} /></a>}
             {waTarget && <a href={whatsappLink} className="text-white/40 hover:text-white"><MessageCircle size={24} /></a>}
          </div>
        </div>
      )}

      {/* Universal Footer */}
      <Footer settings={settings} accent={accent} />

      {/* WhatsApp Floating Button */}
      <WhatsAppButton phone={settings.whatsappPhone || settings.contactPhone} />
    </div>
    </>
  );
};
