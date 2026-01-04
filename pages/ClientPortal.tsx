
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Plus, History, MapPin, Sparkles, 
  User, Heart, Loader2, XCircle, 
  MessageSquare, ShieldCheck, Zap, Wand2, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Appointment, AppointmentStatus, LandingSettings } from '../types';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';

export const ClientPortal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Queries Reales
  const { data: allAppointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: api.getAppointments
  });

  useEffect(() => {
    api.getLandingSettings().then(setSettings);
  }, []);

  const myAppointments = useMemo(() => {
    return allAppointments.filter(a => a.clientPhone === user?.phone);
  }, [allAppointments, user]);

  const upcoming = useMemo(() => 
    myAppointments.filter(a => new Date(a.startDateTime) > new Date() && a.status === AppointmentStatus.SCHEDULED)
    .sort((a,b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
  , [myAppointments]);

  const history = useMemo(() => 
    myAppointments.filter(a => new Date(a.startDateTime) <= new Date() || a.status !== AppointmentStatus.SCHEDULED)
    .sort((a,b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
  , [myAppointments]);

  // IA con contexto real del negocio
  useEffect(() => {
    const getBeautyAdvice = async () => {
        if (!user || myAppointments.length === 0 || loadingAdvice || !settings) return;
        setLoadingAdvice(true);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        try {
          const lastApt = history.find(a => a.status === AppointmentStatus.COMPLETED);
          const bizName = settings.businessName || 'nuestro estudio';
          const prompt = `Como concierge experto de "${bizName}" de ultra-lujo, analiza la última visita de ${user.name}: "${lastApt?.title || 'Tratamiento Elite'}". Sugiere un consejo de mantenimiento sofisticado para su tipo de piel. Sé elegante y breve. Máximo 20 palabras.`;
          
          const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
          });
          setAiAdvice(result.text);
        } catch (e) { console.error(e); } finally { setLoadingAdvice(false); }
    };
    if (history.length > 0 && settings) getBeautyAdvice();
  }, [history, user, loadingAdvice, myAppointments.length, settings]);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Tu cita ha sido cancelada exitosamente.");
    },
    onError: () => {
      toast.error("No se pudo procesar la cancelación. Contacta al soporte.");
    }
  });

  if (isLoading || !settings) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 animate-entrance">
      
      {/* Membership Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 gap-12">
        <div className="flex items-center gap-10">
            <div className="relative group">
                <div className="w-36 h-36 rounded-full border border-[#D4AF37]/30 p-2 bg-gradient-to-tr from-[#111] to-black shadow-2xl">
                    <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center text-6xl font-black gold-text-gradient group-hover:scale-105 transition-transform duration-700">
                        {user?.name.charAt(0)}
                    </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#D4AF37] p-2.5 rounded-full shadow-[0_0_25px_#D4AF37] animate-pulse">
                  <Sparkles className="text-black" size={20} />
                </div>
            </div>
            <div>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#D4AF37] mb-3 block opacity-80">Elite Network Membership</span>
                <h1 className="text-7xl font-black text-white tracking-tighter uppercase leading-none">{user?.name.split(' ')[0]}</h1>
                <div className="flex items-center gap-4 mt-6">
                    <span className="px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">Partner Gold</span>
                    <span className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[9px]">ID: {user?.phone}</span>
                </div>
            </div>
        </div>
        <button 
          onClick={() => navigate('/book')}
          className="gold-btn px-16 py-6 rounded-[2.5rem] flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] active:scale-95"
        >
          <Plus size={20} /> Solicitar Experiencia
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left Column (Stats & AI) */}
        <div className="lg:col-span-4 space-y-12">
            
            {/* AI Concierge */}
            <div className="glass-card rounded-[3.5rem] p-12 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-56 h-56 bg-[#D4AF37]/5 rounded-full blur-[80px]" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-[#D4AF37]/10 rounded-2xl text-[#D4AF37] border border-[#D4AF37]/10">
                          <Wand2 size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Concierge <span className="text-white">Active</span></span>
                    </div>
                    {loadingAdvice ? (
                        <div className="space-y-4"><div className="h-3 w-full bg-white/5 animate-pulse rounded-full" /><div className="h-3 w-2/3 bg-white/5 animate-pulse rounded-full" /></div>
                    ) : aiAdvice ? (
                        <p className="text-2xl font-light text-slate-200 leading-tight italic tracking-tight">"{aiAdvice}"</p>
                    ) : (
                        <p className="text-slate-600 italic font-medium">Sincronizando sus preferencias de lujo...</p>
                    )}
                </div>
            </div>

            {/* Loyalty Points Reales */}
            <div className="glass-card rounded-[3.5rem] p-12 border-[#D4AF37]/5 bg-gradient-to-tr from-[#050505] to-[#0a0a0a]">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="font-black text-white text-[10px] uppercase tracking-[0.4em] flex items-center gap-3">
                      <Zap size={20} className="text-[#D4AF37]" /> Wallet Aurum
                  </h3>
                </div>
                <div className="space-y-8">
                    <div className="flex justify-between items-end">
                        <span className="text-6xl font-black text-white tracking-tighter">{(user as any)?.loyalty_points || '0'}</span>
                        <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-3">Créditos de Belleza</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div style={{ width: `${Math.min(100, (((user as any)?.loyalty_points || 0) / 2000) * 100)}%` }} className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F1C40F] shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                    </div>
                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.3em] text-center">Próximo beneficio: Platinum (2,000 pts)</p>
                </div>
            </div>

            {/* Node Info Dinámico */}
            <div className="glass-card rounded-[3.5rem] p-12">
                <div className="space-y-10">
                    <div className="flex gap-6 items-start">
                        <div className="p-4 bg-white/5 rounded-3xl text-[#D4AF37] border border-white/5"><MapPin size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Master Node</p>
                            <span className="text-sm text-slate-400 font-medium leading-relaxed block max-w-[200px]">{settings.address || 'Ubicación central'}</span>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-white/5">
                        <button 
                          onClick={() => window.open(`https://wa.me/${settings.contactPhone?.replace(/\D/g,'')}`)}
                          className="flex items-center justify-center gap-3 w-full bg-white/5 text-slate-400 py-4 rounded-[2rem] font-black text-[9px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all border border-white/5"
                        >
                           <MessageSquare size={16} /> WhatsApp Directo
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column (Appointments) */}
        <div className="lg:col-span-8 space-y-20">
            <section>
                <div className="flex justify-between items-end mb-12">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                      <Calendar className="text-[#D4AF37]" size={32} /> Próximas Sesiones
                  </h2>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-1">{upcoming.length} Reserva(s)</span>
                </div>
                
                {upcoming.length === 0 ? (
                    <div className="glass-card p-24 rounded-[4rem] border-dashed border-white/10 text-center group">
                        <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px] mb-10">No tienes citas programadas</p>
                        <button onClick={() => navigate('/book')} className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4AF37] border border-[#D4AF37]/30 px-10 py-5 rounded-[2rem] hover:bg-[#D4AF37] hover:text-black transition-all group-hover:scale-105">Solicitar acceso a agenda</button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {upcoming.map(apt => (
                            <div key={apt.id} className="glass-card p-12 rounded-[4rem] relative overflow-hidden group glass-card-hover transition-all duration-700">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#D4AF37] to-transparent" />
                                <div className="flex flex-col md:flex-row justify-between gap-12">
                                    <div className="flex gap-10 items-center">
                                        <div className="bg-[#0a0a0a] rounded-[2.5rem] p-10 text-center min-w-[140px] border border-white/5 shadow-2xl">
                                            <span className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-2">{new Date(apt.startDateTime).toLocaleString('es-ES', { month: 'short' })}</span>
                                            <span className="block text-5xl font-black text-white tracking-tighter">{new Date(apt.startDateTime).getDate()}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <h3 className="font-black text-3xl text-white tracking-tight group-hover:text-[#D4AF37] transition-colors">{apt.title}</h3>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            </div>
                                            <div className="flex flex-wrap gap-12 text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                                <span className="flex items-center gap-3"><Clock size={18} className="text-slate-700" /> {new Date(apt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="flex items-center gap-3"><Globe size={18} className="text-slate-700" /> {settings.businessName} Node</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-white/5 pt-10 md:pt-0 md:pl-12">
                                        <button 
                                            disabled={cancelMutation.isPending}
                                            onClick={() => window.confirm("¿Confirmar cancelación estratégica?") && cancelMutation.mutate(apt.id)}
                                            className="w-14 h-14 bg-white/5 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all flex items-center justify-center border border-white/5"
                                        >
                                            {cancelMutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <XCircle size={28} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* History Section Real */}
            <section>
                <h2 className="text-xl font-black text-slate-700 uppercase tracking-[0.5em] mb-12 flex items-center gap-4">
                    <History size={24} /> Registro Histórico de Belleza
                </h2>
                <div className="glass-card rounded-[3.5rem] overflow-hidden border-white/5 shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="px-12 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">Fecha de Operación</th>
                                <th className="px-12 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">Experiencia</th>
                                <th className="px-12 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length === 0 ? (
                                <tr><td colSpan={3} className="px-12 py-24 text-center text-slate-700 italic uppercase tracking-[0.3em] text-[10px]">Sin visitas anteriores registradas</td></tr>
                            ) : (
                                history.map(apt => (
                                    <tr key={apt.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-12 py-8 text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                                            {new Date(apt.startDateTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-12 py-8">
                                            <p className="font-black text-white text-lg uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">{apt.title}</p>
                                            {apt.description && <p className="text-[10px] text-slate-500 font-medium truncate max-w-xs italic">"{apt.description}"</p>}
                                        </td>
                                        <td className="px-12 py-8 text-center">
                                            <span className={`text-[9px] font-black px-5 py-2 rounded-full uppercase tracking-widest ${
                                                apt.status === AppointmentStatus.COMPLETED ? 'text-[#D4AF37] border border-[#D4AF37]/30' : 
                                                apt.status === AppointmentStatus.CANCELLED ? 'text-red-500 border border-red-500/20' :
                                                'text-slate-600 border border-white/5'
                                            }`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};
