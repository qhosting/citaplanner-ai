
import React, { useState, useMemo } from 'react';
import {
    Phone, Mail, Plus, Search, Loader2, FileText, Zap,
    Filter, UserCheck, Star, ShieldCheck, MoreHorizontal,
    Calendar, Trash2, Edit2, Globe, MessageSquare, Scale, ShieldAlert,
    Facebook, MessageCircle, UserPlus, ArrowRightLeft, ExternalLink, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Lead, LeadStatus, LeadSource } from '../types';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadModal } from '../components/LeadModal';

export const LeadsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);

    const { data: leads = [], isLoading } = useQuery({
        queryKey: ['leads'],
        queryFn: api.getLeads
    });

    const mutation = useMutation({
        mutationFn: (data: Partial<Lead>) => {
            if (editingLead) return api.updateLead({ ...editingLead, ...data } as Lead);
            return api.createLead(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            setIsModalOpen(false);
            setEditingLead(undefined);
            toast.success("Estructura de prospección actualizada.");
        }
    });

    const convertMutation = useMutation({
        mutationFn: (id: string) => api.convertLead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success("¡Lead convertido a Socio con éxito!");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.deleteLead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast.success("Prospecto eliminado del embudo.");
        }
    });

    const filteredLeads = useMemo(() => {
        return leads.filter(l =>
            l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.phone.includes(searchTerm) ||
            l.status.includes(searchTerm.toUpperCase())
        );
    }, [leads, searchTerm]);

    const getStatusInfo = (status: LeadStatus) => {
        switch (status) {
            case 'NEW': return { label: 'Nuevo Lead', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Zap };
            case 'CONTACTED': return { label: 'Contactado', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Phone };
            case 'INTERESTED': return { label: 'Interesado', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Star };
            case 'CONVERTED': return { label: 'Convertido', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', icon: UserCheck };
            case 'LOST': return { label: 'Perdido', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: ShieldAlert };
            default: return { label: status, color: 'text-slate-500', bg: 'bg-slate-500/10', icon: MoreHorizontal };
        }
    };

    const getSourceIcon = (source: LeadSource) => {
        switch (source) {
            case 'FACEBOOK': return <Facebook className="text-blue-600" size={18} />;
            case 'WHATSAPP': return <MessageCircle className="text-emerald-500" size={18} />;
            case 'INSTAGRAM': return <Globe className="text-pink-500" size={18} />;
            default: return <UserPlus className="text-slate-500" size={18} />;
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

    return (
        <>
        <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-1 h-10 bg-[#CE4676] rounded-full shadow-[0_0_20px_#CE4676]"></div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                            Leads <span className="gold-text-gradient font-light">Nexus</span>
                        </h1>
                    </div>
                    <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Conversion Funnel • Facebook & WhatsApp Inbound</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            const webhookUrl = `${window.location.origin}/api/leads/webhook`;
                            navigator.clipboard.writeText(JSON.stringify({
                                url: webhookUrl,
                                examplePayload: {
                                    name: "Nombre del Lead",
                                    phone: "521... ",
                                    source: "WHATSAPP",
                                    notes: "Campaña Facebook"
                                }
                            }, null, 2));
                            toast.success("Credenciales de Webhook (n8n) copiadas al portapapeles.");
                        }}
                        className="bg-white/5 text-slate-300 hover:text-white px-6 py-5 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest border border-white/5 transition-all"
                    >
                        <RefreshCw size={16} /> Webhook Meta/n8n
                    </button>
                    <button
                        onClick={() => { setEditingLead(undefined); setIsModalOpen(true); }}
                        className="gold-btn text-black px-10 py-5 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-2xl transition-all active:scale-95"
                    >
                        <Plus size={18} /> Agregar Lead Manual
                    </button>
                </div>
            </div>

            <div className="glass-card p-4 rounded-[3.5rem] border-white/5 mb-16 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o canal de origen..."
                        className="w-full pl-16 pr-6 py-6 bg-black/20 border border-white/5 rounded-3xl text-white outline-none focus:border-[#CE4676]/30 transition-all font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredLeads.map(lead => {
                    const status = getStatusInfo(lead.status);
                    return (
                        <div key={lead.id} className="glass-card p-10 rounded-[4rem] border-white/5 hover:border-[#CE4676]/20 transition-all group flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                                {getSourceIcon(lead.source)}
                            </div>

                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                                        {getSourceIcon(lead.source)}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 ${status.bg}`}>
                                    <status.icon size={12} className={status.color} />
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
                                </div>
                            </div>

                            <div className="mb-10 relative z-10">
                                <h3 className="font-black text-2xl text-white tracking-tighter uppercase leading-tight group-hover:text-[#CE4676] transition-colors">{lead.name}</h3>
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mt-2">{lead.phone}</p>
                            </div>

                            {lead.notes && (
                                <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-zinc-500 font-medium italic">"{lead.notes}"</p>
                                </div>
                            )}

                            <div className="pt-8 border-t border-white/5 flex gap-4 mt-auto relative z-10">
                                {lead.status !== 'CONVERTED' && (
                                    <button
                                        onClick={() => convertMutation.mutate(lead.id)}
                                        className="flex-1 bg-emerald-500 text-black py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ArrowRightLeft size={14} /> Convertir
                                    </button>
                                )}
                                <button onClick={() => { setEditingLead(lead); setIsModalOpen(true); }} className="p-4 bg-white/5 text-slate-500 hover:text-white rounded-2xl transition-all border border-white/5">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => window.confirm("¿Eliminar prospecto?") && deleteMutation.mutate(lead.id)} className="p-4 bg-white/5 text-slate-500 hover:text-rose-500 rounded-2xl transition-all border border-white/5">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            </div>

            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(data) => mutation.mutate(data)}
                initialData={editingLead}
            />
        </>
    );
};
