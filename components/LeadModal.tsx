
import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, FileText, Tag, BarChart3, TrendingUp, Zap, MessageSquare, Star } from 'lucide-react';
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
        notes: '',
        estimatedValue: 0,
        interestLevel: 'MEDIUM',
        preferredContact: 'WHATSAPP'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                estimatedValue: (initialData as any).estimatedValue || 0,
                interestLevel: (initialData as any).interestLevel || 'MEDIUM',
                preferredContact: (initialData as any).preferredContact || 'WHATSAPP'
            });
        } else {
            setFormData({
                name: '',
                phone: '',
                email: '',
                source: 'MANUAL',
                status: 'NEW',
                notes: '',
                estimatedValue: 0,
                interestLevel: 'MEDIUM',
                preferredContact: 'WHATSAPP'
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-12 overflow-y-auto">
            <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />

            <div className="relative w-full max-w-3xl bg-zinc-950 border border-white/10 rounded-[4rem] overflow-hidden shadow-[0_0_150px_rgba(206,70,118,0.2)] animate-entrance my-auto">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CE4676] to-transparent opacity-50" />

                <div className="flex justify-between items-center p-12 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-[#CE4676]/10 rounded-xl">
                                <Zap size={18} className="text-[#CE4676]" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                                {initialData ? 'Sincronizar Lead' : 'Inyectar Prospecto'} <span className="gold-text-gradient italic font-light">Nexus</span>
                            </h2>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] ml-1">Protocolo de Prospección • Alta Prioridad</p>
                    </div>
                    <button onClick={onClose} className="group p-4 bg-white/5 hover:bg-rose-500/10 rounded-3xl text-zinc-500 hover:text-rose-500 transition-all border border-white/5">
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-12 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {/* Basic Info Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-3 flex items-center gap-2">
                                <User size={12} /> Identidad del Prospecto
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Nombre completo... "
                                className="w-full px-8 py-6 bg-black border border-white/5 rounded-[2.5rem] text-white font-black text-xs outline-none focus:border-[#CE4676]/40 focus:ring-4 ring-[#CE4676]/5 transition-all shadow-inner"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-3 flex items-center gap-2">
                                <Phone size={12} /> Contacto Directo (Global)
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="+52... "
                                className="w-full px-8 py-6 bg-black border border-white/5 rounded-[2.5rem] text-white font-black text-xs outline-none focus:border-[#CE4676]/40 transition-all font-mono shadow-inner"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Secondary Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-3 flex items-center gap-2">
                                <Mail size={12} /> Email de Respaldo
                            </label>
                            <input
                                type="email"
                                placeholder="nexus@client.com"
                                className="w-full px-8 py-6 bg-black border border-white/5 rounded-[2.5rem] text-white font-bold text-xs outline-none focus:border-white/20 transition-all"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-3 flex items-center gap-2">
                                <TrendingUp size={12} /> Valor Estimado (MXN)
                            </label>
                            <div className="relative">
                                <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-emerald-500">$</span>
                                <input
                                    type="number"
                                    className="w-full pl-12 pr-8 py-6 bg-black border border-white/5 rounded-[2.5rem] text-white font-black text-xs outline-none focus:border-emerald-500/30 transition-all"
                                    value={formData.estimatedValue}
                                    onChange={e => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Funnel Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 bg-white/2 p-6 rounded-[2.5rem] border border-white/5">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] block text-center mb-2">Canal de Origen</label>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {['MANUAL', 'FACEBOOK', 'WHATSAPP', 'INSTAGRAM'].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, source: s })}
                                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${formData.source === s ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 bg-white/2 p-6 rounded-[2.5rem] border border-white/5">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] block text-center mb-2">Nivel de Interés</label>
                            <div className="flex gap-2 justify-center">
                                {['LOW', 'MEDIUM', 'HIGH'].map(l => (
                                    <button
                                        key={l}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, interestLevel: l })}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${formData.interestLevel === l ? 'bg-[#D4AF37] border-[#D4AF37] text-black scale-110 shadow-lg shadow-[#D4AF37]/20' : 'bg-transparent border-white/10 text-zinc-600'}`}
                                    >
                                        <Star size={14} fill={formData.interestLevel === l ? 'black' : 'none'} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 bg-white/2 p-6 rounded-[2.5rem] border border-white/5">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] block text-center mb-2">Fase del Embudo</label>
                            <select
                                className="w-full bg-black border border-white/5 rounded-2xl py-3 px-4 text-[9px] font-black text-white uppercase tracking-widest outline-none focus:border-[#CE4676]"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                            >
                                <option value="NEW">Nuevo</option>
                                <option value="CONTACTED">Contactado</option>
                                <option value="INTERESTED">Interesado</option>
                                <option value="CONVERTED">Convertido</option>
                                <option value="LOST">Perdido</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-3 flex items-center gap-2">
                            <FileText size={12} /> Diagnóstico y Notas de Seguimiento
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Antecedentes, necesidades y próximos pasos... "
                            className="w-full px-8 py-6 bg-black border border-white/5 rounded-[3rem] text-white font-medium text-xs outline-none focus:border-[#CE4676]/30 transition-all resize-none shadow-inner"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="pt-8">
                        <button
                            type="submit"
                            className="w-full gold-btn text-black py-8 rounded-[3rem] font-black text-[11px] uppercase tracking-[0.5em] transition-all shadow-[0_20px_50px_rgba(212,175,55,0.2)] active:scale-[0.98] flex items-center justify-center gap-4 group"
                        >
                            <Save size={20} className="group-hover:scale-110 transition-transform" />
                            {initialData ? 'Actualizar Base de Datos' : 'Consolidar Prospecto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

