
import React, { useState, useEffect, useRef } from 'react';
import { X, BriefcaseMedical, Clock, DollarSign, Tag, FileText, ImageIcon, Sparkles, Check, Upload, Loader2 } from 'lucide-react';
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
      tenantId: user?.tenantId || '',
    };

    onSave(serviceToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-2xl rounded-[3.5rem] overflow-hidden flex flex-col max-h-[90vh] border-[#D4AF37]/20 shadow-[0_0_100px_rgba(212,175,55,0.1)] animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center p-10 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-black border border-[#D4AF37]/30 text-[#D4AF37] shadow-xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-black text-2xl text-white tracking-tighter uppercase">
                {initialData ? 'Configurar Nodo Maestro' : 'Integrar Nuevo Servicio'}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Ecosistema Aurum • Service Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all rounded-2xl border border-white/5">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8 custom-scrollbar">
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Identidad del Servicio</label>
              <input
                required
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-[#D4AF37] transition-all font-bold"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Técnica Clásica Natural"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Categoría Master</label>
                <div className="relative">
                  <Tag size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]/50" />
                  <input
                    list="categories"
                    type="text"
                    className="w-full pl-14 pr-5 py-5 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-[#D4AF37] font-bold"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Eje: PESTAÑAS"
                  />
                  <datalist id="categories">
                    <option value="PESTAÑAS" />
                    <option value="CEJAS" />
                    <option value="DEPILACION" />
                    <option value="UÑAS" />
                    <option value="PIES" />
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Estado Operativo</label>
                <select
                  className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-[#D4AF37] font-bold appearance-none cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
                >
                  <option value="ACTIVE">OPERATIVO (Visible)</option>
                  <option value="INACTIVE">MANTENIMIENTO (Oculto)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Fotografía Editorial</label>
                <div className="group relative w-full h-40 bg-black/60 rounded-[2rem] border border-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#D4AF37]/50 transition-all" onClick={() => fileInputRef.current?.click()}>
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload className="text-slate-700 mx-auto mb-2" size={32} />
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Subir Imagen Real</p>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <Loader2 className="animate-spin text-[#D4AF37]" size={24} />
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="input-file-hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                />
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Duración (Minutos)</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]/50" />
                    <input
                      required
                      type="number"
                      min="5"
                      step="5"
                      className="w-full pl-14 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-[#D4AF37] font-bold"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Inversión ($)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]/50" />
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      className="w-full pl-14 pr-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-[#D4AF37] font-bold"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Narrativa del Servicio</label>
              <div className="relative">
                  <FileText size={16} className="absolute left-5 top-6 text-[#D4AF37]/50" />
                  <textarea
                    rows={4}
                    className="w-full pl-14 pr-5 py-5 bg-black/40 border border-white/10 rounded-3xl text-white outline-none focus:border-[#D4AF37] resize-none font-medium text-sm leading-relaxed"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Detalles sobre los beneficios y la técnica..."
                  />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest"
            >
              Abortar Cambios
            </button>
            <button
              type="submit"
              className="gold-btn px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl flex items-center gap-3 active:scale-95"
            >
              <Check size={18} /> {initialData ? 'Sincronizar Nodo' : 'Integrar Nodo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
