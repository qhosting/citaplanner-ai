
import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, FileText, Tag, BarChart3 } from 'lucide-react';
import { Lead, LeadSource, LeadStatus } from '../types';

interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Lead>) => void;
    initialData?: Lead;
}

export const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<Partial<Lead>>({
        name: '',
        phone: '',
        email: '',
        source: 'MANUAL',
        status: 'NEW',
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                phone: '',
                email: '',
                source: 'MANUAL',
                status: 'NEW',
                notes: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-entrance">
                <div className="flex justify-between items-center p-10 border-b border-white/5">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                            {initialData ? 'Edit Lead' : 'New Prospect'} <span className="gold-text-gradient italic">Nexus</span>
                        </h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 px-1">Lead Intelligence Profile</p>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-14 pr-6 py-5 bg-black border border-white/5 rounded-2xl text-white font-bold text-sm outline-none focus:border-[#CE4676] transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Teléfono Móvil</label>
                            <div className="relative">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                <input
                                    type="text"
                                    required
                                    placeholder="521... "
                                    className="w-full pl-14 pr-6 py-5 bg-black border border-white/5 rounded-2xl text-white font-bold text-sm outline-none focus:border-[#CE4676] transition-all"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Email (Opcional)</label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                            <input
                                type="email"
                                className="w-full pl-14 pr-6 py-5 bg-black border border-white/5 rounded-2xl text-white font-bold text-sm outline-none focus:border-[#CE4676] transition-all"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Fuente de Origen</label>
                            <div className="relative">
                                <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                <select
                                    className="w-full pl-14 pr-6 py-5 bg-black border border-white/5 rounded-2xl text-white font-bold text-sm outline-none focus:border-[#CE4676] appearance-none"
                                    value={formData.source}
                                    onChange={e => setFormData({ ...formData, source: e.target.value as LeadSource })}
                                >
                                    <option value="MANUAL">Manual</option>
                                    <option value="FACEBOOK">Facebook Ads</option>
                                    <option value="WHATSAPP">WhatsApp</option>
                                    <option value="INSTAGRAM">Instagram</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Estatus del Funnel</label>
                            <div className="relative">
                                <BarChart3 className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                <select
                                    className="w-full pl-14 pr-6 py-5 bg-black border border-white/5 rounded-2xl text-white font-bold text-sm outline-none focus:border-[#CE4676] appearance-none"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                                >
                                    <option value="NEW">Nuevo Lead</option>
                                    <option value="CONTACTED">Contactado</option>
                                    <option value="INTERESTED">Interesado</option>
                                    <option value="CONVERTED">Convertido</option>
                                    <option value="LOST">Perdido</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-2">Notas de Seguimiento</label>
                        <div className="relative">
                            <FileText className="absolute left-5 top-8 text-zinc-600" size={18} />
                            <textarea
                                rows={4}
                                className="w-full pl-14 pr-6 py-5 bg-black border border-white/5 rounded-2xl text-white font-medium text-sm outline-none focus:border-[#CE4676] transition-all resize-none"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full bg-[#CE4676] hover:bg-[#A3345A] text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-[0_10px_40px_rgba(206,70,118,0.3)] active:scale-[0.98]"
                        >
                            <div className="flex items-center justify-center gap-3">
                                <Save size={18} />
                                {initialData ? 'Actualizar Inteligencia' : 'Inyectar Prospecto'}
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
