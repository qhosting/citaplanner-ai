
import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Check, AlertTriangle, Scale, ScrollText } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: string) => void;
  clientName: string;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onClose, onConfirm, clientName }) => {
  const [hasRead, setHasRead] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-2xl rounded-[3.5rem] overflow-hidden border-[#D4AF37]/30 shadow-[0_0_80px_rgba(212,175,55,0.15)] animate-scale-in">
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-black border border-[#D4AF37]/30 text-[#D4AF37]">
              <Scale size={24} />
            </div>
            <div>
              <h3 className="font-black text-2xl text-white tracking-tighter uppercase">Consentimiento Informado</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Protocolo de Seguridad Aurum</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="bg-black/40 border border-white/5 rounded-3xl p-8 max-h-[40vh] overflow-y-auto custom-scrollbar space-y-6">
            <h4 className="font-black text-[#D4AF37] text-sm uppercase tracking-widest">Términos del Procedimiento</h4>
            <div className="text-slate-400 text-xs leading-relaxed space-y-4 font-medium">
              <p>Yo, <b>{clientName}</b>, por medio de la presente autorizo a los especialistas master de <b>Aurum Beauty Studio</b> a realizar el procedimiento de aplicación de pestañas y/o micropigmentación avanzada.</p>
              <p>Entiendo que los resultados pueden variar según el tipo de piel, cuidados posteriores y fisiología individual. He sido informado(a) sobre los materiales de grado médico utilizados y confirmo no tener alergias conocidas a los mismos.</p>
              <p>Acepto seguir estrictamente las instrucciones de post-tratamiento entregadas por mi especialista para garantizar la retención y salud del área tratada.</p>
              <p>Libero de responsabilidad al estudio por cualquier reacción adversa derivada de información omitida en mi ficha biométrica o por negligencia en los cuidados posteriores indicados.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-[#D4AF37]/5 p-6 rounded-2xl border border-[#D4AF37]/10">
            <AlertTriangle className="text-[#D4AF37] shrink-0" size={20} />
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
              Al confirmar, se generará una firma digital vinculada a su número telefónico y fecha actual, almacenada de forma segura en nuestro nodo de cumplimiento legal.
            </p>
          </div>

          <div className="flex flex-col gap-6">
             <label className="flex items-center gap-4 cursor-pointer group">
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${hasRead ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-black border-white/10'}`}>
                   <input type="checkbox" className="hidden" checked={hasRead} onChange={() => setHasRead(!hasRead)} />
                   {hasRead && <Check size={14} className="text-black font-black" />}
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">He leído y acepto los términos de conformidad</span>
             </label>

             <div className="flex gap-4">
                <button onClick={onClose} className="flex-1 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all">Cancelar</button>
                <button 
                  disabled={!hasRead}
                  onClick={() => onConfirm('ESTHETIC_GENERAL_CONSENT')}
                  className="flex-[2] gold-btn py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale transition-all"
                >
                  <ShieldCheck size={18} /> Firmar Consentimiento Digital
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
