import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Sparkles, Scale, Info, Save, ClipboardCheck, 
  HelpCircle, Eye, EyeOff, Activity, Droplets, Compass, Moon,
  Check
} from 'lucide-react';
import { LashDiagnosis } from '../types';
import { toast } from 'sonner';

interface LashDiagnosisFormProps {
  clientId: string;
  initialData?: LashDiagnosis | null;
  readOnly?: boolean;
  onSave?: (data: LashDiagnosis) => void;
}

const MEDICAL_CONDITIONS = [
  { id: 'eyeSurgery', label: 'Cirugía de ojos' },
  { id: 'permanentMakeup', label: 'Delineado permanente' },
  { id: 'blepharoplasty', label: 'Levantamiento de Ojo (Blefaroplastia)' },
  { id: 'microdermabrasion', label: 'Microdermoabrasión' },
  { id: 'glueAllergy', label: 'Alergia a pegamentos o cosas sintéticas', isCritical: true },
  { id: 'pregnancy', label: 'Embarazada a menos de 3 meses de parir' },
  { id: 'alopecia', label: 'Alopecia' },
  { id: 'thyroid', label: 'Enfermedad de la Tiroides' },
  { id: 'glycerinAllergy', label: 'Alergia a la glicerina' },
  { id: 'cyanoacrylateHypersensitivity', label: 'Hipersensibilidad a Cianoacrilato', isCritical: true },
  { id: 'recentIllness', label: 'Fiebre reciente o enfermedad reciente' },
  { id: 'ironDeficiency', label: 'Deficiencia de Hierro' },
  { id: 'hormonalImbalance', label: 'Desbalance Hormonal' },
  { id: 'extremeStress', label: 'Estrés extremo' },
  { id: 'chemicalExposure', label: 'Exposición reciente a químicos (cloro, permanente)' },
  { id: 'majorSurgery', label: 'Cirugía mayor a menos de 120 días' },
  { id: 'eatingDisorders', label: 'Problemas de Alimentación' },
  { id: 'hairLossDrugs', label: 'Drogas que causan pérdida temporal del pelo' },
  { id: 'chemotherapy', label: 'Quimioterapia como tratamiento de cáncer' },
  { id: 'retinoids', label: 'Retinoides usados en tratamiento de acné (Accutane / Retin-A)' },
  { id: 'anticoagulants', label: 'Anticoagulantes' },
];

