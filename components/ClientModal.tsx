
import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, Activity, ShieldAlert, Sparkles, Check, Heart } from 'lucide-react';
import { Client } from '../types';

import { createPortal } from 'react-dom';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  initialData?: Client;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
    skinType: '',
    allergies: '',
    medicalConditions: '',
    notes: ''
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      if (initialData) setFormData(initialData);
      else setFormData({ name: '', phone: '', email: '', birthDate: '', skinType: '', allergies: '', medicalConditions: '', notes: '' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="glass-card w-full max-w-2xl rounded-[1.75rem] overflow-hidden border-[#D4AF37]/20 animate-scale-in">
        <div className="px-5 py-4 sm:px-6 sm:py-5 md:px-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-black border border-[#D4AF37]/30 text-[#D4AF37]">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white tracking-tight uppercase">
                {initialData ? 'Actualizar Socio' : 'Registrar Socio Elite'}
              </h3>
              <p className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Ecosistema Aurum • CRM Master</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-full transition-all border border-white/5 cursor-pointer shrink-0">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[9.5px] font-black text-[#D4AF37] uppercase tracking-wider mb-2">Identidad Básica</h4>
              <div>
                <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="Ej: Valentina Rosales" />
                </div>
              </div>
              <div>
                <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">WhatsApp Concierge</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="+52..." />
                </div>
              </div>
              <div>
                <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Email de Prestigio</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="socio@aurum.mx" />
                </div>
              </div>
              <div>
                <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Fecha de Nacimiento (Eventos)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[9.5px] font-black text-[#D4AF37] uppercase tracking-wider mb-2">Perfil Biométrico</h4>
              <div>
                <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Tipo de Piel (Fitzpatrick)</label>
                <div className="relative">
                  <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input type="text" value={formData.skinType} onChange={e => setFormData({ ...formData, skinType: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="Ej: Tipo III - Oleosa" />
                </div>
              </div>
              <div>
                <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Alergias / Restricciones</label>
                <div className="relative">
                  <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input type="text" value={formData.allergies} onChange={e => setFormData({ ...formData, allergies: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white font-bold text-xs outline-none focus:border-red-500/30" placeholder="Látex, Níquel..." />
                </div>
              </div>
              <div>
                <label className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">Notas de Atención</label>
                <textarea rows={4} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 bg-black/40 border border-white/5 rounded-xl text-white font-medium text-xs outline-none focus:border-[#D4AF37] resize-none" placeholder="Preferencias de café, música, historial..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
            <button type="button" onClick={onClose} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-wider">Abortar</button>
            <button type="submit" className="gold-btn text-black px-6 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-xl">
              <Check size={14} /> {initialData ? 'Sincronizar Perfil' : 'Confirmar Membresía'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
