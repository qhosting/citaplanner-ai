
import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, User, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Branch } from '../types';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (branch: Branch) => void;
  initialData?: Branch;
}

export const BranchModal: React.FC<BranchModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Branch>>({
    name: '',
    address: '',
    phone: '',
    manager: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (isOpen) {
      setFormData({ name: '', address: '', phone: '', manager: '', status: 'ACTIVE' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      address: formData.address || '',
      phone: formData.phone || '',
      manager: formData.manager || '',
      status: formData.status as 'ACTIVE' | 'INACTIVE' || 'ACTIVE'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-xl rounded-[3.5rem] overflow-hidden border-[#D4AF37]/20 animate-scale-in">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-black border border-[#D4AF37]/30 text-[#D4AF37]">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-white tracking-tighter uppercase">
                {initialData ? 'Configurar Nodo de Red' : 'Integrar Nueva Sede'}
              </h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Infraestructura Aurum Global</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Nombre de Identificación</label>
              <input 
                required
                type="text"
                placeholder="Ej: Node Polanco Central"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Ubicación Estratégica</label>
              <div className="relative">
                <MapPin className="absolute left-5 top-4 text-slate-600" size={18} />
                <textarea 
                  required
                  rows={2}
                  placeholder="Calle, número, colonia, CP..."
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-medium text-xs outline-none focus:border-[#D4AF37] resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">WhatsApp Concierge</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Director de Nodo</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input 
                    required
                    type="text"
                    value={formData.manager}
                    onChange={e => setFormData({...formData, manager: e.target.value})}
                    className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Estado de Operación</label>
              <select 
                className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37] appearance-none"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="ACTIVE">OPERATIVO (Acceso Público)</option>
                <option value="INACTIVE">MANTENIMIENTO (Nodo Bloqueado)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
            <button type="button" onClick={onClose} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Abortar</button>
            <button type="submit" className="gold-btn text-black px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3">
              <Check size={18} /> {initialData ? 'Sincronizar Nodo' : 'Confirmar Integración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
