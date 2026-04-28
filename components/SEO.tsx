
import React, { useEffect } from 'react';
import { LandingSettings } from '../types';

interface SEOProps {
  settings: LandingSettings;
  pageTitle?: string;
}

export const SEO: React.FC<SEOProps> = ({ settings, pageTitle }) => {
  useEffect(() => {
    const bizName = (settings.businessName || '').trim();
    const finalTitle = pageTitle || settings.seoTitle || (bizName ? `${bizName} — Reservas` : 'CitaPlanner — Gestión de Reservas');
    const pageDescription = settings.seoDescription || `${settings.businessName || 'CitaPlanner'} — ${settings.slogan || 'Reserva tu cita en línea'}. ${settings.address || ''}`;
    const heroImage = settings.heroImageUrl || settings.logoUrl || 'https://citaplanner.com/og-image.png';
    const canonicalUrl = typeof window !== 'undefined' ? window.location.href : 'https://citaplanner.com';

    // 1. Basic Tags
    document.title = finalTitle;
    
    const updateMeta = (nameOrProp: string, content: string, isProperty = false) => {
      if (!content) return;
      const selector = isProperty ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(isProperty ? 'property' : 'name', nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMeta('description', pageDescription);
    updateMeta('author', settings.businessName || 'CitaPlanner');
    if (settings.seoKeywords) updateMeta('keywords', settings.seoKeywords);

    // 2. Open Graph
    updateMeta('og:title', finalTitle, true);
    updateMeta('og:description', pageDescription, true);
    updateMeta('og:image', heroImage, true);
    updateMeta('og:url', canonicalUrl, true);
    updateMeta('og:site_name', settings.businessName || 'CitaPlanner', true);
    updateMeta('og:type', 'website', true);

    // 3. Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', pageDescription);
    updateMeta('twitter:image', heroImage);

    // 4. GEO
    if (settings.latitude && settings.longitude) {
      updateMeta('geo.position', `${settings.latitude};${settings.longitude}`);
      updateMeta('ICBM', `${settings.latitude}, ${settings.longitude}`);
    }
    if (settings.address) updateMeta('geo.placename', settings.address);

    // 5. Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

  }, [settings, pageTitle]);

  return null;
};
