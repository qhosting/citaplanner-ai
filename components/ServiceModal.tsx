
import React, { useState, useEffect, useRef } from 'react';
import { X, BriefcaseMedical, Clock, DollarSign, Tag, FileText, ImageIcon, Sparkles, Check, Upload, Loader2, ShieldCheck, CheckCircle2, Cpu } from 'lucide-react';
import { Service } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  initialData?: Service;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    duration: 30,
    price: 0,
    description: '',
    category: 'General',
    status: 'ACTIVE',
    imageUrl: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          name: '',
          duration: 30,
          price: 0,
          description: '',
          category: 'General',
          status: 'ACTIVE',
          imageUrl: ''
        });
      }
    }
  }, [initialData, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await api.uploadImage(file);
    if (url) {
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success("Fotografía editorial cargada.");
    } else {
      toast.error("Error al sincronizar imagen.");
    }
    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const serviceToSave: Service = {
      id: initialData?.id || (Date.now().toString(36) + Math.random().toString(36).substring(2)),
      name: formData.name || 'Nuevo Servicio',
      duration: Number(formData.duration) || 30,
      price: Number(formData.price) || 0,
      description: formData.description || '',
      category: formData.category || 'General',
      status: formData.status as 'ACTIVE' | 'INACTIVE' || 'ACTIVE',
      imageUrl: formData.imageUrl || '',
      careInstructions: formData.careInstructions || ''
    };

    onSave(serviceToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center">
      {/* Container Principal: Pantalla completa en móvil, Inmersivo en Desktop */}
      <div className="w-full h-full md:h-[95vh] md:max-w-[1400px] md:rounded-[4rem] bg-[#050505] overflow-hidden flex flex-col border-white/5 shadow-[0_0_150px_rgba(212,175,55,0.1)] md:animate-scale-in relative">
        
        {/* Header Inmersivo */}
        <div className="relative flex justify-between items-center p-8 md:p-14 border-b border-white/5 bg-gradient-to-r from-black via-[#080808] to-black shrink-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#D4AF37]/10 blur-[120px] rounded-full opacity-50" />
          
          <div className="flex items-center gap-6 md:gap-10 relative z-10">
            <div className="relative group shrink-0">
              <div className="absolute inset-0 bg-[#D4AF37] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative p-4 md:p-6 rounded-3xl bg-black border border-[#D4AF37]/30 text-[#D4AF37] shadow-2xl">
                <Sparkles size={28} className="md:w-10 md:h-10" strokeWidth={1.2} />
              </div>
            </div>
            <div>
              <h3 className="font-black text-2xl md:text-5xl text-white tracking-tighter uppercase italic leading-none">
                {initialData ? 'Editar Nodo' : 'Nuevo Nodo'}
              </h3>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#D4AF37] animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-[#D4AF37]/60 animate-pulse delay-75" />
                  <div className="w-1 h-1 rounded-full bg-[#D4AF37]/30 animate-pulse delay-150" />
                </div>
                <p className="text-[9px] md:text-[11px] text-zinc-500 font-black uppercase tracking-[0.4em]">Aurum Infrastructure • Service OS</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8 relative z-10">
            <div className="hidden lg:block text-right">
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1 italic">Presupuesto</p>
              <p className="text-3xl font-black text-white italic tracking-tighter">${formData.price}</p>
            </div>
            <button onClick={onClose} className="p-4 md:p-6 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-all rounded-3xl border border-white/5">
              <X size={24} className="md:w-8 md:h-8" />
            </button>
          </div>
        </div>

        {/* Scrollable Content - Mobile Optimized */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar bg-black/40">
          <div className="p-8 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-20">
            
            {/* Columna Multimedia (Full width en móvil) */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] md:text-[13px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Activo Visual</label>
                  {formData.imageUrl && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Sincronizado</span>}
                </div>
                
                <div className="group relative w-full aspect-[4/5] md:aspect-square bg-gradient-to-br from-zinc-900 to-black rounded-[4rem] border border-white/5 overflow-hidden flex items-center justify-center shadow-2xl">
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms] ease-out opacity-80" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-700 backdrop-blur-md">
                        <div className="flex gap-6">
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-6 rounded-full bg-white/10 border border-white/20 text-white hover:bg-[#D4AF37] hover:text-black hover:border-transparent transition-all shadow-xl"><Upload size={24} /></button>
                          <button type="button" disabled={!formData.name || uploading} onClick={async (e) => { e.stopPropagation(); if(!formData.name) return; setUploading(true); const result = await api.improveImage(formData.name, formData.category || 'General'); if(result?.imageUrl) { setFormData(prev => ({ ...prev, imageUrl: result.imageUrl })); toast.success("NanoBanana: Optimizado."); } setUploading(false); }} className="p-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all shadow-xl"><Sparkles size={24} /></button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-10 space-y-10">
                      <div className="flex gap-8 justify-center">
                        <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center hover:border-[#D4AF37]/50 transition-all cursor-pointer hover:bg-white/10"><Upload className="text-zinc-600" size={32} strokeWidth={1} /></div>
                        <div onClick={async () => { if(!formData.name) { toast.error("Nombre requerido"); return; } setUploading(true); const result = await api.improveImage(formData.name, formData.category || 'General'); if(result?.imageUrl) { setFormData(prev => ({ ...prev, imageUrl: result.imageUrl })); toast.success("Generado."); } setUploading(false); }} className="w-24 h-24 bg-[#D4AF37]/10 rounded-[2.5rem] border border-[#D4AF37]/20 flex items-center justify-center hover:bg-[#D4AF37]/20 transition-all cursor-pointer"><Sparkles className="text-[#D4AF37]" size={32} strokeWidth={1} /></div>
                      </div>
                      <p className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] italic">Carga de Activos o Generación por IA</p>
                    </div>
                  )}
                  {uploading && <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-30"><Loader2 className="animate-spin text-[#D4AF37] mb-6" size={50} /><p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Procesando Inteligencia Visual...</p></div>}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>

              <div className="hidden md:block glass-card p-10 rounded-[3.5rem] border-white/5 bg-gradient-to-br from-white/5 to-transparent space-y-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20"><ShieldCheck size={20} className="text-[#D4AF37]" /></div>
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-white">Arquitectura de Datos</h4>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Este nodo será sincronizado globalmente. Las instrucciones de aftercare se inyectarán en el motor de automatización post-servicio vía WhatsApp.</p>
              </div>
            </div>

            {/* Columna Configuración */}
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-8">
                {/* Identidad */}
                <div className="space-y-6">
                  <div className="group relative">
                    <label className="block text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4 ml-6 group-focus-within:text-[#D4AF37] transition-colors italic">Nombre Maestro del Servicio</label>
                    <div className="relative">
                      <BriefcaseMedical size={22} className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-700" />
                      <input required type="text" className="w-full bg-black/60 border border-white/5 rounded-[2.5rem] p-8 pl-20 pr-40 text-white outline-none focus:border-[#D4AF37]/40 focus:bg-black transition-all font-black text-xl md:text-3xl tracking-tighter placeholder:text-zinc-900 shadow-inner" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Volumen Master 5D" />
                      <button type="button" disabled={!formData.name || uploading} onClick={async () => { if(!formData.name) return; setUploading(true); const suggestion = await api.getServiceSuggestion(formData.name, formData.category || 'General'); if(suggestion) { setFormData(prev => ({ ...prev, description: suggestion.description, careInstructions: suggestion.careInstructions })); toast.success("IA: Contenido generado."); } setUploading(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/30 text-[#D4AF37] px-6 py-4 rounded-3xl border border-[#D4AF37]/20 transition-all active:scale-95 disabled:opacity-20"><Sparkles size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Generar IA</span></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-6 italic">Categoría del Nodo</label>
                      <div className="relative">
                        <Tag size={18} className="absolute left-8 top-1/2 -translate-y-1/2 text-[#D4AF37]/40" />
                        <input list="categories" className="w-full pl-20 pr-8 py-6 bg-black/60 border border-white/5 rounded-[2.5rem] text-white outline-none focus:border-[#D4AF37]/40 font-black text-xs uppercase tracking-widest shadow-inner" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })} placeholder="GENERAL" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-6 italic">Disponibilidad Operativa</label>
                      <select className="w-full p-6 bg-black/60 border border-white/5 rounded-[2.5rem] text-white outline-none focus:border-[#D4AF37]/40 font-black text-xs uppercase tracking-widest appearance-none cursor-pointer shadow-inner" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                        <option value="ACTIVE">● EN LINEA (Activo)</option>
                        <option value="INACTIVE">○ DESCONECTADO (Pausado)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Finanzas y Tiempo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-card p-10 rounded-[3.5rem] border-white/5 bg-gradient-to-br from-zinc-900 to-black space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Clock size={64} /></div>
                    <div className="flex items-center gap-3"><Clock size={20} className="text-[#D4AF37]" /><span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em]">Latencia (Tiempo)</span></div>
                    <div className="flex items-end gap-4"><input required type="number" className="bg-transparent text-5xl font-black text-white w-32 outline-none border-b-2 border-white/5 focus:border-[#D4AF37] tracking-tighter" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })} /><span className="text-[12px] font-black text-zinc-600 uppercase mb-3">Minutos</span></div>
                  </div>

                  <div className="glass-card p-10 rounded-[3.5rem] border-white/5 bg-gradient-to-br from-zinc-900 to-black space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={64} /></div>
                    <div className="flex items-center gap-3"><DollarSign size={20} className="text-emerald-500" /><span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em]">Inversión (MXN)</span></div>
                    <div className="flex items-end gap-4"><input required type="number" className="bg-transparent text-5xl font-black text-white w-32 outline-none border-b-2 border-white/5 focus:border-emerald-500 tracking-tighter" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} /><span className="text-[12px] font-black text-zinc-600 uppercase mb-3">Creditos</span></div>
                  </div>
                </div>

                {/* Narrativas */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-6 italic">Narrativa de Lujo (Copywriting)</label>
                    <textarea rows={5} className="w-full bg-black/60 border border-white/5 rounded-[3rem] p-10 text-white outline-none focus:border-[#D4AF37]/40 resize-none font-medium text-[15px] leading-relaxed placeholder:text-zinc-900 shadow-inner" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe la experiencia sensorial..." />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] ml-6 italic">Aftercare Protocol (Automatización IA)</label>
                    <div className="relative">
                      <ShieldCheck size={24} className="absolute left-8 top-10 text-[#D4AF37]/20" />
                      <textarea rows={4} className="w-full bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-[3rem] p-10 pl-20 text-white outline-none focus:border-[#D4AF37]/40 resize-none font-medium text-[13px] leading-relaxed placeholder:text-[#D4AF37]/10 shadow-inner" value={formData.careInstructions || ''} onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })} placeholder="Instrucciones post-cita para el bot..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Pegajoso - Full Width Desktop & Mobile */}
        <div className="p-8 md:p-14 border-t border-white/5 bg-gradient-to-r from-black via-[#050505] to-black shrink-0 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 z-50">
          <div className="hidden md:flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/5 flex items-center justify-center text-zinc-700 shadow-xl"><Cpu size={28} /></div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">Integridad Sincronizada</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                <p className="text-[11px] font-bold text-white uppercase tracking-tighter italic">Nodo Nexus Activo</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-10 w-full md:w-auto">
            <button type="button" onClick={onClose} className="hidden md:block text-[12px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-[0.4em] italic">Descartar Cambios</button>
            <button type="submit" onClick={handleSubmit} className="gold-btn w-full md:w-auto px-12 md:px-24 py-6 md:py-8 rounded-full md:rounded-[2.5rem] font-black text-sm md:text-lg uppercase tracking-[0.5em] shadow-[0_20px_60px_rgba(212,175,55,0.3)] flex items-center justify-center gap-6 group active:scale-95 transition-all overflow-hidden relative">
              <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1500ms] skew-x-12" />
              <CheckCircle2 size={24} className="group-hover:scale-125 transition-transform" /> 
              <span className="relative z-10">{initialData ? 'Actualizar Nodo' : 'Sincronizar Nodo'}</span>
            </button>
          </div>
        </div>
      </div>

      <datalist id="categories">
        <option value="PESTAÑAS" />
        <option value="CEJAS" />
        <option value="UÑAS" />
        <option value="DEPILACIÓN" />
        <option value="CUIDADO PIEL" />
      </datalist>
    </div>
  );
};
