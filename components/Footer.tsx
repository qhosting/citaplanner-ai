
import React, { useState } from 'react';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import { LegalModal } from './LegalModal';
import { LandingSettings } from '../types';
import { SYSTEM_VERSION } from '../src/version';

interface FooterProps {
  settings: LandingSettings;
  accent?: string;
}

export const Footer: React.FC<FooterProps> = ({ settings, accent = '#D4AF37' }) => {
  const [legalType, setLegalType] = useState<'PRIVACY' | 'TERMS' | null>(null);

  return (
    <>
      <footer className="bg-[#050505] py-12 border-t border-white/5 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-4">
            {/* Left: Copyright & Version */}
            <div className="flex flex-col items-center md:items-start">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-4">
                <span>© {new Date().getFullYear()} {settings.businessName}</span>
                <span className="opacity-30">|</span>
                <span className="opacity-50 font-mono">v{SYSTEM_VERSION}</span>
              </p>
            </div>
            
            {/* Center: Social Icons */}
            <div className="flex gap-8 items-center">
              {settings.socialInstagram && (
                <a href={settings.socialInstagram.startsWith('http') ? settings.socialInstagram : `https://instagram.com/${settings.socialInstagram}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                  <Instagram size={18} />
                </a>
              )}
              {settings.socialFacebook && (
                <a href={settings.socialFacebook.startsWith('http') ? settings.socialFacebook : `https://facebook.com/${settings.socialFacebook}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                  <Facebook size={18} />
                </a>
              )}
              {settings.socialTwitter && (
                <a href={settings.socialTwitter.startsWith('http') ? settings.socialTwitter : `https://twitter.com/${settings.socialTwitter}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                  <Twitter size={18} />
                </a>
              )}
            </div>

            {/* Right: Legal Links */}
            <div className="flex gap-10 items-center">
              <span onClick={() => setLegalType('PRIVACY')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all cursor-pointer">Privacidad</span>
              <span onClick={() => setLegalType('TERMS')} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all cursor-pointer">Términos</span>
            </div>
          </div>
        </div>
      </footer>

      <LegalModal 
        type={legalType} 
        onClose={() => setLegalType(null)} 
        settings={settings} 
      />
    </>
  );
};
