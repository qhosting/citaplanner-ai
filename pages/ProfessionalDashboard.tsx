
import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, User, CheckCircle2, 
  Loader2, AlertCircle, StickyNote, History, Zap, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Appointment, AppointmentStatus } from '../types';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');

  // Carga Real de la Agenda del Profesional
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['pro-appointments', user?.relatedId],
    queryFn: () => api.getProfessionalAppointments(user?.relatedId || ''),
    enabled: !!user?.relatedId
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string, notes: string }) => api.completeAppointment(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pro-appointments'] });
      toast.success("Tratamiento finalizado y registrado en el historial del cliente.");
      setSelectedApt(null);
      setNotes('');
    },
    onError: () => {
      toast.error("Error al finalizar el tratamiento.");
    }
  });

  const todayStr = new Date().toLocaleDateString();
  
  const todayAppointments = useMemo(() => 
    appointments.filter(a => new Date(a.startDateTime).toLocaleDateString() === todayStr)
  , [appointments, todayStr]);

  const upcoming = useMemo(() => 
    appointments.filter(a => a.status === AppointmentStatus.SCHEDULED)
  , [appointments]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Staff <span className="gold-text-gradient font-light">Console</span>
            </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.5em] text-[10px] ml-5">Professional Workspace • Aurum Network</p>
        </div>
        <div className="flex items-center gap-6 bg-white/5 px-8 py-4 rounded-[2rem] border border-white/5">
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Especialista</p>
                <p className="text-lg font-black text-white">{user?.name}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#111] to-black border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-black">
                {user?.avatar || user?.name.charAt(0)}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Agenda Section */}
        <div className="lg:col-span-8 space-y-12">
           <section>
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                   <CalendarIcon className="text-[#D4AF37]" size={28} /> Agenda de Hoy
                 </h2>
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">{todayAppointments.length} Sesiones</span>
              </div>

              <div className="space-y-6">
                {todayAppointments.length === 0 ? (
                  <div className="glass-card p-20 rounded-[3.5rem] border-dashed border-white/10 text-center">
                    <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">No hay citas programadas para hoy</p>
                  </div>
                ) : (
                  todayAppointments.map(apt => (
                    <div key={apt.id} className="glass-card p-8 rounded-[3rem] group relative overflow-hidden transition-all hover:border-[#D4AF37]/30">
                       <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                          <div className="flex gap-8 items-center">
                             <div className="text-center min-w-[80px]">
                                <p className="text-2xl font-black text-white">{new Date(apt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Inicia</p>
                             </div>
                             <div className="h-10 w-px bg-white/5 hidden md:block" />
                             <div>
                                <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-[#D4AF37] transition-colors">{apt.title}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><User size={14} /> {apt.clientName}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/30" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Confirmada</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                             {apt.status === AppointmentStatus.SCHEDULED ? (
                               <button 
                                 onClick={() => setSelectedApt(apt)}
                                 className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#D4AF37]/10"
                               >
                                 Atender y Finalizar
                               </button>
                             ) : (
                               <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/20">
                                  <CheckCircle2 size={16} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Completado</span>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
           </section>

           <section>
              <h2 className="text-xl font-black text-slate-700 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
                <History size={24} /> Próximas Sesiones Semanales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {upcoming.filter(a => new Date(a.startDateTime).toLocaleDateString() !== todayStr).slice(0, 4).map(apt => (
                   <div key={apt.id} className="glass-card p-6 rounded-[2.5rem] border-white/5 flex justify-between items-center group">
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{new Date(apt.startDateTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <h4 className="font-black text-white group-hover:text-[#D4AF37] transition-colors">{apt.title}</h4>
                      </div>
                      <span className="text-[10px] font-black text-slate-700">{new Date(apt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                 ))}
              </div>
           </section>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-10">
           
           {/* Summary Stats */}
           <div className="glass-card p-10 rounded-[3.5rem] bg-gradient-to-tr from-[#050505] to-[#0a0a0a] border-[#D4AF37]/5">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-10 flex items-center gap-3">
                <Zap className="text-[#D4AF37]" size={20} /> Métricas de Desempeño
              </h3>
              <div className="space-y-8">
                 <div className="flex justify-between items-end">
                    <div>
                        <p className="text-5xl font-black text-white tracking-tighter">{todayAppointments.filter(a => a.status === 'COMPLETED').length}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Sesiones Finalizadas Hoy</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#D4AF37]">
                        <CheckCircle2 size={24} />
                    </div>
                 </div>
                 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]" style={{ width: '75%' }} />
                 </div>
              </div>
           </div>

           {/* Quick Tools */}
           <div className="glass-card p-10 rounded-[3.5rem]">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-8">Herramientas Operativas</h3>
              <div className="space-y-4">
                 <button className="w-full flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-[#D4AF37]/30 transition-all text-left">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Ver Inventario Staff</span>
                    <Sparkles size={16} className="text-[#D4AF37]" />
                 </button>
                 <button className="w-full flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-[#D4AF37]/30 transition-all text-left">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Protocolos de Lujo</span>
                    <StickyNote size={16} className="text-slate-600" />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Complete Appointment Modal */}
      {selectedApt && (
        <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-2xl rounded-[3.5rem] p-12 border-[#D4AF37]/20 animate-scale-in">
             <div className="flex justify-between items-start mb-10">
                <div>
                  <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.5em] mb-3 block">Finalizar Tratamiento Elite</span>
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{selectedApt.title}</h2>
                  <p className="text-slate-500 font-bold mt-2">Cliente: {selectedApt.clientName}</p>
                </div>
                <button onClick={() => setSelectedApt(null)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white"><AlertCircle size={24}/></button>
             </div>

             <div className="space-y-8">
                <div>
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Notas Técnicas y Seguimiento (Expediente Clínico)</label>
                   <textarea 
                     rows={6}
                     value={notes}
                     onChange={e => setNotes(e.target.value)}
                     placeholder="Describe el resultado, pigmentos usados, profundidad y recomendaciones para el cliente..."
                     className="w-full bg-black/40 border border-white/10 rounded-[2.5rem] p-8 text-white outline-none focus:border-[#D4AF37] transition-all resize-none font-medium leading-relaxed"
                   />
                </div>
                
                <div className="flex items-center gap-4 bg-[#D4AF37]/5 p-6 rounded-[2rem] border border-[#D4AF37]/10">
                   <div className="p-3 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37]"><Zap size={20}/></div>
                   <p className="text-xs text-slate-400 font-medium">Al completar, se otorgarán <b>100 créditos Aurum</b> al cliente automáticamente.</p>
                </div>

                <div className="flex gap-6 pt-6">
                   <button 
                    onClick={() => setSelectedApt(null)}
                    className="flex-1 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                   >
                     Cancelar
                   </button>
                   <button 
                    onClick={() => completeMutation.mutate({ id: selectedApt.id, notes })}
                    disabled={completeMutation.isPending || !notes.trim()}
                    className="flex-[2] gold-btn py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 disabled:opacity-50"
                   >
                     {completeMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                     Confirmar Finalización
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
