
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Clock, User, Plus, Mic, Activity, 
  Sparkles, Send, DollarSign, Users, TrendingUp, MapPin, Loader2, Globe, Link2, MessageSquare,
  Zap, BrainCircuit
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SmartScheduler } from '../components/SmartScheduler';
import { AppointmentModal } from '../components/AppointmentModal';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { EnergyMonitor } from '../components/EnergyMonitor';
import { Skeleton } from '../components/Skeleton';
import { Appointment, AppointmentStatus } from '../types';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: api.getAppointments,
  });

  const { data: integrationStatus = [] } = useQuery({
    queryKey: ['integrationStatus'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/integrations/status');
      return res.json();
    },
    refetchInterval: 5000
  });

  const createMutation = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['integrationStatus'] });
      toast.success("Cita sincronizada con éxito en la red global");
    }
  });

  const filteredAppointments = useMemo(() => {
    return [...appointments]
      .filter(a => a.status !== AppointmentStatus.CANCELLED)
      .sort((a,b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      .slice(0, 5);
  }, [appointments]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-1 h-10 bg-gradient-to-b from-[#D4AF37] to-transparent rounded-full shadow-[0_0_20px_#D4AF37]"></div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Console <span className="gold-text-gradient font-light italic">Master</span>
            </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.5em] text-[10px] ml-5">Network Operation Center • Aurum Infrastructure</p>
        </div>
        <div className="flex gap-4">
            <button 
              onClick={() => setIsVoiceOpen(true)} 
              className="glass-card text-white px-8 py-5 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-3 font-black text-[9px] uppercase tracking-widest border border-white/5 shadow-2xl"
            >
              <Mic size={18} className="text-[#D4AF37]" /> AI Concierge
            </button>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="gold-btn text-black px-10 py-5 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest"
            >
              <Plus size={18} /> Nueva Cita Elite
            </button>
        </div>
      </div>

      <div className="mb-16">
        <EnergyMonitor />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          <div className="glass-card p-1.5 rounded-[3.5rem] border-[#D4AF37]/5">
            <SmartScheduler onAddAppointment={(apt) => createMutation.mutate(apt)} />
          </div>
          
          <section>
            <div className="flex justify-between items-center mb-10 px-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                  <CalendarIcon className="text-[#D4AF37]" size={28} /> Agenda de Operaciones
                </h2>
                <button onClick={() => navigate('/schedules')} className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-[#D4AF37] transition-all">Ver Matriz Completa</button>
            </div>

            {isLoading ? (
               <div className="space-y-6"><Skeleton className="h-32 w-full rounded-[3rem]" /><Skeleton className="h-32 w-full rounded-[3rem]" /></div>
            ) : (
              <div className="space-y-6">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-24 glass-card rounded-[3.5rem] border-dashed border-white/10">
                    <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[10px]">Esperando sincronización de datos...</p>
                  </div>
                ) : (
                  filteredAppointments.map((apt) => (
                    <div key={apt.id} className="glass-card p-10 rounded-[3.5rem] flex flex-col sm:flex-row gap-10 items-center group relative overflow-hidden glass-card-hover transition-all">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]" />
                      <div className="flex-grow">
                        <h3 className="font-black text-2xl text-white tracking-tight">{apt.title}</h3>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{apt.clientName}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-[#D4AF37]">{new Date(apt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-1 space-y-10">
           {/* Integrations Monitor */}
           <div className="glass-card rounded-[3.5rem] p-10 relative overflow-hidden group border border-emerald-500/10 h-full">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-[80px]" />
              <h3 className="font-black text-white text-[10px] uppercase tracking-[0.5em] mb-10 flex items-center gap-3">
                <Link2 size={20} className="text-emerald-500" /> Monitor de Integraciones
              </h3>
              <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {integrationStatus.map((log, idx) => (
                    <div key={idx} className="p-5 bg-white/5 rounded-[2rem] border border-white/5 group-hover:border-white/10 transition-all">
                       <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                             {log.event_type.includes('AI') ? <BrainCircuit size={16} className="text-[#D4AF37]" /> : <MessageSquare size={16} className="text-emerald-500" />}
                             <span className="text-[9px] font-black text-white uppercase tracking-widest">{log.platform}</span>
                          </div>
                          <span className="text-[8px] text-slate-600 font-bold">{new Date(log.created_at).toLocaleTimeString()}</span>
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2">{log.event_type.replace(/_/g, ' ')}</p>
                       {log.response && (
                         <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-300 italic leading-relaxed">"{JSON.parse(log.response).aiResponse || 'Sincronización OK'}"</p>
                         </div>
                       )}
                    </div>
                ))}
                {integrationStatus.length === 0 && (
                  <p className="text-center text-slate-600 text-[10px] font-black uppercase py-20">No hay actividad en la red</p>
                )}
              </div>
           </div>
        </div>
      </div>

      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={(apt) => createMutation.mutate(apt)} />
      <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} onAppointmentCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
          queryClient.invalidateQueries({ queryKey: ['integrationStatus'] });
      }} />
    </div>
  );
};
