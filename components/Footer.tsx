
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

  // Social Links Normalization
  const instagram = settings.socialInstagram || settings.socialLinks?.instagram;
  const facebook = settings.socialFacebook || settings.socialLinks?.facebook;
  const twitter = settings.socialTwitter || settings.socialLinks?.twitter;

  return (
    <>
      <footer className="bg-[#050505] py-8 border-t border-white/5 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-4">
            {/* Left: Copyright & Version */}
            <div className="flex flex-col items-center md:items-start">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-4 flex-wrap justify-center md:justify-start">
                <span>© {new Date().getFullYear()} {settings.businessName}</span>
                <span className="opacity-30">|</span>
                <a 
                  href="https://citaplanner.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="opacity-50">Powered by</span>
                  <span className="text-slate-300">CitaPlanner</span>
                </a>
                <span className="opacity-30">|</span>
                <span className="opacity-50 font-mono">v{SYSTEM_VERSION}</span>
              </p>
            </div>
            
            {/* Center: Social Icons */}
            <div className="flex gap-8 items-center">
              {instagram && (
                <a href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-all hover:scale-110">
                  <Instagram size={20} />
                </a>
              )}
              {facebook && (
                <a href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-all hover:scale-110">
                  <Facebook size={20} />
                </a>
              )}
              {twitter && (
                <a href={twitter.startsWith('http') ? twitter : `https://twitter.com/${twitter}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-all hover:scale-110">
                  <Twitter size={20} />
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
