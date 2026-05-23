import React, { useState, useRef, useEffect } from 'react';
import { 
  X, ShieldCheck, Check, AlertTriangle, Scale, ScrollText, 
  Clock, Droplets, EyeOff, Info, HelpCircle, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: string) => void;
  clientName: string;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  clientName 
}) => {
  const [hasRead, setHasRead] = useState(false);
  const [consentType, setConsentType] = useState<'LASH_EXTENSION_CONSENT' | 'ESTHETIC_GENERAL_CONSENT'>('LASH_EXTENSION_CONSENT');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Canvas dimensions on mount/open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.parentElement?.getBoundingClientRect();
          canvas.width = rect?.width || 500;
          canvas.height = 160;
          
          // Style initial background
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }
        }
      }, 200);
    }
  }, [isOpen, consentType]);

  if (!isOpen) return null;

  // Drawing functions for signature pad
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if ('touches' in e && e.cancelable) {
      e.preventDefault(); // Prevent touch scrolling while drawing
    }

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    toast.info('Lienzo de firma restablecido');
  };

  const handleConfirmSignature = () => {
    if (!hasRead) {
      toast.warning('Debe marcar la casilla de aceptación');
      return;
    }
    if (!hasSignature) {
      toast.warning('Por favor dibuje su firma en el panel');
      return;
    }
    
    onConfirm(consentType);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-3xl rounded-[2.5rem] overflow-hidden border-[#D4AF37]/30 shadow-[0_0_80px_rgba(212,175,55,0.15)] my-8 animate-scale-in">
        
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/5 flex justify-between items-center bg-white/5 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-black border border-[#D4AF37]/30 text-[#D4AF37] shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-white tracking-tighter uppercase">Consentimiento y Deslinde</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-1">Cumplimiento Legal y Sanitario</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-full transition-all border border-white/5 cursor-pointer shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-black/40 border-b border-white/5 p-1">
          <button
            onClick={() => {
              setConsentType('LASH_EXTENSION_CONSENT');
              setHasRead(false);
              setHasSignature(false);
            }}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              consentType === 'LASH_EXTENSION_CONSENT'
                ? 'bg-[#D4AF37]/10 border-b-2 border-[#D4AF37] text-[#D4AF37]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScrollText size={12} /> Consentimiento de Pestañas (Shula Studio)
          </button>
          <button
            onClick={() => {
              setConsentType('ESTHETIC_GENERAL_CONSENT');
              setHasRead(false);
              setHasSignature(false);
            }}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              consentType === 'ESTHETIC_GENERAL_CONSENT'
                ? 'bg-[#D4AF37]/10 border-b-2 border-[#D4AF37] text-[#D4AF37]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={12} /> Consentimiento General Estético
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Scrollable Terms */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 sm:p-6 max-h-[30vh] overflow-y-auto custom-scrollbar space-y-5">
            {consentType === 'LASH_EXTENSION_CONSENT' ? (
              // Specific Lash Consent Clauses mapped from image
              <div className="space-y-4 text-[10.5px] sm:text-xs text-slate-400 leading-relaxed font-medium">
                <p className="text-white font-bold uppercase tracking-wider text-[9px] border-b border-white/5 pb-2">
                  Acuerdo de Aplicación de Extensiones de Pestañas - Shula Studio
                </p>
                <p>
                  Yo, <b className="text-white">{clientName}</b>, estoy de acuerdo en la aplicación y/o remoción de las extensiones de pestañas a mis pestañas naturales. La especialista técnica me ha explicado detalladamente el procedimiento y los riesgos que este implica.
                </p>
                <p>
                  Entiendo que existe un riesgo asociado con el uso de extensiones de pestañas. Aún cuando la aplicación y eliminación de las extensiones sea realizada correctamente por el profesional, existen riesgos de irritación, molestia, enrojecimiento o ardor temporal. Entiendo que se utilizarán adhesivos de grado médico basados en cianoacrilato para la fijación.
                </p>
                
                <div className="space-y-3 pt-2">
                  <p className="text-[#D4AF37] font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <Droplets size={12} /> Cuidados Posteriores y Mantenimiento:
                  </p>
                  <ul className="list-disc pl-4 space-y-2 text-[10.5px]">
                    <li><b>Instrucciones de Cuidado:</b> Estoy de acuerdo en seguir rigurosamente las instrucciones proporcionadas por Shula Studio. Si no son cuidadas correctamente, acepto que la durabilidad de las mismas será mi única responsabilidad.</li>
                    <li><b>Regla de 48 Horas:</b> Evitaré mojar mis extensiones las primeras 48 horas posteriores al servicio. Adicionalmente, durante los dos primeros días evitaré nadar, ingresar a saunas, vapores o fuentes de calor intenso.</li>
                    <li><b>Uso de Maquillaje:</b> Acepto evitar el uso de rímel a base de aceite (waterproof/a prueba de agua) y no utilizar rizadores mecánicos de pestañas, permanentes, tintes ni químicos agresivos en la zona.</li>
                    <li><b>Contacto y Retiro:</b> Si llego a sentir cualquier tipo de irritación severa o picor, me comprometo a contactar de inmediato a Shula Studio para que sean removidas profesionalmente. <b>Bajo ninguna circunstancia</b> intentaré quitármelas por mi cuenta, ya que podría causar la pérdida prematura de mis pestañas naturales.</li>
                  </ul>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5">
                  <p className="text-[#D4AF37] font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <Clock size={12} /> Declaraciones del Cliente:
                  </p>
                  <ul className="list-disc pl-4 space-y-2 text-[10.5px]">
                    <li>Declaro no tener ninguna condición ocular activa, infección, tratamiento oftálmico o condición médica general que pueda agravarse con la aplicación.</li>
                    <li>Si uso lentes de contacto, me comprometo a retirarlos completamente antes de iniciar el procedimiento.</li>
                    <li>Entiendo que el procedimiento completo requiere estar acostada de manera inmóvil con los ojos cerrados por un lapso aproximado de dos (2) horas.</li>
                    <li><b>Mayoría de Edad:</b> Declaro ser mayor de 18 años de edad o, en su defecto, que este consentimiento se firma en presencia y con la autorización expresa de mi padre, madre o tutor legal.</li>
                  </ul>
                </div>
                
                <p className="text-[10px] text-slate-500 italic mt-3 pt-3 border-t border-white/5">
                  Este acuerdo tiene validez jurídica y médica para esta aplicación inicial y para todas las futuras sesiones de mantenimiento. Cualquier tipo de alergia tardía o reacción no reportada previamente es bajo mi total responsabilidad.
                </p>
              </div>
            ) : (
              // Generic Esthetic Consent Clauses
              <div className="space-y-4 text-[10.5px] sm:text-xs text-slate-400 leading-relaxed font-medium">
                <p className="text-white font-bold uppercase tracking-wider text-[9px] border-b border-white/5 pb-2">
                  Términos y Condiciones del Procedimiento Estético General
                </p>
                <p>
                  Yo, <b className="text-white">{clientName}</b>, por medio de la presente autorizo a los especialistas de <b>Aurum Beauty Studio</b> a realizar el procedimiento estético avanzado programado.
                </p>
                <p>
                  Entiendo que los resultados estéticos pueden variar según el tipo de piel, cuidados posteriores y fisiología individual. He sido informado(a) detalladamente sobre los materiales e insumos de grado médico a ser aplicados y confirmo no padecer alergias a los componentes descritos en mi ficha técnica.
                </p>
                <p>
                  Acepto seguir estrictamente las pautas de cuidado post-tratamiento entregadas por el personal profesional para garantizar el éxito y retención óptima del procedimiento.
                </p>
                <p>
                  Libero de responsabilidad civil, penal y sanitaria al estudio y sus colaboradores por cualquier reacción adversa derivada de información omitida u ocultada en mi ficha biométrica diagnóstica o por negligencia comprobable en los cuidados domésticos indicados.
                </p>
              </div>
            )}
          </div>

          {/* Compliance notice */}
          <div className="flex items-start gap-4 bg-[#D4AF37]/5 p-4 rounded-xl border border-[#D4AF37]/10">
            <AlertTriangle className="text-[#D4AF37] shrink-0 mt-0.5" size={16} />
            <p className="text-[8.5px] sm:text-[9.5px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
              Cumplimiento digital: Esta firma táctil quedará grabada en conjunto con el número de teléfono del cliente, fecha y hora local como deslinde de responsabilidad formal.
            </p>
          </div>

          {/* Interactive HTML5 Signature Canvas Pad */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Firma Digital del Socio (Dibuje sobre el recuadro)</label>
              {hasSignature && (
                <button 
                  type="button" 
                  onClick={clearSignature}
                  className="text-[8.5px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 size={11} /> Limpiar Firma
                </button>
              )}
            </div>

            <div className="relative bg-black/60 border border-white/10 rounded-2xl overflow-hidden h-[160px] group transition-all duration-300 focus-within:border-[#D4AF37]">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
              />
              
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
                  <div className="text-center space-y-1.5">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest block">Dibuje su Firma Aquí</span>
                    <span className="text-[7.5px] text-slate-500 font-medium block">Mouse o Pantalla Táctil</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Consent Checkbox and Actions */}
          <div className="flex flex-col gap-5 pt-2">
             <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div 
                  onClick={() => setHasRead(!hasRead)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    hasRead ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-black border-white/10 group-hover:border-white/20'
                  }`}
                >
                   {hasRead && <Check size={12} className="text-black font-black" />}
                </div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">
                  He leído, entiendo y acepto la totalidad de las cláusulas descritas
                </span>
             </label>

             <div className="flex gap-4 pt-1">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 py-4 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  disabled={!hasRead || !hasSignature}
                  onClick={handleConfirmSignature}
                  className="flex-[2] gold-btn py-4 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.35em] flex items-center justify-center gap-2.5 disabled:opacity-30 disabled:grayscale transition-all cursor-pointer shadow-lg"
                >
                  <ShieldCheck size={16} /> Firmar Consentimiento
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
