
import React, { useState } from 'react';
import { Instagram, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { LogoCitaplanner } from './LogoCitaplanner';
import { LegalModal } from './LegalModal';
import { LandingSettings } from '../types';
import { SYSTEM_VERSION } from '../src/version';

interface FooterProps {
  settings: LandingSettings;
  accent?: string;
}

export const Footer: React.FC<FooterProps> = ({ settings, accent = '#D4AF37' }) => {
  const [legalType, setLegalType] = useState<'PRIVACY' | 'TERMS' | null>(null);

  // Hidden for Shula Studio as it has its own footer in TemplateShulaStudio
  // But we allow it for other pages like /book even if tenant is Shula
  const isShulaTemplate = settings.templateId === 'shulastudio' || settings.templateId === 'shula_dark';

  return (
    <>
      <footer className="bg-[#050505] pt-32 pb-12 border-t border-white/5 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-20 mb-20">
            <div className="space-y-6">
              <LogoCitaplanner color={accent} customUrl={settings.logoUrl} businessName={settings.businessName} />
              <p className="text-zinc-500 text-xs leading-relaxed">
                {settings.footerText || "Experiencia de salud y bienestar diseñada para tu estilo de vida."}
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 border-l-2 pl-4" style={{ borderColor: accent }}>Encuéntranos</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">{settings.address || "Visita nuestro estudio"}</p>
              <p className="text-zinc-300 font-bold mt-4 text-sm">{settings.contactPhone}</p>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 border-l-2 pl-4" style={{ borderColor: accent }}>Síguenos</h4>
              <div className="flex gap-4">
                {settings.socialInstagram && (
                  <a href={settings.socialInstagram.startsWith('http') ? settings.socialInstagram : `https://instagram.com/${settings.socialInstagram}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-colors">
                    <Instagram size={20} />
                  </a>
                )}
                {settings.socialFacebook && (
                  <a href={settings.socialFacebook.startsWith('http') ? settings.socialFacebook : `https://facebook.com/${settings.socialFacebook}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-colors">
                    <Facebook size={20} />
                  </a>
                )}
                {settings.socialTwitter && (
                  <a href={settings.socialTwitter.startsWith('http') ? settings.socialTwitter : `https://twitter.com/${settings.socialTwitter}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white transition-colors">
                    <Twitter size={20} />
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5">
              <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Servidor en Línea
              </div>
              <p className="text-zinc-500 text-[10px] leading-relaxed">Infraestructura Aurum Nexus v5.0 segura con cifrado de grado militar.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 pt-12">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-4">
              <span>© {new Date().getFullYear()} {settings.businessName}</span>
              <span className="opacity-30">|</span>
              <span className="opacity-50">v{SYSTEM_VERSION}</span>
            </p>
            <div className="flex gap-10">
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
