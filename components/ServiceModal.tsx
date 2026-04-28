
import React, { useState, useEffect, useRef } from 'react';
import { X, BriefcaseMedical, Clock, DollarSign, Tag, FileText, ImageIcon, Sparkles, Check, Upload, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

    // Fixed: Included tenantId in serviceToSave
    const serviceToSave: Service = {
      id: initialData?.id || (Date.now().toString(36) + Math.random().toString(36).substring(2)),
      name: formData.name || 'Nuevo Servicio',
      duration: Number(formData.duration) || 30,
      price: Number(formData.price) || 0,
      description: formData.description || '',
      category: formData.category || 'General',
      status: formData.status as 'ACTIVE' | 'INACTIVE' || 'ACTIVE',
      imageUrl: formData.imageUrl || '',
      careInstructions: formData.careInstructions || '',
      tenantId: user?.tenantId || '',
    };

    onSave(serviceToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 md:p-10">
      <div className="glass-card w-full max-w-4xl rounded-[4rem] overflow-hidden flex flex-col max-h-[95vh] border-[#D4AF37]/20 shadow-[0_0_150px_rgba(212,175,55,0.15)] animate-scale-in">
        {/* Header Superior Premium */}
        <div className="relative flex justify-between items-center p-10 md:p-14 border-b border-white/5 overflow-hidden">
          {/* Fondo Decorativo */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D4AF37]/10 blur-[100px] rounded-full" />
          
          <div className="flex items-center gap-8 relative z-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative p-5 rounded-3xl bg-gradient-to-br from-black to-zinc-900 border border-[#D4AF37]/40 text-[#D4AF37] shadow-2xl">
                <Sparkles size={32} strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <h3 className="font-black text-3xl md:text-4xl text-white tracking-tighter uppercase italic">
                {initialData ? 'Configurar Nodo Maestro' : 'Integrar Nuevo Servicio'}
              </h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Ecosistema Aurum • Service Intelligence v5.0</p>
              </div>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-5 relative z-10">
            <div className="h-12 w-[1px] bg-white/10" />
            <div className="text-right">
              <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Costo Estimado</p>
              <p className="text-2xl font-black text-white italic tracking-tighter">${formData.price}</p>
            </div>
            <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all rounded-2xl border border-white/5 backdrop-blur-md">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Formulario - Organizado en 2 Columnas */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar">
          <div className="p-10 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-14">
            
            {/* Columna Izquierda: Visuales y Multimedia */}
            <div className="lg:col-span-5 space-y-10">
              <div>
                <label className="block text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-5">Fotografía Editorial</label>
                <div 
                  className="group relative w-full aspect-square md:aspect-[4/5] bg-gradient-to-b from-zinc-900 to-black rounded-[3rem] border border-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#D4AF37]/40 transition-all shadow-inner" 
                >
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-500 backdrop-blur-sm">
                        <div className="flex gap-4">
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                          >
                            <Upload size={20} />
                          </button>
                          <button 
                            type="button"
                            disabled={!formData.name || uploading}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if(!formData.name) return;
                              setUploading(true);
                              const result = await api.improveImage(formData.name, formData.category || 'General');
                              if(result?.imageUrl) {
                                setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
                                toast.success("NanoBanana: Imagen optimizada.");
                              }
                              setUploading(false);
                            }}
                            className="p-4 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/40 transition-all"
                          >
                            <Sparkles size={20} />
                          </button>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white mt-4">Gestionar Activo</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center px-10">
                      <div className="flex gap-4 justify-center mb-6">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center hover:border-[#D4AF37]/50 transition-all cursor-pointer group/up"
                        >
                          <Upload className="text-zinc-700 group-hover/up:text-white transition-all" size={24} strokeWidth={1} />
                        </div>
                        <div 
                          onClick={async () => {
                            if(!formData.name) {
                              toast.error("Ingresa un nombre primero para que la IA sepa qué generar.");
                              return;
                            }
                            setUploading(true);
                            const result = await api.improveImage(formData.name, formData.category || 'General');
                            if(result?.imageUrl) {
                              setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
                              toast.success("NanoBanana: Imagen generada.");
                            }
                            setUploading(false);
                          }}
                          className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20 flex items-center justify-center hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all cursor-pointer group/ia"
                        >
                          <Sparkles className="text-[#D4AF37] group-hover/ia:scale-110 transition-all" size={24} strokeWidth={1} />
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-relaxed italic">Carga manual o usa NanoBanana para generar una obra de arte</p>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                      <Loader2 className="animate-spin text-[#D4AF37] mb-4" size={40} />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Sincronizando Asset...</p>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>

              <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex items-center gap-4 mb-4">
                  <ShieldCheck size={18} className="text-[#D4AF37]" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">IA Aftercare</h4>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                  Estas instrucciones serán procesadas por la IA para enviarse vía WhatsApp 24 horas después del servicio.
                </p>
              </div>
            </div>

            {/* Columna Derecha: Configuración Técnica */}
            <div className="lg:col-span-7 space-y-10">
              {/* Grupo 1: Identidad */}
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-4 group-focus-within:text-[#D4AF37] transition-colors italic">Nombre del Servicio</label>
                  <div className="relative">
                  <BriefcaseMedical size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" />
                  <input
                    required
                    type="text"
                    className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 pl-16 pr-32 text-white outline-none focus:border-[#D4AF37]/50 focus:bg-black transition-all font-bold text-lg placeholder:text-zinc-800"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Técnica Clásica Natural Premium"
                  />
                  <button
                    type="button"
                    disabled={!formData.name || uploading}
                    onClick={async () => {
                      if (!formData.name) return;
                      setUploading(true);
                      const suggestion = await api.getServiceSuggestion(formData.name, formData.category || 'General');
                      if (suggestion) {
                        setFormData(prev => ({
                          ...prev,
                          description: suggestion.description,
                          careInstructions: suggestion.careInstructions
                        }));
                        toast.success("IA: Narrativa y Protocolo generados.");
                      } else {
                        toast.error("La IA está descansando, intenta manual.");
                      }
                      setUploading(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] px-4 py-2.5 rounded-2xl border border-[#D4AF37]/20 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Generar IA</span>
                  </button>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-4 italic">Categoría Master</label>
                    <div className="relative">
                      <Tag size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]/40" />
                      <input
                        list="categories"
                        className="w-full pl-16 pr-6 py-5 bg-black/60 border border-white/10 rounded-3xl text-white outline-none focus:border-[#D4AF37]/50 font-black text-[11px] uppercase tracking-widest"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                        placeholder="GENERAL"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-4 italic">Estado</label>
                    <select
                      className="w-full p-5 bg-black/60 border border-white/10 rounded-3xl text-white outline-none focus:border-[#D4AF37]/50 font-black text-[11px] uppercase tracking-widest appearance-none cursor-pointer"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="ACTIVE">● OPERATIVO</option>
                      <option value="INACTIVE">○ PAUSADO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grupo 2: KPIs y Finanzas */}
              <div className="grid grid-cols-2 gap-8">
                <div className="glass-card p-8 rounded-[3rem] border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-[#D4AF37]" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tiempo</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <input
                      required
                      type="number"
                      className="bg-transparent text-3xl font-black text-white w-24 outline-none border-b border-white/10 focus:border-[#D4AF37]"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Min</span>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-[3rem] border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inversión</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <input
                      required
                      type="number"
                      className="bg-transparent text-3xl font-black text-white w-24 outline-none border-b border-white/10 focus:border-emerald-500"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase mb-2">MXN</span>
                  </div>
                </div>
              </div>

              {/* Grupo 3: Descripciones */}
              <div className="space-y-8">
                <div>
                  <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-4 italic">Narrativa Editorial</label>
                  <textarea
                    rows={4}
                    className="w-full bg-black/60 border border-white/10 rounded-[2.5rem] p-8 text-white outline-none focus:border-[#D4AF37]/50 resize-none font-medium text-sm leading-relaxed placeholder:text-zinc-800 shadow-inner"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe la experiencia de lujo, los beneficios y la técnica master utilizada..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-4 ml-4 italic">Aftercare Protocol (IA)</label>
                  <div className="relative">
                    <ShieldCheck size={18} className="absolute left-6 top-8 text-[#D4AF37]/30" />
                    <textarea
                      rows={3}
                      className="w-full bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-[2rem] p-8 pl-16 text-white outline-none focus:border-[#D4AF37]/50 resize-none font-medium text-xs leading-relaxed placeholder:text-[#D4AF37]/20"
                      value={formData.careInstructions || ''}
                      onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                      placeholder="Protocolo automático que recibirá el cliente..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="p-10 md:p-14 border-t border-white/5 flex items-center justify-between bg-black/20">
            <div className="hidden md:flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-700">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Seguridad Biométrica</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Sincronización Encriptada</p>
              </div>
            </div>

            <div className="flex items-center gap-8 w-full md:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-[0.3em] italic"
              >
                Abortar Operación
              </button>
              <button
                type="submit"
                className="gold-btn w-full md:w-auto px-16 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(212,175,55,0.2)] flex items-center justify-center gap-4 group active:scale-95 transition-all overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                <CheckCircle2 size={20} /> 
                <span className="relative z-10">{initialData ? 'Sincronizar Nodo' : 'Integrar Nodo'}</span>
              </button>
            </div>
          </div>
        </form>
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
