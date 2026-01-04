
import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, Activity, ShieldAlert, Sparkles, Check, Heart } from 'lucide-react';
import { Client } from '../types';

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

  useEffect(() => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-2xl rounded-[3.5rem] overflow-hidden border-[#D4AF37]/20 animate-scale-in">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-black border border-[#D4AF37]/30 text-[#D4AF37]">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-white tracking-tighter uppercase">
                {initialData ? 'Actualizar Socio' : 'Registrar Socio Elite'}
              </h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ecosistema Aurum • CRM Master</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
               <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-4">Identidad Básica</h4>
               <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="Ej: Valentina Rosales" />
                  </div>
               </div>
               <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">WhatsApp Concierge</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="+52..." />
                  </div>
               </div>
               <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email de Prestigio</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="socio@aurum.mx" />
                  </div>
               </div>
               <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Fecha de Nacimiento (Eventos)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" />
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-4">Perfil Biométrico</h4>
               <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Tipo de Piel (Fitzpatrick)</label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input type="text" value={formData.skinType} onChange={e => setFormData({...formData, skinType: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37]" placeholder="Ej: Tipo III - Oleosa" />
                  </div>
               </div>
               <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Alergias / Restricciones</label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input type="text" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-red-500/30" placeholder="Látex, Níquel..." />
                  </div>
               </div>
               <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Notas de Atención</label>
                  <textarea rows={4} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white font-medium text-xs outline-none focus:border-[#D4AF37] resize-none" placeholder="Preferencias de café, música, historial..." />
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
            <button type="button" onClick={onClose} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Abortar</button>
            <button type="submit" className="gold-btn text-black px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3">
              <Check size={18} /> {initialData ? 'Sincronizar Perfil' : 'Confirmar Membresía'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
