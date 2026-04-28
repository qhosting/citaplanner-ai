
import React from 'react';
import { X, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import { LandingSettings } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LandingSettings;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, settings }) => {
  if (!isOpen) return null;

  const whatsappLink = `https://wa.me/${(settings.whatsappPhone || settings.contactPhone || '').replace(/\D/g, '')}`;

  const accent = settings.primaryColor || '#D4AF37';

  return (
    <div className="fixed inset-0 z-[800] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-entrance">
      <div className="bg-[#0a0a0a] border w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl" style={{ borderColor: `${accent}4d`, boxShadow: `0 0 40px ${accent}1a` }}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Phone size={20} style={{ color: accent }} /> Contacto & Horarios
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-10 space-y-10">
          {/* Ubicación */}
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${accent}1a`, color: accent, borderColor: `${accent}33` }}>
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: accent }}>Visítanos</p>
              <p className="text-white font-medium text-sm leading-relaxed">{settings.address || "Dirección no disponible"}</p>
            </div>
          </div>

          {/* Teléfono & WhatsApp */}
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
              <MessageCircle size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Llamadas & WhatsApp</p>
              <p className="text-white font-black text-xl mb-4 tracking-tight">{settings.contactPhone || "Sin teléfono"}</p>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
              >
                Chat Directo <MessageCircle size={14} />
              </a>
            </div>
          </div>

          {/* Horarios */}
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
              <Clock size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Horarios de Atención</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Lunes a Viernes</span>
                  <span className="text-white font-bold">9:00 - 19:00</span>
                </div>
                <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Sábados</span>
                  <span className="text-white font-bold">9:00 - 15:00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Domingos</span>
                  <span className="text-rose-500 font-bold uppercase">Cerrado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-black/40 border-t border-white/5">
          <button 
            onClick={onClose}
            className="w-full py-4 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-xl"
            style={{ backgroundColor: accent }}
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
