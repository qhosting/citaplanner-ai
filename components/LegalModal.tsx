
import React from 'react';
import { X } from 'lucide-react';
import { LandingSettings } from '../types';

interface LegalModalProps {
  type: 'PRIVACY' | 'TERMS' | null;
  onClose: () => void;
  settings: LandingSettings;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, settings }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-entrance">
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            {type === 'PRIVACY' ? 'Aviso de Privacidad' : 'Términos y Condiciones'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar text-zinc-400 text-sm leading-relaxed space-y-6 bg-black/20">
          {type === 'PRIVACY' ? (
            <>
              <div className="space-y-2">
                <p className="font-black text-white uppercase tracking-[0.2em] text-[9px]">Responsable del Tratamiento</p>
                <p>En cumplimiento con la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> de México, se informa que <strong>{settings.businessName || 'El Establecimiento'}</strong> es el responsable del tratamiento de sus datos personales.</p>
              </div>
              <div className="space-y-2">
                <p className="font-black text-white uppercase tracking-[0.2em] text-[9px]">Finalidades</p>
                <p>Sus datos (nombre, teléfono y preferencias de servicio) serán utilizados exclusivamente para la gestión de su cita, confirmaciones vía WhatsApp y facturación.</p>
              </div>
              <div className="space-y-2">
                <p className="font-black text-white uppercase tracking-[0.2em] text-[9px]">Derechos ARCO</p>
                <p>Para ejercer sus derechos de Acceso, Rectificación, Cancelación u Oposición, favor de contactarnos directamente a través de los canales oficiales publicados en este sitio.</p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="font-black text-white uppercase tracking-[0.2em] text-[9px]">Uso del Servicio</p>
                <p>Al reservar una cita a través de esta plataforma, usted acepta las políticas de operación, puntualidad y cancelación de <strong>{settings.businessName || 'El Establecimiento'}</strong>.</p>
              </div>
              <div className="space-y-2">
                <p className="font-black text-white uppercase tracking-[0.2em] text-[9px]">Políticas de Cancelación</p>
                <p>Conforme a la <strong>Ley Federal de Protección al Consumidor</strong>, las cancelaciones deben realizarse con el tiempo de anticipación estipulado por el estudio para evitar cargos administrativos o pérdida de anticipos.</p>
              </div>
            </>
          )}
        </div>
        <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-10 py-4 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl hover:opacity-90"
            style={{ backgroundColor: settings.primaryColor || '#D4AF37' }}
          >
            Cerrar Aviso
          </button>
        </div>
      </div>
    </div>
  );
};