export const LashDiagnosisForm: React.FC<LashDiagnosisFormProps> = ({
  clientId,
  initialData,
  readOnly = false,
  onSave
}) => {
  const [formData, setFormData] = useState<LashDiagnosis>({
    direccion: '',
    preferenciaDiaHora: '',
    referralSource: 'RECOMENDACION',
    firstTime: false,
    previousTypes: [],
    permAndTint: 'NINGUNO',
    frequency: 'USO_DIARIO',
    contactLenses: false,
    touchesEyes: false,
    eyeDiseases: false,
    sleepSide: 'DERECHO',
    eyeDrops: '',
    eyesClosedDuration: true,
    conditions: {}
  });

  const [activeStep, setActiveStep] = useState<'GENERAL' | 'HABITS' | 'MEDICAL'>('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        conditions: initialData.conditions || {}
      });
    }
  }, [initialData]);

  const handleToggleCondition = (key: string) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...(prev.conditions || {}),
        [key]: !prev.conditions?.[key]
      }
    }));
  };

  const handleTogglePreviousType = (type: 'INDIVIDUALES' | 'TIRA' | 'RACIMO' | 'OTRAS') => {
    if (readOnly) return;
    setFormData(prev => {
      const current = prev.previousTypes || [];
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return { ...prev, previousTypes: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setIsSubmitting(true);
    
    try {
      if (onSave) {
        await onSave(formData);
      }
    } catch (err) {
      toast.error('Error al guardar el diagnóstico de pestañas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGlueCritical = formData.conditions?.glueAllergy || formData.conditions?.cyanoacrylateHypersensitivity;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Alert block for critical allergies */}
      {isGlueCritical && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 sm:p-5 rounded-2xl flex gap-3.5 items-start animate-entrance">
          <ShieldAlert className="text-rose-500 shrink-0 animate-pulse mt-0.5" size={20} />
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-500">Alerta de Riesgo Técnico Crítico</h4>
            <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed mt-1">
              Este cliente reporta hipersensibilidad al cianoacrilato o pegamento sintético. Se recomienda aplicar adhesivo hipoalergénico especial de grado médico (libre de látex/carbono negro) y realizar una prueba de parche obligatoria de 24 horas antes del servicio completo.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Tabs */}
      <div className="flex bg-black/40 border border-white/5 rounded-xl p-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'GENERAL', label: '1. Diagnóstico e Historial', icon: Compass },
          { id: 'HABITS', label: '2. Hábitos e Insumos', icon: Moon },
          { id: 'MEDICAL', label: '3. Ficha Médica y Alergias', icon: Activity }
        ].map(step => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id as any)}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeStep === step.id 
                ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] shadow-lg' 
                : 'border border-transparent text-slate-500 hover:text-white'
            }`}
          >
            <step.icon size={12} /> {step.label}
          </button>
        ))}
      </div>

      {/* STEP 1: GENERAL INFO */}
      {activeStep === 'GENERAL' && (
        <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 space-y-6 animate-entrance">
          <div className="border-b border-white/5 pb-4">
             <h3 className="text-lg font-black text-white uppercase tracking-tighter">Historial de Aplicación de Pestañas</h3>
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Evaluación inicial de experiencia técnica</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-0.5">Dirección de Residencia</label>
              <input 
                disabled={readOnly}
                type="text" 
                value={formData.direccion} 
                onChange={e => setFormData({ ...formData, direccion: e.target.value })} 
                className="w-full bg-black/40 border border-white/5 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all font-medium" 
                placeholder="Calle, Número, Colonia..." 
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-0.5">Preferencia de Cita (Día y Hora)</label>
              <input 
                disabled={readOnly}
                type="text" 
                value={formData.preferenciaDiaHora} 
                onChange={e => setFormData({ ...formData, preferenciaDiaHora: e.target.value })} 
                className="w-full bg-black/40 border border-white/5 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all font-medium" 
                placeholder="Ej: Viernes 5:00 PM" 
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-0.5">¿Cómo te enteraste de nosotros?</label>
              <select
                disabled={readOnly}
                value={formData.referralSource}
                onChange={e => setFormData({ ...formData, referralSource: e.target.value as any })}
                className="w-full bg-black/40 border border-white/5 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all font-medium"
              >
                <option value="RECOMENDACION">Recomendación Directa</option>
                <option value="FACEBOOK">Facebook / Redes Sociales</option>
                <option value="REVISTA">Revistas o Anuncios</option>
                <option value="OTRO">Otro Canal</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-0.5">¿Primera vez que te aplicas Extensiones?</label>
              <div className="flex gap-4">
                {[
                  { value: true, label: 'Sí, es mi primera vez' },
                  { value: false, label: 'No, ya me he aplicado antes' }
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setFormData({ ...formData, firstTime: opt.value })}
                    className={`flex-1 py-3 px-4 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      formData.firstTime === opt.value
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                        : 'bg-black/20 border-white/5 text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider ml-0.5">¿Qué tipo de pestañas previas te has aplicado?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'INDIVIDUALES', label: 'Individuales (1 a 1)' },
                  { id: 'TIRA', label: 'Pestañas de Tira' },
                  { id: 'RACIMO', label: 'Pestañas en Racimo' },
                  { id: 'OTRAS', label: 'Otros Modelos' }
                ].map(type => {
                  const isChecked = formData.previousTypes?.includes(type.id as any);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleTogglePreviousType(type.id as any)}
                      className={`py-3 px-4 border rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                        isChecked
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                          : 'bg-black/20 border-white/5 text-slate-400'
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2 pt-3">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div 
                  onClick={() => !readOnly && setFormData({ ...formData, contactLenses: !formData.contactLenses })}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.contactLenses ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-black/30 border-white/10'}`}
                >
                  {formData.contactLenses && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">¿Usas lentes de contacto?</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div 
                  onClick={() => !readOnly && setFormData({ ...formData, touchesEyes: !formData.touchesEyes })}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.touchesEyes ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-black/30 border-white/10'}`}
                >
                  {formData.touchesEyes && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">¿Usualmente tallas, jalas o estiras tus pestañas?</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SLEEP HABITS & DETAILS */}
      {activeStep === 'HABITS' && (
        <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 space-y-6 animate-entrance">
          <div className="border-b border-white/5 pb-4">
             <h3 className="text-lg font-black text-white uppercase tracking-tighter">Hábitos de Cuidado y Posición de Sueño</h3>
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Análisis de factores mecánicos y retención</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[9px] font-black text-[#D4AF37] uppercase tracking-wider mb-2 ml-0.5">¿De qué lado acostumbras dormir? (Métrica Crítica)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'DERECHO', label: 'Derecho' },
                  { id: 'IZQUIERDO', label: 'Izquierdo' },
                  { id: 'BOCA_ARRIBA', label: 'Boca Arriba' }
                ].map(side => (
                  <button
                    key={side.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setFormData({ ...formData, sleepSide: side.id as any })}
                    className={`py-3 px-2 border rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                      formData.sleepSide === side.id
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                        : 'bg-black/20 border-white/5 text-slate-400'
                    }`}
                  >
                    {side.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-2 text-[8px] text-slate-500 leading-normal uppercase">
                <Info size={12} className="text-[#D4AF37] shrink-0 mt-0.5" />
                <span>La posición al dormir aumenta la fricción sobre las extensiones en ese lado, lo que puede causar mayor caída o desprendimiento rápido.</span>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-0.5">Tratamientos Previos de Pestañas</label>
              <select
                disabled={readOnly}
                value={formData.permAndTint}
                onChange={e => setFormData({ ...formData, permAndTint: e.target.value as any })}
                className="w-full bg-black/40 border border-white/5 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all font-medium"
              >
                <option value="NINGUNO">Ninguno</option>
                <option value="ENCHINADO">Enchinado Permanente</option>
                <option value="TINTE">Tinte de Pestañas</option>
                <option value="AMBOS">Ambos Procedimientos</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-0.5">Frecuencia de Uso Esperada</label>
              <div className="flex gap-4">
                {[
                  { id: 'OCASION_ESPECIAL', label: 'Ocasión Especial' },
                  { id: 'USO_DIARIO', label: 'Uso Diario / Continuo' }
                ].map(freq => (
                  <button
                    key={freq.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setFormData({ ...formData, frequency: freq.id as any })}
                    className={`flex-1 py-3 px-4 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      formData.frequency === freq.id
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                        : 'bg-black/20 border-white/5 text-slate-400'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-0.5">Medicamento o Gotas para los ojos</label>
              <input 
                disabled={readOnly}
                type="text" 
                value={formData.eyeDrops} 
                onChange={e => setFormData({ ...formData, eyeDrops: e.target.value })} 
                className="w-full bg-black/40 border border-white/5 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-xs outline-none transition-all font-medium" 
                placeholder="Enlista cualquier tipo de gotas o medicinas que uses..." 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2 pt-3 border-t border-white/5">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div 
                  onClick={() => !readOnly && setFormData({ ...formData, eyeDiseases: !formData.eyeDiseases })}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.eyeDiseases ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-black/30 border-white/10'}`}
                >
                  {formData.eyeDiseases && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">¿Sufres o has sufrido de alguna enfermedad en los ojos?</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <div 
                  onClick={() => !readOnly && setFormData({ ...formData, eyesClosedDuration: !formData.eyesClosedDuration })}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.eyesClosedDuration ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-black/30 border-white/10'}`}
                >
                  {formData.eyesClosedDuration && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">Habilidad para estar recostada con los ojos cerrados por 2 horas o más</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: MEDICAL MEDICAL CHECKLIST */}
      {activeStep === 'MEDICAL' && (
        <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 space-y-6 animate-entrance">
          <div className="border-b border-white/5 pb-4">
             <h3 className="text-lg font-black text-white uppercase tracking-tighter">Historial Clínico y Factores de Restricción</h3>
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Identificación de contraindicaciones técnicas y alergias</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MEDICAL_CONDITIONS.map(cond => {
              const isChecked = formData.conditions?.[cond.id] || false;
              return (
                <div 
                  key={cond.id} 
                  onClick={() => handleToggleCondition(cond.id)}
                  className={`p-3.5 border rounded-xl flex items-center justify-between gap-4 cursor-pointer select-none transition-all group ${
                    isChecked 
                      ? (cond.isCritical ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]')
                      : 'bg-black/20 border-white/5 hover:border-white/15 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                      isChecked 
                        ? (cond.isCritical ? 'bg-rose-500 border-rose-500' : 'bg-[#D4AF37] border-[#D4AF37]') 
                        : 'bg-black/30 border-white/10'
                    }`}>
                      {isChecked && <Check size={12} className="text-black font-black" />}
                    </div>
                    <span className="text-[9.5px] font-semibold uppercase tracking-wider leading-relaxed">{cond.label}</span>
                  </div>
                  {cond.isCritical && (
                    <ShieldAlert size={14} className="text-rose-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {!readOnly && (
            <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="gold-btn px-10 py-4 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-2xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Save size={14} /> Guardar Ficha Técnica
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
};
